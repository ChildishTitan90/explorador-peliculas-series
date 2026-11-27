import test from "node:test";
import assert from "node:assert/strict";
import { syncActivity } from "./activity.js";

function fixture({ current, failure = false, locked = false } = {}) {
  const statements = [];
  const writes = [];
  const client = {
    async query(sql) {
      statements.push(sql);
      if (sql.includes("pg_try_advisory")) return { rows: [{ acquired: !locked }] };
      if (sql.includes("FROM cinepollis.activity_outbox")) return { rows: [{ version: "9007199254740993", entry_id: "entry", payload: { userId: "user", titleId: "title", title: { name: "Película" }, review: "No publicar esta copia antigua" } }] };
      if (sql.includes("FROM cinepollis.entries")) return { rows: current ? [current] : [] };
      return { rows: [] };
    },
    release() { statements.push("RELEASE"); },
  };
  const options = { pool: { connect: async () => client }, mongo: async () => ({ collection: () => ({
    async updateOne(filter, pipeline, options) {
      if (failure) throw new Error("unavailable");
      writes.push({ filter, pipeline, options });
    },
  }) }) };
  return { options, statements, writes };
}

test("publica la nota actual, incluye cero y conserva bigint y fecha", async () => {
  const f = fixture({ current: { public_history: true, score: "0.0", review: "Actual", spoiler: true, first_rated_at: "2026-01-02T00:00:00Z", username: "user", display_name: "Nombre", email: "privado" } });
  await syncActivity(f.options);
  const write = f.writes[0];
  const doc = write.pipeline[0].$replaceWith.$cond[1].$literal;
  assert.equal(doc.sourceVersion.toString(), "9007199254740993");
  assert.equal(doc.score, 0);
  assert.equal(doc.visible, true);
  assert.equal(doc.review, "Actual");
  assert.equal(doc.publishedAt.toISOString(), "2026-01-02T00:00:00.000Z");
  assert.equal(doc.actor.email, undefined);
  assert.deepEqual(write.filter, { _id: "entry" });
  assert.ok(write.pipeline[0].$replaceWith.$cond[0].$lt);
  assert.ok(f.statements.some(sql => sql.includes("processed_at=clock_timestamp()")));
});

for (const [label, current] of [["eliminada", null], ["privada", { public_history: false, score: 4, review: "Privada" }], ["sin nota", { public_history: true, score: null }]]) {
  test("retira una entrada " + label + " sin conservar crítica ni actor", async () => {
    const f = fixture({ current });
    await syncActivity(f.options);
    const doc = f.writes[0].pipeline[0].$replaceWith.$cond[1].$literal;
    assert.equal(doc.visible, false);
    assert.equal(doc.review, "");
    assert.equal(doc.score, null);
    assert.deepEqual(doc.actor, {});
  });
}

test("un fallo en Mongo revierte el lote y conserva eventos pendientes", async () => {
  const f = fixture({ failure: true });
  await assert.rejects(syncActivity(f.options), /unavailable/);
  assert.ok(f.statements.includes("ROLLBACK"));
  assert.ok(!f.statements.some(sql => sql.includes("UPDATE cinepollis.activity_outbox")));
  assert.equal(f.statements.at(-1), "RELEASE");
});

test("otro sincronizador activo impide procesar el mismo lote", async () => {
  const f = fixture({ locked: true });
  await syncActivity(f.options);
  assert.equal(f.writes.length, 0);
  assert.ok(!f.statements.some(sql => sql.includes("FROM cinepollis.activity_outbox")));
});
