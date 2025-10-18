// src/lib/db/media-repo.ts
import { pool } from "@/lib/db";
import { unstable_cache } from "next/cache";

export type PropertyMedia = {
  url: string;
  bytes: number | null;
  createdAt: string | null;
};

async function fetchPropertyMediaFromDb(listingKey: string): Promise<PropertyMedia[]> {
  // 1) Preferred: property_media rows
  const mediaRes = await pool.query(
    `
    SELECT media_url AS url, bytes, created_at
    FROM property_media
    WHERE listing_key = $1
    ORDER BY seq ASC
    `,
    [listingKey]
  );

  if (mediaRes.rows?.length > 0) {
    return mediaRes.rows.map(r => ({
      url: r.url as string,
      bytes: r.bytes === null ? null : Number(r.bytes),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    }));
  }

  // 2) Fallback: properties.media_urls (JSONB array of strings)
  const fallbackRes = await pool.query(
    `
    SELECT media_urls
    FROM properties
    WHERE listingkey = $1
    LIMIT 1
    `,
    [listingKey]
  );

  if (fallbackRes.rows?.length) {
    const arr: string[] =
      Array.isArray(fallbackRes.rows[0].media_urls) ? fallbackRes.rows[0].media_urls : [];

    return arr.map((u: string) => ({
      url: u,
      bytes: null,
      createdAt: null,
    }));
  }

  return [];
}

/**
 * Cached accessor with 5-minute TTL.
 * Use tags so we can revalidate by tag when the media job updates a listing.
 */
export function getPropertyMediaCached(listingKey: string): Promise<PropertyMedia[]> {
  const fn = unstable_cache(
    async () => fetchPropertyMediaFromDb(listingKey),
    ["property-media", listingKey],
    { revalidate: 300, tags: [`property:${listingKey}`] }
  );
  return fn();
}
