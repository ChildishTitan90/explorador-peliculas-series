import { getPostgres } from "./databases.js";
import { currentUser, tokenDigest, readBody, originAllowed, fail } from "./auth.js";
import { tmdbTitle } from "./tmdb.js";
import { syncActivity } from "./activity.js";

async function entries(client, userId) {
  const { rows } = await client.query(
    `SELECT e.id,e.favorite,e.watchlist,e.watched_at,e.score,e.review,e.spoiler,
       e.first_rated_at,t.kind,t.tmdb_id,t.title,t.poster_path,t.backdrop_path,
       t.series_tmdb_id,t.season_number,t.episode_number,t.presentation
     FROM cinepollis.entries e JOIN cinepollis.titles t ON t.id=e.title_id
     WHERE e.user_id=$1 ORDER BY e.updated_at DESC,e.id`, [userId],
  );
  return rows.map((row) => ({
    id: row.id, favorite: row.favorite, watchlist: row.watchlist,
    watchedAt: row.watched_at, score: row.score === null ? null : Number(row.score),
    review: row.review, spoiler: row.spoiler, date: row.first_rated_at,
    item: { ...row.presentation, id: Number(row.tmdb_id), media_type: row.kind,
      title: row.title, poster_path: row.poster_path, backdrop_path: row.backdrop_path,
      seriesId: row.series_tmdb_id === null ? null : Number(row.series_tmdb_id),
      season: row.season_number, episode: row.episode_number },
  }));
}

async function validateSession(client, request, userId) {
  // Login, logout-sensitive writes, and account changes serialize on this row.
  await client.query("SELECT id FROM cinepollis.users WHERE id=$1 FOR UPDATE", [userId]);
  const result = await client.query(
    "SELECT user_id FROM cinepollis.login_sessions WHERE token_hash=$1 AND expires_at>clock_timestamp() AND user_id=$2",
    [tokenDigest(request), userId],
  );
  if (!result.rowCount) fail(401, "Tu sesión terminó. Vuelve a entrar.");
}

async function storeTitle(client, title) {
  const result = await client.query(
    `INSERT INTO cinepollis.titles(kind,tmdb_id,title,poster_path,backdrop_path,
       series_tmdb_id,season_number,episode_number,presentation)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT(kind,tmdb_id) DO UPDATE SET title=excluded.title,
       poster_path=excluded.poster_path,backdrop_path=excluded.backdrop_path,presentation=excluded.presentation
     RETURNING id`,
    [title.kind, title.id, title.title, title.poster, title.backdrop,
      title.seriesId, title.season, title.episode, title.presentation],
  );
  return result.rows[0].id;
}

async function markUnwatched(client, userId, titleId, kind) {
  if (kind === "movie") {
    const rated = await client.query(
      "SELECT score FROM cinepollis.entries WHERE user_id=$1 AND title_id=$2", [userId, titleId],
    );
    if (rated.rows[0]?.score !== null && rated.rows[0]?.score !== undefined) {
      fail(409, "Elimina primero tu calificación para quitar el estado de vista.");
    }
    await client.query("SELECT cinepollis.undo_movie_today($1,$2)", [userId, titleId]);
    const remaining = await client.query(
      "SELECT watched_at FROM cinepollis.entries WHERE user_id=$1 AND title_id=$2", [userId, titleId],
    );
    if (remaining.rows[0]?.watched_at) {
      fail(409, "Este título tiene un historial de vistas anterior o compartido que debes conservar.");
    }
  } else {
    await client.query(
      "UPDATE cinepollis.entries SET watched_at=NULL WHERE user_id=$1 AND title_id=$2", [userId, titleId],
    );
  }
}

