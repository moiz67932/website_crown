// import { Pool, PoolConfig } from "pg";

// let pool: Pool | null = null;

// function buildConfig(): PoolConfig {
//   // Prefer DATABASE_URL if provided (works well on Vercel)
//   if (process.env.DATABASE_URL) {
//     return {
//       connectionString: process.env.DATABASE_URL,
//       // Cloud SQL Public IP usually needs SSL but without CA
//       ssl: { rejectUnauthorized: false },
//       max: Number(process.env.PG_POOL_MAX || 8),
//       idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 20_000),
//       connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 10_000),

//       // These are sent as GUCs after connect by node-postgres
//       statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 25_000),
//       query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 25_000),
//       application_name: "ccos-web",
//     } as any;
//   }

//   // Otherwise use discrete vars against the instance public IP
//   const {
//     DB_HOST,
//     DB_PORT = "5432",
//     DB_USER,
//     DB_PASSWORD,
//     DB_NAME,
//     DB_SSL = "true",
//   } = process.env;

//   if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
//     throw new Error(
//       "Missing DB env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (or use DATABASE_URL)"
//     );
//   }

//   return {
//     host: DB_HOST,
//     port: Number(DB_PORT),
//     user: DB_USER,
//     password: DB_PASSWORD,
//     database: DB_NAME,
//     ssl: DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
//     max: Number(process.env.PG_POOL_MAX || 8),
//     idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 20_000),
//     connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 10_000),
//     statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 25_000),
//     query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 25_000),
//     application_name: "ccos-web",
//   } as any;
// }

// export function getPgPool(): Pool {
//   if (pool) return pool;

//   const cfg = buildConfig();
//   pool = new Pool({
//     ...cfg,
//     keepAlive: true,
//     keepAliveInitialDelayMillis: 5_000,
//   } as any);

//   pool.on("error", (e) => {
//     console.error("[pg] pool error", e);
//   });

//   console.log(
//     "[pg] Pool initialized for",
//     process.env.DATABASE_URL
//       ? "DATABASE_URL"
//       : `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
//   );

//   return pool;
// }

// export async function endPgPool() {
//   if (pool) {
//     try {
//       await pool.end();
//     } finally {
//       pool = null;
//     }
//   }
// }












// src/lib/db/connection.ts
import { Pool } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { GoogleAuth } from "google-auth-library";

declare global {
  // eslint-disable-next-line no-var
  var __cloudsqlPool: Pool | undefined;
}

// Try to read service account credentials from env in several safe formats.
function loadServiceAccountCredentials():
  | Record<string, any>
  | undefined
{
  // Preferred: plain JSON in GCP_SA_KEY
  let raw = process.env.GCP_SA_KEY?.trim();

  // If it looks like it's accidentally wrapped in matching quotes, unwrap.
  if (raw && ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"')))) {
    raw = raw.slice(1, -1);
  }

  if (raw) {
    // If it starts with "{", assume it's JSON text.
    if (raw.startsWith("{")) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error("[cloudsql] GCP_SA_KEY is not valid JSON. First 50 chars:", raw.slice(0, 50));
        throw new Error("Invalid GCP_SA_KEY: not parseable JSON");
      }
    }

    // If it doesn't start with "{", it might be base64 by mistake. Try decoding.
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      if (decoded.trim().startsWith("{")) {
        return JSON.parse(decoded);
      }
    } catch {
      // ignore and try explicit _B64 below
    }
  }

  // Alternative: dedicated base64 var
  const b64 = process.env.GCP_SA_KEY_B64?.trim();
  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch {
      console.error("[cloudsql] GCP_SA_KEY_B64 is not valid base64 JSON");
      throw new Error("Invalid GCP_SA_KEY_B64: not parseable base64 JSON");
    }
  }

  // No inline credentials provided -> let GoogleAuth use ADC
  return undefined;
}

async function initPool(): Promise<Pool> {
  // Avoid initializing Cloud SQL during static build to prevent connector calls in Vercel build step
  const argv = Array.isArray(process.argv) ? process.argv.join(" ") : "";
  const likelyNextBuild = argv.includes("next") && argv.includes("build");
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.VERCEL_BUILD === "1" ||
    process.env.NEXT_BUILD === "1" ||
    likelyNextBuild
  ) {
    throw new Error("Cloud SQL pool initialization blocked during build phase");
  }

  const instance = process.env.CLOUDSQL_INSTANCE_CONNECTION_NAME;
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPass = process.env.DB_PASS;

  if (!instance) throw new Error("Missing CLOUDSQL_INSTANCE_CONNECTION_NAME (project:region:instance).");
  if (!dbName || !dbUser || !dbPass) throw new Error("Missing DB_NAME / DB_USER / DB_PASS.");

  const credentials = loadServiceAccountCredentials();
  const auth = credentials
    ? new GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      })
    : new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });

  const connector = new Connector({ auth });

  const ipType =
    (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase() === "PRIVATE"
      ? IpAddressTypes.PRIVATE
      : IpAddressTypes.PUBLIC;

  // Connector returns secure host/port/ssl for pg
  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType,
  });

  const pool = new Pool({
    ...clientOpts,
    database: dbName,
    user: dbUser,
    password: dbPass,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 10_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS ?? 10_000),
  });

  pool.on("error", (err) => {
    console.error("[pg] Pool error:", err);
  });

  const originalEnd = pool.end.bind(pool);
  pool.end = async () => {
    await originalEnd();
    connector.close();
  };

  return pool;
}

/**
 * Lazily acquire a singleton pg.Pool connected via Cloud SQL Connector.
 * Never runs during Next.js/Vercel build time; only on runtime invocation.
 */
export async function getPgPool(): Promise<Pool> {
  if (!global.__cloudsqlPool) {
    global.__cloudsqlPool = await initPool();
  }
  return global.__cloudsqlPool;
}

/** End the shared pool (mainly for tests/scripts) */
export async function endPgPool() {
  if (global.__cloudsqlPool) {
    try { await global.__cloudsqlPool.end(); } catch {}
    global.__cloudsqlPool = undefined;
  }
}
