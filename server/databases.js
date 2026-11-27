import { Pool } from "pg";
import { MongoClient } from "mongodb";

let postgres;
let mongo;
let mongoConnection;

function requiredSetting(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + "_MISSING");
  return value;
}

export function getPostgres() {
  if (!postgres) {
    const connection = new URL(requiredSetting("DATABASE_URL"));
    if (!["postgres:", "postgresql:"].includes(connection.protocol)) {
      throw new Error("DATABASE_URL_INVALID");
    }
    // Keep TLS certificate verification enabled even if the URI has SSL options.
    for (const option of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
      connection.searchParams.delete(option);
    }
    const ca = process.env.DATABASE_SSL_CA?.replaceAll("\\n", "\n");
    postgres = new Pool({
      connectionString: connection.toString(),
      ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
      max: 3,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10000,
      statement_timeout: 10000,
      query_timeout: 12000,
      allowExitOnIdle: true,
    });
    // Idle connection failures must not crash the process or print credentials.
    postgres.on("error", () => {
      console.error("PostgreSQL: conexión inactiva interrumpida.");
    });
  }
  return postgres;
}

export async function getMongo() {
  if (!mongoConnection) {
    mongo = new MongoClient(requiredSetting("MONGODB_URI"), {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 10000,
    });
    const client = mongo;
    mongoConnection = client.connect().catch(async (error) => {
      mongoConnection = undefined;
      mongo = undefined;
      await client.close().catch(() => {});
      throw error;
    });
  }
  const client = await mongoConnection;
  return client.db("cinepollis_social");
}

export async function closeDatabases() {
  const pool = postgres;
  const client = mongo;
  postgres = undefined;
  mongo = undefined;
  mongoConnection = undefined;
  await Promise.all([pool?.end(), client?.close()]);
}
