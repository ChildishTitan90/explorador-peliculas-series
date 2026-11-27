import { Long } from "mongodb";
import { getMongo, getPostgres } from "./databases.js";

// Durable SQL outbox + versioned upserts: retrying never duplicates a review.
export async function syncActivity({ pool = getPostgres(), mongo = getMongo } = {}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const lock = await client.query("SELECT pg_try_advisory_xact_lock(71824019) AS acquired");
    if (!lock.rows[0].acquired) { await client.query("COMMIT"); return; }
    const { rows } = await client.query(
      "SELECT version,entry_id,payload FROM cinepollis.activity_outbox WHERE processed_at IS NULL ORDER BY version LIMIT 50 FOR UPDATE",
    );
    if (rows.length) {
      const collection = (await mongo()).collection("activity");
      for (const row of rows) {
        const p = row.payload;
        const current = await client.query(
          `SELECT e.score,e.review,e.spoiler,e.first_rated_at,u.public_history,
             u.username,u.display_name,u.avatar_url
           FROM cinepollis.entries e JOIN cinepollis.users u ON u.id=e.user_id WHERE e.id=$1`, [row.entry_id],
        );
        const entry = current.rows[0];
        const visible = Boolean(entry?.public_history && entry.score !== null);
        const version = Long.fromString(String(row.version));
        const document = {
          _id: row.entry_id, sourceVersion: version, visible,
          userId: p.userId, titleId: p.titleId, updatedAt: new Date(),
          publishedAt: visible ? new Date(entry.first_rated_at) : null,
          score: visible ? Number(entry.score) : null,
          review: visible ? entry.review : "", spoiler: visible ? entry.spoiler : false,
          actor: visible ? { username: entry.username, displayName: entry.display_name, avatarUrl: entry.avatar_url } : {},
          title: visible ? p.title : {},
        };
        await collection.updateOne({ _id: row.entry_id }, [{ $replaceWith: { $cond: [
          { $lt: [{ $ifNull: ["$sourceVersion", Long.fromInt(-1)] }, version] },
          { $literal: document }, "$$ROOT",
        ] } }], { upsert: true });
        await client.query("UPDATE cinepollis.activity_outbox SET processed_at=clock_timestamp() WHERE version=$1", [row.version]);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { client.release(); }
}

export default async function activity(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  if (request.method !== "GET") {
    response.statusCode = 405;
    response.end(JSON.stringify({ error: "Método no admitido." }));
    return;
  }
  try {
    await syncActivity();
    const url = new URL(request.url, "http://localhost");
    const cursor = url.searchParams.get("cursor");
    let position;
    if (cursor) {
      try {
        position = JSON.parse(Buffer.from(cursor, "base64url").toString());
        if (cursor.length > 400 || !/^[a-f0-9-]{36}$/.test(position.id) || !Number.isFinite(Date.parse(position.date))) throw Error();
      } catch {
        response.statusCode = 400;
        response.end(JSON.stringify({ error: "La página solicitada no es válida." }));
        return;
      }
    }
    const filter = { visible: true };
    if (position) filter.$or = [
      { publishedAt: { $lt: new Date(position.date) } },
      { publishedAt: new Date(position.date), _id: { $lt: position.id } },
    ];
    const documents = await (await getMongo()).collection("activity").find(filter)
      .sort({ publishedAt: -1, _id: -1 }).limit(21).toArray();
    const page = documents.slice(0, 20);
    // Recheck publication against SQL, even if Mongo has an older projection.
    const { rows } = await getPostgres().query(
      `SELECT e.id,e.score,e.review,e.spoiler,u.username,u.display_name
       FROM cinepollis.entries e JOIN cinepollis.users u ON u.id=e.user_id
       WHERE e.id=ANY($1::uuid[]) AND u.public_history AND e.score IS NOT NULL`, [page.map(doc => doc._id)],
    );
    const current = new Map(rows.map(row => [row.id, row]));
    const entries = page.flatMap(doc => {
      const row = current.get(doc._id);
      if (!row || Number(row.score) !== doc.score || row.review !== doc.review || row.spoiler !== doc.spoiler) return [];
      return [{ id: doc._id, actor: { username: row.username, displayName: row.display_name },
        title: doc.title, score: doc.score, review: doc.review, spoiler: doc.spoiler,
        date: doc.publishedAt }];
    });
    const last = page.at(-1);
    const nextCursor = documents.length > 20 && last ? Buffer.from(JSON.stringify({ id: last._id, date: last.publishedAt.toISOString() })).toString("base64url") : null;
    response.end(JSON.stringify({ entries, nextCursor }));
  } catch {
    response.statusCode = 503;
    response.end(JSON.stringify({ error: "No pudimos cargar la comunidad. Intenta nuevamente." }));
  }
}
