// /src/lib/db.ts
import { Pool, PoolConfig } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { GoogleAuth } from "google-auth-library";

export const runtime = 'nodejs';          // ensure Node runtime (not edge) for GCP libs
export const dynamic = 'force-dynamic';   // avoid accidental SSG on this API

let pool: Pool | null = null;

async function makeCloudSqlPool(): Promise<Pool> {
  const instance = process.env.INSTANCE_CONNECTION_NAME;
  if (!instance) throw new Error("INSTANCE_CONNECTION_NAME is required for Cloud SQL connector");

  // IMPORTANT: The connector will read GOOGLE_APPLICATION_CREDENTIALS_JSON automatically via GoogleAuth
  // No manual ExternalAccountClient or @vercel/oidc imports needed.
  const auth = new GoogleAuth({
    // Required scope for the connector to fetch ephemeral certs + instance metadata
    scopes: ["https://www.googleapis.com/auth/sqlservice.admin"],
  });

  const connector = new Connector({ auth });

  const ipType = (() => {
    const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
    if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
    if (raw === "PSC") return IpAddressTypes.PSC;
    return IpAddressTypes.PUBLIC;
  })();

  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType,
  });

  const cfg: PoolConfig = {
    ...clientOpts, // supplies host/socket/ssl
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "redata",
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || process.env.PG_CONN_TIMEOUT_MS || 15_000),
  };

  return new Pool(cfg);
}

async function makeTcpPoolFromUrl(): Promise<Pool> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  console.log("🌐 Using direct TCP connection via DATABASE_URL");
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 15_000),
  });
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;
  try {
    // Prefer Cloud SQL connector if INSTANCE_CONNECTION_NAME is present
    if (process.env.INSTANCE_CONNECTION_NAME) {
      pool = await makeCloudSqlPool();
    } else if (process.env.DATABASE_URL) {
      pool = await makeTcpPoolFromUrl();
    } else {
      throw new Error("No DB configuration: set INSTANCE_CONNECTION_NAME (Cloud SQL) or DATABASE_URL (TCP).");
    }
    return pool;
  } catch (err) {
    console.error("❌ Failed to initialize Postgres pool:", err);
    throw err;
  }
}

// Back-compat alias
export const getPgPool = getPool;
