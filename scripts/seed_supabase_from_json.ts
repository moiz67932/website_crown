/**
 * seed_supabase_from_json.ts
 * ---------------------------------------------------------------------------
 * Batch upsert JSON property documents into the Supabase Postgres mirror.
 * Usage (TS Node / ts-node):
 *   ts-node scripts/seed_supabase_from_json.ts --dir ./property-json --batch 500
 * Or compile first then run with node. Requires DATABASE_URL in env pointing to Supabase.
 *
 * Features:
 * - Reads all .json files in a directory (each file can contain a single object OR an array of objects)
 * - Maps fields to columns defined in supabase-schema.sql
 * - Batches rows; each batch inside a single transaction (COMMIT or ROLLBACK)
 * - Upserts using listing_key primary key (ON CONFLICT DO UPDATE)
 * - Safe to re-run (idempotent upsert semantics)
 * - Simple progress logging & final summary
 *
 * Environment:
 *   DATABASE_URL=postgresql://user:pass@host:5432/postgres?sslmode=require
 *   (Respects sslmode=require, does not enforce rejectUnauthorized so matches existing code expectations)
 */

import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { Pool, PoolClient } from 'pg';

// ----------------------------- Config Parsing ------------------------------
interface CliArgs {
  dir: string;
  batch: number;
  dryRun: boolean;
  limit?: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let dir = '';
  let batch = 500;
  let dryRun = false;
  let limit: number | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dir') dir = args[++i];
    else if (a === '--batch') batch = parseInt(args[++i], 10);
    else if (a === '--dry-run') dryRun = true;
    else if (a === '--limit') limit = parseInt(args[++i], 10);
  }
  if (!dir) {
    console.error('Missing required --dir <folder>');
    process.exit(1);
  }
  return { dir, batch, dryRun, limit };
}

const { dir, batch, dryRun, limit } = parseArgs();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set in environment. Aborting.');
  process.exit(1);
}

// ----------------------------- PG Pool Setup ------------------------------
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// --------------------------- Data Transformation --------------------------
type PropertyRow = {
  listing_key: string;
  list_price?: number | null;
  city?: string | null;
  state?: string | null;
  bedrooms?: number | null;
  bathrooms_total?: number | null;
  living_area?: number | null;
  lot_size_sqft?: number | null;
  property_type?: string | null;
  status?: string | null;
  hidden?: boolean | null;
  photos_count?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  main_photo_url?: string | null;
  modification_ts: string; // ISO
  first_seen_ts: string;   // ISO
  last_seen_ts?: string | null;
  year_built?: number | null;
  days_on_market?: number | null;
  price_change_ts?: string | null;
  previous_list_price?: number | null;
  current_price?: number | null;
  pool_features?: string | null;
  view?: string | null;
  view_yn?: boolean | null;
  waterfront_yn?: boolean | null;
  heating?: string | null;
  cooling?: string | null;
  parking_features?: string | null;
  garage_spaces?: number | null;
  public_remarks?: string | null;
  media_urls?: any | null; // jsonb
  raw_json?: any | null;   // jsonb original blob
};

function coerceNumber(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function coerceBool(v: any): boolean | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const lc = v.toLowerCase();
    if (['true', 't', '1', 'yes', 'y'].includes(lc)) return true;
    if (['false', 'f', '0', 'no', 'n'].includes(lc)) return false;
  }
  if (typeof v === 'number') return v === 1;
  return null;
}

function coerceDate(v: any, required = false): string | null {
  if (!v) return required ? new Date().toISOString() : null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return required ? new Date().toISOString() : null;
  return d.toISOString();
}

function mapObject(o: any): PropertyRow | null {
  if (!o || !o.listing_key) return null; // skip invalid
  return {
    listing_key: String(o.listing_key),
    list_price: coerceNumber(o.list_price ?? o.price ?? o.current_price),
    city: o.city ?? null,
    state: o.state ?? null,
    bedrooms: coerceNumber(o.bedrooms ?? o.beds),
    bathrooms_total: coerceNumber(o.bathrooms_total ?? o.baths_total ?? o.baths),
    living_area: coerceNumber(o.living_area ?? o.sqft ?? o.living_area_sqft),
    lot_size_sqft: coerceNumber(o.lot_size_sqft ?? o.lot_size),
    property_type: o.property_type ?? null,
    status: o.status ?? 'Active',
    hidden: o.hidden === undefined ? false : !!o.hidden,
    photos_count: coerceNumber(o.photos_count ?? (Array.isArray(o.photos) ? o.photos.length : null)),
    latitude: coerceNumber(o.latitude ?? o.lat),
    longitude: coerceNumber(o.longitude ?? o.lng ?? o.lon),
    main_photo_url: o.main_photo_url ?? (Array.isArray(o.photos) ? o.photos[0] : null),
    modification_ts: coerceDate(o.modification_ts ?? o.modified_at ?? o.updated_at, true)!,
    first_seen_ts: coerceDate(o.first_seen_ts ?? o.created_at ?? o.ingested_at, true)!,
    last_seen_ts: coerceDate(o.last_seen_ts ?? o.last_seen),
    year_built: coerceNumber(o.year_built),
    days_on_market: coerceNumber(o.days_on_market ?? o.dom),
    price_change_ts: coerceDate(o.price_change_ts),
    previous_list_price: coerceNumber(o.previous_list_price),
    current_price: coerceNumber(o.current_price ?? o.list_price ?? o.price),
    pool_features: o.pool_features ?? null,
    view: o.view ?? null,
    view_yn: coerceBool(o.view_yn),
    waterfront_yn: coerceBool(o.waterfront_yn),
    heating: o.heating ?? null,
    cooling: o.cooling ?? null,
    parking_features: o.parking_features ?? null,
    garage_spaces: coerceNumber(o.garage_spaces),
    public_remarks: o.public_remarks ?? o.remarks ?? null,
    media_urls: o.media_urls ?? (Array.isArray(o.photos) ? o.photos : null),
    raw_json: o
  };
}

