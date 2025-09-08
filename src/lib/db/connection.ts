// Suppress missing type declarations if @types not installed in some environments
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Pool, PoolConfig } from 'pg';
// Loaded dynamically to avoid requiring GCP libs when only using local host mode.
let connectorModule: any;

let pool: Pool | null = null;
let initializing: Promise<Pool> | null = null;

// Allow other modules to subscribe to reset events (e.g., for metrics/logging)
const resetListeners: Array<() => void> = [];
export function onPoolReset(fn: () => void) { resetListeners.push(fn); }
export async function resetPgPool(reason = 'manual-reset') {
  const old = pool;
  pool = null;
  initializing = null;
  if (old) {
    try { await old.end(); } catch { /* ignore */ }
  }
  for (const fn of resetListeners) {
    try { fn(); } catch { /* ignore */ }
  }
  // console.log(`\u26A0\uFE0F Postgres pool reset (${reason})`);
}

async function createPool(): Promise<Pool> {
  const preferCloud = process.env.DB_BACKEND === 'cloudsql';

  // 1. Cloud SQL (preferred if DB_BACKEND=cloudsql) even if DB_HOST is set in env.example
  if (preferCloud) {
    const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
    if (!instanceConnectionName) {
      throw new Error('DB_BACKEND=cloudsql but INSTANCE_CONNECTION_NAME not set.');
    }
    if (!connectorModule) {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        connectorModule = await import('@google-cloud/cloud-sql-connector');
      } catch (e) {
        throw new Error('Missing @google-cloud/cloud-sql-connector dependency. Install it to use Cloud SQL mode.');
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
      max: 5,
      idleTimeoutMillis: 30_000,
      statement_timeout: 60_000,
      query_timeout: 60_000,
      keepAlive: true,
    } as any);
    attachPoolEvents(p, 'cloud-sql-connector');
    return p;
  }

  // 2. Explicit DATABASE_URL overrides everything (useful for local docker, etc.)
  if (process.env.DATABASE_URL) {
    const p = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      statement_timeout: 60_000,
      query_timeout: 60_000,
      keepAlive: true,
    } as any);
    attachPoolEvents(p, 'connection-string');
    return p;
  }

  // 3. If DB_HOST provided -> assume direct TCP (local proxy or remote host)
  if (process.env.DB_HOST) {
    const cfg: PoolConfig = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
      idleTimeoutMillis: 30_000,
    };
    if (process.env.DB_SSL === 'true') {
      (cfg as any).ssl = { rejectUnauthorized: false };
    }
    const p = new Pool({
      ...cfg,
      keepAlive: true,
      statement_timeout: 60_000,
      query_timeout: 60_000,
    } as any);
    attachPoolEvents(p, 'tcp');
    return p;
  }

  // 4. Fallback to Cloud SQL if INSTANCE_CONNECTION_NAME is set (even without DB_BACKEND)
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  if (!instanceConnectionName) {
    throw new Error('No database configuration found (DATABASE_URL, DB_HOST, or INSTANCE_CONNECTION_NAME).');
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
    idleTimeoutMillis: 30_000,
    statement_timeout: 60_000,
    query_timeout: 60_000,
    keepAlive: true,
  } as any);
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
      // Attach global error handler for auto reset on certain fatal errors
      p.on('error', (err: any) => {
        const msg = String(err?.message || '');
        if (msg.includes('Connection terminated unexpectedly') || msg.includes('ECONNRESET')) {
          // schedule a reset; avoid immediate thrash by setTimeout
          setTimeout(() => resetPgPool('fatal-error:' + msg.slice(0, 40)), 50);
        }
      });
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
