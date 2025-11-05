// import { setupWif } from "./setupWif";
// setupWif();

// import { Connector } from "@google-cloud/cloud-sql-connector";

// const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME!;
// const dbUser = process.env.DB_USER!;
// const dbName = process.env.DB_NAME!;

// // Create a singleton Pool (recommended for serverless handlers)
// let _pool: any | null = null;

// export async function getPool(): Promise<any> {
//   if (_pool) return _pool;

//   const connector = new Connector(); // uses ADC set by setupWif()
//   const clientOpts = await connector.getOptions({
//     instanceConnectionName,
//     ipType: "PUBLIC" as any,    // or "PRIVATE" if you have private IP networking
//     authType: "IAM" as any,     // use IAM DB authentication (no static password)
//   });

//   // Lazy-load pg to avoid type issues if @types are not present
//   // @ts-ignore - TypeScript typings for 'pg' may not be installed; runtime import is fine
//   const { Pool } = await import("pg");

//   _pool = new Pool({
//     ...clientOpts,
//     user: dbUser,        // IAM user (your SA email)
//     database: dbName,
//     // password: not needed with IAM + connector
//     // ssl: not required; connector handles TLS
//     // You can add connection settings like statement_timeout here
//     max: 5,
//   });

//   // (Optional) test a simple query on first init
//   // await _pool.query("select 1");

//   return _pool;
// }

// // Back-compat alias for existing code that imports { getPgPool } from "@/lib/db"
// export const getPgPool = getPool;

// // Re-export property repository helpers for convenience
// export * from './db/property-repo';


// Centralized Postgres pool with optional Cloud SQL Connector + WIF
import { Pool, PoolConfig } from "pg";


let pool: Pool | null = null;

// Lazy import to keep cold start small
async function makeCloudSqlPool(): Promise<Pool> {
  const { Connector, IpAddressTypes } = await import("@google-cloud/cloud-sql-connector");
  const { GoogleAuth } = await import("google-auth-library");

  const instance = process.env.INSTANCE_CONNECTION_NAME;
  if (!instance) throw new Error("INSTANCE_CONNECTION_NAME is required for Cloud SQL connector");

  // Prefer WIF if provided; otherwise allow a raw SA key (not recommended on Vercel)
  let credentials: any | undefined = undefined;
  if (process.env.GOOGLE_WIF_CONFIG_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_WIF_CONFIG_JSON);
    console.log("🔐 Using WIF external_account credentials for Cloud SQL");
  } else {
    throw new Error("No Google credentials found. Set GOOGLE_WIF_CONFIG_JSON.");
  }

  const auth = new GoogleAuth({
    credentials,
    // Cloud SQL Admin scope is required for connector to fetch ephemeral certs
    scopes: ["https://www.googleapis.com/auth/sqlservice.admin"],
  });

  const connector = new Connector({ auth });
  const clientOpts = await connector.getOptions({
    instanceConnectionName: instance,
    ipType: (() => {
      const raw = (process.env.DB_IP_TYPE || "PUBLIC").toUpperCase();
      if (raw === "PRIVATE") return IpAddressTypes.PRIVATE;
      if (raw === "PSC") return IpAddressTypes.PSC;
      return IpAddressTypes.PUBLIC;
    })(),
  });

  const cfg: PoolConfig = {
    ...clientOpts, // supplies host/socket, ssl, etc.
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 15_000),
  };

  return new Pool(cfg);
}

async function makeTcpPoolFromUrl(): Promise<Pool> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  console.log("🌐 Using direct TCP connection via DATABASE_URL");
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }, // required for many managed Postgres setups
    max: Number(process.env.PG_POOL_MAX || 8),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 15_000),
  });
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  try {
    // Prefer Cloud SQL connector when INSTANCE_CONNECTION_NAME is set
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

// Back-compat alias for modules that import getPgPool
export const getPgPool = getPool;
