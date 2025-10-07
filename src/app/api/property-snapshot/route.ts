import { NextRequest } from "next/server"
import { pool } from "@/lib/db/connection"
import { guardRateLimit } from "@/lib/rate-limit"

// Node runtime (DB access)
export const runtime = "nodejs"

/**
 * GET /api/property-snapshot?listing_key=1129496833
 * Returns a minimal snapshot used by the chat widget to seed context without exposing DB creds.
 * Shape: { id, listing_key, address, city, state, price, living_area_sqft, property_tax_annual, hoa, home_insurance_annual, image }
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon'
    const { allowed } = await guardRateLimit(`rl:${ip}:/api/property-snapshot`)
    if (!allowed) return Response.json({ error: 'rate_limited' }, { status: 429 })
    const { searchParams } = new URL(req.url)
    const listingKey = searchParams.get("listing_key")
    if (!listingKey) {
      return Response.json({ error: "listing_key required" }, { status: 400 })
    }

    // Select only lightweight columns; avoid large blobs
    // Some deployments may not have certain columns (e.g., living_area_sqft). We select flexible set and coalesce in JS.
    const { rows } = await pool.query(
      `SELECT 
         listing_key,
         list_price,
         city,
         state,
         -- prefer *_address order; fall back to any available
         unparsed_address,
         formatted_address,
         street_address,
         full_address,
         -- both present in different schemas; either may be null
         living_area_sqft,
         living_area,
         -- main photo if available
         main_photo_url,
         -- optional JSON for deeper fallbacks
         raw_json
       FROM properties
       WHERE listing_key = $1
       LIMIT 1`,
      [listingKey]
    )

    const row = rows[0]
    if (!row) return Response.json({}, { status: 404 })

    // Build best-effort address
    const address: string | null =
      row.unparsed_address ||
      row.formatted_address ||
      row.street_address ||
      row.full_address ||
      null

    // Determine price and sqft compatibly with rest of app
    const price = typeof row.list_price === "number" ? row.list_price : Number(row.list_price || 0) || null
    const living_area_sqft =
      (typeof row.living_area_sqft === "number" ? row.living_area_sqft : Number(row.living_area_sqft || 0)) ||
      (typeof row.living_area === "number" ? row.living_area : Number(row.living_area || 0)) ||
      null

    // Image best-effort
    let image: string | null = row.main_photo_url || null
    try {
      if (!image && row.raw_json) {
        const imgs = (row.raw_json.images || row.raw_json.media || row.raw_json.Media || []) as any[]
        if (Array.isArray(imgs) && imgs.length) image = String(imgs[0])
      }
    } catch {}

    // Optional financial fields - often not present; default to null
    let property_tax_annual: number | null = null
    let hoa: number | null = null
    let home_insurance_annual: number | null = null
    try {
      if (row.raw_json) {
        const rj = row.raw_json
        const toNum = (v: any) => (typeof v === "number" && isFinite(v) ? v : Number(String(v || "").replace(/[^0-9.]/g, "")) || null)
        property_tax_annual = toNum(rj.property_tax_annual || rj.PropertyTaxAnnual || rj.taxes_annual)
        // HOA typically monthly
        hoa = toNum(rj.hoa || rj.hoa_monthly || rj.HomeownersAssociationFee)
        home_insurance_annual = toNum(rj.home_insurance_annual || rj.HomeInsuranceAnnual)
      }
    } catch {}

    return Response.json({
      id: row.listing_key, // stable id for chat context
      listing_key: row.listing_key,
      address,
      city: row.city || null,
      state: row.state || null,
      price,
      living_area_sqft,
      property_tax_annual,
      hoa,
      home_insurance_annual,
      image,
    })
  } catch (e: any) {
    return Response.json({ error: e?.message || "server_error" }, { status: 500 })
  }
}

/*
Acceptance checklist (api/property-snapshot):
- GET with valid listing_key returns minimal JSON with address/price/sqft and image when available.
- Unknown listing_key returns {} with 404.
- No DB creds leaked to client; only minimal fields selected.
*/
