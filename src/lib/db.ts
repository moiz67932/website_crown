import { setupWif } from "./setupWif";
setupWif();

import { Connector } from "@google-cloud/cloud-sql-connector";

const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME!;
const dbUser = process.env.DB_USER!;
const dbName = process.env.DB_NAME!;

// Create a singleton Pool (recommended for serverless handlers)
let _pool: any | null = null;

export async function getPool(): Promise<any> {
  if (_pool) return _pool;

  const connector = new Connector(); // uses ADC set by setupWif()
  const clientOpts = await connector.getOptions({
    instanceConnectionName,
    ipType: "PUBLIC" as any,    // or "PRIVATE" if you have private IP networking
    authType: "IAM" as any,     // use IAM DB authentication (no static password)
  });

  // Lazy-load pg to avoid type issues if @types are not present
  // @ts-ignore - TypeScript typings for 'pg' may not be installed; runtime import is fine
  const { Pool } = await import("pg");

  _pool = new Pool({
    ...clientOpts,
    user: dbUser,        // IAM user (your SA email)
    database: dbName,
    // password: not needed with IAM + connector
    // ssl: not required; connector handles TLS
    // You can add connection settings like statement_timeout here
    max: 5,
  });

  // (Optional) test a simple query on first init
  // await _pool.query("select 1");

  return _pool;
}

// Back-compat alias for existing code that imports { getPgPool } from "@/lib/db"
export const getPgPool = getPool;