// ------------------------------- SQL Prep ----------------------------------
const columns = [
  'listing_key','list_price','city','state','bedrooms','bathrooms_total','living_area','lot_size_sqft','property_type','status','hidden','photos_count','latitude','longitude','main_photo_url','modification_ts','first_seen_ts','last_seen_ts','year_built','days_on_market','price_change_ts','previous_list_price','current_price','pool_features','view','view_yn','waterfront_yn','heating','cooling','parking_features','garage_spaces','public_remarks','media_urls','raw_json'
];

const insertSQL = `insert into public.properties (${columns.join(',')}) values ${/* dynamic */''}`;

function buildBatchInsert(rows: PropertyRow[]): { sql: string; values: any[] } {
  const values: any[] = [];
  const tuples = rows.map((r, rowIdx) => {
    const base = columns.map((c, colIdx) => {
      values.push((r as any)[c]);
      return `$${values.length}`;
    }).join(',');
    return `(${base})`;
  }).join(',');
  const sql = `${insertSQL.replace(' values ', ' values ')}${tuples} on conflict (listing_key) do update set ${columns.filter(c=>c!=='listing_key').map(c=>`${c}=excluded.${c}`).join(',')}`;
  return { sql, values };
}

// ------------------------------ Main Logic ---------------------------------
// Batch accumulator at module scope so flushBatch can see it
let batchRows: PropertyRow[] = [];

async function processFiles() {
  const absDir = path.resolve(dir);
  const files = readdirSync(absDir).filter(f => f.toLowerCase().endsWith('.json'));
  console.log(`Discovered ${files.length} JSON files in ${absDir}`);
  let totalInserted = 0;

  const pushRow = async (row: PropertyRow, client: PoolClient) => {
    batchRows.push(row);
    if (batchRows.length >= batch) {
      await flushBatch(client);
    }
  };

  const client = await pool.connect();
  try {
    for (let i = 0; i < files.length; i++) {
      if (limit && totalInserted >= limit) break;
      const file = files[i];
      const raw = readFileSync(path.join(absDir, file), 'utf8');
      let data: any;
      try { data = JSON.parse(raw); } catch (e) { console.warn(`Skipping ${file} (invalid JSON)`); continue; }
      const objects: any[] = Array.isArray(data) ? data : [data];
      for (const o of objects) {
        if (limit && totalInserted >= limit) break;
        const mapped = mapObject(o);
        if (!mapped) continue;
        if (dryRun) {
          // Just count / validate mandatory fields.
          totalInserted++;
          if (totalInserted % 1000 === 0) console.log(`(dry-run) Processed ${totalInserted}`);
        } else {
          await pushRow(mapped, client);
          totalInserted++;
          if (totalInserted % 1000 === 0) console.log(`Upsert queued: ${totalInserted}`);
        }
      }
    }
    if (!dryRun && batchRows.length) {
      await flushBatch(client);
    }
    console.log(`Done. Total ${(dryRun ? 'would process' : 'upserted')} rows: ${totalInserted}`);
  } finally {
    client.release();
    await pool.end();
  }
}

async function flushBatch(client: PoolClient) {
  if (!batchRows.length) return;
  const toWrite = batchRows;
  batchRows = [];
  const { sql, values } = buildBatchInsert(toWrite);
  try {
    await client.query('begin');
    await client.query(sql, values);
    await client.query('commit');
    console.log(`Committed batch of ${toWrite.length}`);
  } catch (e: any) {
    await client.query('rollback');
    console.error('Batch failed, rolled back. First row listing_key=', toWrite[0]?.listing_key);
    console.error(e.message);
    process.exit(1);
  }
}

processFiles().catch(e => {
  console.error(e);
  process.exit(1);
});
