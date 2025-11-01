// lib/properties.ts
import { pool } from "./db/connection"

export async function getPropertyByListingKey(listingKey: string) {
  const { rows } = await pool.query(
    `SELECT listing_key,
            unparsed_address,
            formatted_address,
            street_address,
            full_address,
            city,
            state,
            county,
            zip_code
     FROM properties
     WHERE listing_key = $1
     LIMIT 1`,
    [listingKey]
  )
  return rows[0] || null
}
