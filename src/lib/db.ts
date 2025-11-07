// /src/lib/db.ts
import fs from "fs";
import path from "path";
import { Pool, PoolConfig } from "pg";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";          // Ensure Node runtime for GCP libs
export const dynamic = "force-dynamic";   // Prevent accidental static builds

let pool: Pool | null = null;

async function ensureGoogleCredentialsFile(): Promise<void> {
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credsJson) {
    console.warn("⚠️ No GOOGLE_APPLICATION_CREDENTIALS_JSON found in env");
    return;
  }

  // Write credentials JSON to a temp file (Vercel allows /tmp writes)
  const credsPath = path.join("/tmp", "vercel-wif-creds.json");
  try {
    fs.writeFileSync(credsPath, credsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
    console.log("✅ Wrote WIF credentials to", credsPath);
  } catch (err) {
    console.error("❌ Failed to write credentials file:", err);
  }
}

async function makeCloudSqlPool(): Promise<Pool> {
  await ensureGoogleCredentialsFile();

  const instance = process.env.INSTANCE_CONNECTION_NAME;
  if (!instance)
    throw new Error("INSTANCE_CONNECTION_NAME is required for Cloud SQL connector");

  const auth = new GoogleAuth({
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
    connectionTimeoutMillis: Number(
      process.env.PG_CONNECTION_TIMEOUT_MS ||
        process.env.PG_CONN_TIMEOUT_MS ||
        15_000
    ),
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
    if (process.env.INSTANCE_CONNECTION_NAME) {
      console.log("☁️ Initializing Cloud SQL connector pool...");
      pool = await makeCloudSqlPool();
    } else if (process.env.DATABASE_URL) {
      pool = await makeTcpPoolFromUrl();
    } else {
      throw new Error(
        "No DB configuration found: set INSTANCE_CONNECTION_NAME or DATABASE_URL."
      );
    }
    return pool;
  } catch (err) {
    console.error("❌ Failed to initialize Postgres pool:", err);
    throw err;
  }
}

// Back-compat alias
export const getPgPool = getPool;