async function changeList(client, userId, title, titleId, body) {
  const columns = { favoritos: "favorite", "quiero-ver": "watchlist", "ya-vi": "watched_at" };
  if (!Object.hasOwn(columns, body.list) || typeof body.enabled !== "boolean" || title.kind === "episode") {
    fail(400, "La lista o su valor no son válidos.");
  }
  await client.query(
    "INSERT INTO cinepollis.entries(user_id,title_id) VALUES($1,$2) ON CONFLICT(user_id,title_id) DO NOTHING",
    [userId, titleId],
  );
  const previous = await client.query(
    "SELECT watched_at FROM cinepollis.entries WHERE user_id=$1 AND title_id=$2", [userId, titleId],
  );
  if (body.list === "ya-vi") {
    if (body.enabled && !previous.rows[0].watched_at) {
      if (title.kind === "movie") {
        await client.query("SELECT cinepollis.record_movie($1,$2)", [userId, titleId]);
      } else {
        await client.query(
          "UPDATE cinepollis.entries SET watched_at=clock_timestamp(),watchlist=false WHERE user_id=$1 AND title_id=$2",
          [userId, titleId],
        );
      }
    } else if (!body.enabled && previous.rows[0].watched_at) {
      await markUnwatched(client, userId, titleId, title.kind);
    }
    return;
  }
  if (body.list === "quiero-ver" && body.enabled && previous.rows[0].watched_at) {
    await markUnwatched(client, userId, titleId, title.kind);
  }
  // The column comes only from the fixed mapping above. Values stay parameterized.
  await client.query(
    "UPDATE cinepollis.entries SET " + columns[body.list] + "=$3 WHERE user_id=$1 AND title_id=$2",
    [userId, titleId, body.enabled],
  );
}

async function changeRating(client, userId, title, titleId, body) {
  if (title.kind === "tv") fail(400, "Califica los episodios para obtener el promedio de la serie.");
  if (body.remove === true) {
    await client.query(
      "UPDATE cinepollis.entries SET score=NULL WHERE user_id=$1 AND title_id=$2", [userId, titleId],
    );
    return;
  }
  if (typeof body.score !== "number" || !Number.isFinite(body.score)
    || body.score < 0 || body.score > 5 || !Number.isInteger(body.score * 2)
    || typeof body.review !== "string" || [...body.review].length > 4000 || typeof body.spoiler !== "boolean") {
    fail(400, "Usa una nota de 0 a 5 en pasos de media estrella y una crítica de hasta 4000 caracteres.");
  }
  await client.query(
    `INSERT INTO cinepollis.entries(user_id,title_id,score,review,spoiler) VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(user_id,title_id) DO UPDATE SET score=excluded.score,review=excluded.review,spoiler=excluded.spoiler`,
    [userId, titleId, body.score, body.review.trim(), Boolean(body.review.trim() && body.spoiler)],
  );
}

export default async function account(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  const action = new URL(request.url, "http://localhost").pathname.split("/").pop();
  let client;
  try {
    const user = await currentUser(request);
    if (!user) fail(401, "Inicia sesión para guardar tus historias.");
    const reading = request.method === "GET" && action === "entries";
    const writing = request.method === "POST" && ["list", "rating"].includes(action);
    if (!reading && !writing) fail(405, "Método o ruta no admitidos.");
    if (writing && !originAllowed(request)) fail(403, "Origen de solicitud no permitido.");
    const body = writing ? await readBody(request) : null;
    if (writing && body.userId !== user.id) fail(409, "La cuenta cambió. Recarga tus datos antes de guardar.");
    const title = writing ? await tmdbTitle(body.title) : null;
    client = await getPostgres().connect();
    await client.query("BEGIN");
    await validateSession(client, request, user.id);
    if (writing) {
      const titleId = await storeTitle(client, title);
      if (action === "list") await changeList(client, user.id, title, titleId, body);
      else await changeRating(client, user.id, title, titleId, body);
      await client.query(
        "UPDATE cinepollis.login_sessions SET last_seen_at=clock_timestamp() WHERE token_hash=$1",
        [tokenDigest(request)],
      );
    }
    const result = await entries(client, user.id);
    await client.query("COMMIT");
    client.release();
    client = undefined;
    if (writing) await syncActivity().catch(() => {
      console.error("Actividad pendiente de sincronizar; se reintentará al consultar la comunidad.");
    });
    response.statusCode = 200;
    response.end(JSON.stringify({ userId: user.id, entries: result }));
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => {});
    response.statusCode = error.status || 503;
    response.end(JSON.stringify({ error: error.status ? error.message : "No pudimos guardar o cargar tus datos. Intenta nuevamente." }));
  } finally { client?.release(); }
}
