import { getPostgres, getMongo, closeDatabases } from "./databases.js";

const checks = [
  ["PostgreSQL", async () => {
    await getPostgres().query("SELECT 1 FROM cinepollis.users LIMIT 1");
  }],
  ["MongoDB", async () => {
    const database = await getMongo();
    await database.command({ ping: 1 });
    await database.collection("activity").findOne({}, { projection: { _id: 1 } });
  }],
];

try {
  const results = await Promise.allSettled(checks.map(([, check]) => check()));
  for (const [index, result] of results.entries()) {
    const [name] = checks[index];
    if (result.status === "fulfilled") {
      console.log(name + ": conexión y lectura correctas.");
    } else {
      const missing = result.reason?.message === "DATABASE_URL_MISSING"
        || result.reason?.message === "MONGODB_URI_MISSING";
      console.error(name + (missing
        ? ": falta configurar la conexión privada."
        : ": conexión fallida. Revisa credenciales, permisos, red y certificado TLS."));
      process.exitCode = 1;
    }
  }
} finally {
  await closeDatabases();
}
