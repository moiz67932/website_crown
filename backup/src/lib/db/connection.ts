// Suppress missing type declarations if @types not installed in some environments
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Pool, PoolConfig } from 'pg';
// Loaded dynamically to avoid requiring GCP libs when only using local host mode.
let connectorModule: any;

let pool: Pool | null = null;
let initializing: Promise<Pool> | null = null;

async function createPool(): Promise<Pool> {
  // 1. Explicit DATABASE_URL overrides everything (useful for local docker, etc.)
  if (process.env.DATABASE_URL) {
    const p = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
    attachPoolEvents(p, 'connection-string');
    return p;
  }

  // 2. If DB_HOST provided -> assume direct TCP (local proxy or remote host)
  if (process.env.DB_HOST) {
    const cfg: PoolConfig = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
    };
    if (process.env.DB_SSL === 'true') {
      (cfg as any).ssl = { rejectUnauthorized: false };
    }
    const p = new Pool(cfg);
    attachPoolEvents(p, 'tcp');
    return p;
  }

  // 3. Default Cloud SQL Connector mode (requires INSTANCE_CONNECTION_NAME + credentials via ADC / service account)
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  if (!instanceConnectionName) {
    throw new Error('INSTANCE_CONNECTION_NAME not set and neither DATABASE_URL nor DB_HOST provided. Cannot establish DB connection.');
  }
  if (!connectorModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - types may not be present for this optional dependency
      connectorModule = await import('@google-cloud/cloud-sql-connector');
    } catch (e) {
      throw new Error('Missing @google-cloud/cloud-sql-connector dependency. Install it to use Cloud SQL Connector mode.');
    }
  }
  const { Connector } = connectorModule;
  const connector = new Connector();
  const clientOpts = await connector.getOptions({
    instanceConnectionName,
    ipType: 'PUBLIC',
  });
  const p = new Pool({
    ...clientOpts,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 5, // smaller in serverless environments
  });
  attachPoolEvents(p, 'cloud-sql-connector');
  return p;
}

function attachPoolEvents(p: Pool, mode: string) {
  p.on('error', (err: any) => {
    // console.error(`\u274c Postgres pool error [${mode}]:`, err);
  });
  p.on('connect', () => {
    // This can fire often in serverless; keep it concise.
    // console.log(`\u2705 Postgres client connected (${mode})`);
  });
}

export async function getPgPool(): Promise<Pool> {
  if (pool) return pool;
  if (!initializing) {
    initializing = createPool().then(async (p) => {
      try {
        await p.query('SELECT 1');
        // console.log('\u2705 Initial DB health check OK');
      } catch (e: any) {
        // console.error('\u274c Initial DB health check failed:', e.message);
      }
      pool = p;
      return p;
    });
  }
  return initializing;
}

export async function pgHealthCheck(): Promise<boolean> {
  try {
    const p = await getPgPool();
    await p.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
