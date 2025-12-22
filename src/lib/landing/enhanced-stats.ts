/**
 * Enhanced statistics for landing page generation
 * Provides rich, aggregated data to eliminate generic AI content
 */

import { getPgPool } from '@/lib/db';
import type { LandingKind } from '@/types/landing';
import type { Pool } from 'pg';

// ============================================================================
// TYPES
// ============================================================================

export interface PriceBand {
  label: string;
  min: number;
  max: number | null;
  count: number;
  percentage: number;
}

export interface PropertyTypeMix {
  type: string;
  count: number;
  percentage: number;
  medianPrice: number | null;
  medianPricePerSqft: number | null;
}

export interface BedroomMix {
  beds: string; // "1", "2", "3", "4+"
  count: number;
  percentage: number;
}

export interface TopNeighborhood {
  name: string;
  activeCount: number;
  medianPrice: number | null;
  medianPricePerSqft: number | null;
}

export interface MarketMomentum {
  newListingsLast7Days: number;
  newListingsLast14Days: number;
  priceReductionsLast7Days: number;
  priceReductionsLast14Days: number;
  pendingCount: number;
  pendingToActiveRatio: number | null;
}

export interface FeaturedListingSummary {
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  propertyType: string | null;
  neighborhood: string | null;
  remarksSummary: string | null; // First 140 chars of public remarks
}

export interface EnhancedLandingStats {
  // Core stats (existing)
  medianPrice: number | null;
  pricePerSqft: number | null;
  daysOnMarket: number | null;
  totalActive: number;

  // NEW: Distribution stats
  priceBands: PriceBand[];
  propertyTypeMix: PropertyTypeMix[];
  bedroomMix: BedroomMix[];

  // NEW: Micro-market leaders
  topNeighborhoods: TopNeighborhood[];

  // NEW: Market momentum
  momentum: MarketMomentum;

  // NEW: Featured listing summaries
  featuredSummaries: FeaturedListingSummary[];
}

// ============================================================================
// PRICE BAND CONFIGURATION
// ============================================================================

const PRICE_BANDS_CONFIG = [
  { label: 'Under $500K', min: 0, max: 500000 },
  { label: '$500K - $750K', min: 500000, max: 750000 },
  { label: '$750K - $1M', min: 750000, max: 1000000 },
  { label: '$1M - $1.5M', min: 1000000, max: 1500000 },
  { label: '$1.5M - $2M', min: 1500000, max: 2000000 },
  { label: '$2M+', min: 2000000, max: null },
];

// ============================================================================
// KIND TO SQL FILTER MAPPING
// ============================================================================

function getKindFilter(kind: LandingKind): string {
  switch (kind) {
    case 'condos-for-sale':
      return `AND (property_type ILIKE '%condo%' OR property_type ILIKE '%apartment%')`;
    case 'homes-with-pool':
      return `AND (pool_private_yn = true OR pool_features IS NOT NULL)`;
    case 'luxury-homes':
      return `AND list_price >= 2000000`;
    case 'homes-under-500k':
      return `AND list_price < 500000`;
    case 'homes-over-1m':
      return `AND list_price >= 1000000`;
    case '2-bedroom-apartments':
      return `AND bedrooms_total = 2 AND (property_type ILIKE '%condo%' OR property_type ILIKE '%apartment%')`;
    case 'homes-for-sale':
    default:
      return '';
  }
}

// ============================================================================
// MAIN FUNCTION: GET ENHANCED STATS
// ============================================================================

export async function getEnhancedLandingStats(
  city: string,
  kind: LandingKind
): Promise<EnhancedLandingStats | null> {
  let pool: Pool;
  try {
    pool = await getPgPool();
  } catch (err) {
    console.warn('[enhanced-stats] Database pool not available:', err);
    return null;
  }

  const kindFilter = getKindFilter(kind);
  const baseWhere = `
    WHERE LOWER(city) = LOWER($1)
    AND standard_status = 'Active'
    AND list_price > 0
    ${kindFilter}
  `;

  try {
    // Run all queries in parallel for performance
    const [
      coreStats,
      priceBands,
      propertyTypeMix,
      bedroomMix,
      topNeighborhoods,
      momentum,
      featuredSummaries,
    ] = await Promise.all([
      getCoreStats(pool, city, baseWhere),
      getPriceBands(pool, city, baseWhere),
      getPropertyTypeMix(pool, city, baseWhere),
      getBedroomMix(pool, city, baseWhere),
      getTopNeighborhoods(pool, city, baseWhere),
      getMarketMomentum(pool, city, kindFilter),
      getFeaturedSummaries(pool, city, baseWhere),
    ]);

    return {
      ...coreStats,
      priceBands,
      propertyTypeMix,
      bedroomMix,
      topNeighborhoods,
      momentum,
      featuredSummaries,
    };
  } catch (error) {
    console.error('[enhanced-stats] Error fetching enhanced stats:', error);
    return null;
  }
}

// ============================================================================
// INDIVIDUAL QUERY FUNCTIONS
// ============================================================================

async function getCoreStats(
  pool: Pool,
  city: string,
  baseWhere: string
): Promise<{
  medianPrice: number | null;
  pricePerSqft: number | null;
  daysOnMarket: number | null;
  totalActive: number;
}> {
  const query = `
    SELECT 
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) AS median_price,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY 
        CASE WHEN living_area > 0 THEN list_price / living_area ELSE NULL END
      ) AS price_per_sqft,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS days_on_market,
      COUNT(*)::int AS total_active
    FROM listings
    ${baseWhere}
  `;

  const result = await pool.query(query, [city]);
  const row = result.rows[0];

  return {
    medianPrice: row?.median_price ? Math.round(Number(row.median_price)) : null,
    pricePerSqft: row?.price_per_sqft ? Math.round(Number(row.price_per_sqft)) : null,
    daysOnMarket: row?.days_on_market ? Math.round(Number(row.days_on_market)) : null,
    totalActive: row?.total_active || 0,
  };
}

async function getPriceBands(
  pool: Pool,
  city: string,
  baseWhere: string
): Promise<PriceBand[]> {
  // Build CASE statement for price bands
  const caseClauses = PRICE_BANDS_CONFIG.map((band) => {
    if (band.max === null) {
      return `WHEN list_price >= ${band.min} THEN '${band.label}'`;
    }
    return `WHEN list_price >= ${band.min} AND list_price < ${band.max} THEN '${band.label}'`;
  }).join('\n        ');

  const query = `
    WITH total AS (
      SELECT COUNT(*)::float AS cnt FROM listings ${baseWhere}
    ),
    bands AS (
      SELECT 
        CASE 
          ${caseClauses}
        END AS band_label,
        COUNT(*) AS band_count
      FROM listings
      ${baseWhere}
      GROUP BY band_label
    )
    SELECT 
      b.band_label,
      b.band_count::int,
      ROUND((b.band_count / NULLIF(t.cnt, 0) * 100)::numeric, 1) AS percentage
    FROM bands b, total t
    WHERE b.band_label IS NOT NULL
    ORDER BY b.band_count DESC
  `;

  const result = await pool.query(query, [city]);

  return result.rows.map((row) => {
    const config = PRICE_BANDS_CONFIG.find((b) => b.label === row.band_label);
    return {
      label: row.band_label,
      min: config?.min || 0,
      max: config?.max || null,
      count: row.band_count,
      percentage: parseFloat(row.percentage) || 0,
    };
  });
}

async function getPropertyTypeMix(
  pool: Pool,
  city: string,
  baseWhere: string
): Promise<PropertyTypeMix[]> {
  const query = `
    WITH total AS (
      SELECT COUNT(*)::float AS cnt FROM listings ${baseWhere}
    ),
    type_stats AS (
      SELECT 
        COALESCE(
          CASE 
            WHEN property_type ILIKE '%condo%' THEN 'Condo'
            WHEN property_type ILIKE '%townhouse%' OR property_type ILIKE '%town house%' THEN 'Townhouse'
            WHEN property_type ILIKE '%multi%' THEN 'Multi-Family'
            WHEN property_type ILIKE '%single%' OR property_type ILIKE '%residential%' THEN 'Single Family'
            ELSE 'Other'
          END,
          'Other'
        ) AS property_type_normalized,
        COUNT(*) AS type_count,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) AS median_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY 
          CASE WHEN living_area > 0 THEN list_price / living_area ELSE NULL END
        ) AS median_price_per_sqft
      FROM listings
      ${baseWhere}
      GROUP BY property_type_normalized
    )
    SELECT 
      ts.property_type_normalized AS type,
      ts.type_count::int AS count,
      ROUND((ts.type_count / NULLIF(t.cnt, 0) * 100)::numeric, 1) AS percentage,
      ts.median_price,
      ts.median_price_per_sqft
    FROM type_stats ts, total t
    ORDER BY ts.type_count DESC
    LIMIT 5
  `;

  const result = await pool.query(query, [city]);

  return result.rows.map((row) => ({
    type: row.type,
    count: row.count,
    percentage: parseFloat(row.percentage) || 0,
    medianPrice: row.median_price ? Math.round(Number(row.median_price)) : null,
    medianPricePerSqft: row.median_price_per_sqft
      ? Math.round(Number(row.median_price_per_sqft))
      : null,
  }));
}

async function getBedroomMix(
  pool: Pool,
  city: string,
  baseWhere: string
): Promise<BedroomMix[]> {
  const query = `
    WITH total AS (
      SELECT COUNT(*)::float AS cnt FROM listings ${baseWhere}
    ),
    bed_stats AS (
      SELECT 
        CASE 
          WHEN bedrooms_total IS NULL THEN 'Unknown'
          WHEN bedrooms_total >= 4 THEN '4+'
          ELSE bedrooms_total::text
        END AS beds,
        COUNT(*) AS bed_count
      FROM listings
      ${baseWhere}
      GROUP BY beds
    )
    SELECT 
      bs.beds,
      bs.bed_count::int AS count,
      ROUND((bs.bed_count / NULLIF(t.cnt, 0) * 100)::numeric, 1) AS percentage
    FROM bed_stats bs, total t
    WHERE bs.beds != 'Unknown'
    ORDER BY 
      CASE bs.beds 
        WHEN '1' THEN 1 
        WHEN '2' THEN 2 
        WHEN '3' THEN 3 
        WHEN '4+' THEN 4 
        ELSE 5 
      END
  `;

  const result = await pool.query(query, [city]);

  return result.rows.map((row) => ({
    beds: row.beds,
    count: row.count,
    percentage: parseFloat(row.percentage) || 0,
  }));
}

async function getTopNeighborhoods(
  pool: Pool,
  city: string,
  baseWhere: string
): Promise<TopNeighborhood[]> {
  // Try subdivision_name first, fall back to postal_code
  const query = `
    WITH neighborhood_stats AS (
      SELECT 
        COALESCE(
          NULLIF(TRIM(subdivision_name), ''),
          'ZIP ' || postal_code
        ) AS neighborhood,
        COUNT(*) AS active_count,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) AS median_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY 
          CASE WHEN living_area > 0 THEN list_price / living_area ELSE NULL END
        ) AS median_price_per_sqft
      FROM listings
      ${baseWhere}
      AND (subdivision_name IS NOT NULL OR postal_code IS NOT NULL)
      GROUP BY neighborhood
      HAVING COUNT(*) >= 3
    )
    SELECT 
      neighborhood AS name,
      active_count::int,
      median_price,
      median_price_per_sqft
    FROM neighborhood_stats
    ORDER BY active_count DESC
    LIMIT 10
  `;

  const result = await pool.query(query, [city]);

  return result.rows.map((row) => ({
    name: row.name,
    activeCount: row.active_count,
    medianPrice: row.median_price ? Math.round(Number(row.median_price)) : null,
    medianPricePerSqft: row.median_price_per_sqft
      ? Math.round(Number(row.median_price_per_sqft))
      : null,
  }));
}

async function getMarketMomentum(
  pool: Pool,
  city: string,
  kindFilter: string
): Promise<MarketMomentum> {
  const query = `
    WITH stats AS (
      SELECT
        -- New listings
        COUNT(*) FILTER (
          WHERE on_market_date >= CURRENT_DATE - INTERVAL '7 days'
          AND standard_status = 'Active'
        ) AS new_7,
        COUNT(*) FILTER (
          WHERE on_market_date >= CURRENT_DATE - INTERVAL '14 days'
          AND standard_status = 'Active'
        ) AS new_14,
        
        -- Price reductions (if we track price change date)
        COUNT(*) FILTER (
          WHERE price_change_timestamp >= CURRENT_DATE - INTERVAL '7 days'
          AND list_price < original_list_price
          AND standard_status = 'Active'
        ) AS reductions_7,
        COUNT(*) FILTER (
          WHERE price_change_timestamp >= CURRENT_DATE - INTERVAL '14 days'
          AND list_price < original_list_price
          AND standard_status = 'Active'
        ) AS reductions_14,
        
        -- Pending count
        COUNT(*) FILTER (WHERE standard_status = 'Pending') AS pending_count,
        
        -- Active count
        COUNT(*) FILTER (WHERE standard_status = 'Active') AS active_count
      FROM listings
      WHERE LOWER(city) = LOWER($1)
      AND list_price > 0
      ${kindFilter}
    )
    SELECT 
      new_7::int,
      new_14::int,
      reductions_7::int,
      reductions_14::int,
      pending_count::int,
      active_count::int,
      CASE 
        WHEN active_count > 0 
        THEN ROUND((pending_count::numeric / active_count::numeric), 2)
        ELSE NULL
      END AS pending_to_active_ratio
    FROM stats
  `;

  try {
    const result = await pool.query(query, [city]);
    const row = result.rows[0];

    return {
      newListingsLast7Days: row?.new_7 || 0,
      newListingsLast14Days: row?.new_14 || 0,
      priceReductionsLast7Days: row?.reductions_7 || 0,
      priceReductionsLast14Days: row?.reductions_14 || 0,
      pendingCount: row?.pending_count || 0,
      pendingToActiveRatio: row?.pending_to_active_ratio
        ? parseFloat(row.pending_to_active_ratio)
        : null,
    };
  } catch {
    // Some columns might not exist, return defaults
    return {
      newListingsLast7Days: 0,
      newListingsLast14Days: 0,
      priceReductionsLast7Days: 0,
      priceReductionsLast14Days: 0,
      pendingCount: 0,
      pendingToActiveRatio: null,
    };
  }
}

async function getFeaturedSummaries(
  pool: Pool,
  city: string,
  baseWhere: string
): Promise<FeaturedListingSummary[]> {
  const query = `
    SELECT 
      list_price AS price,
      bedrooms_total AS beds,
      bathrooms_total AS baths,
      living_area AS sqft,
      property_type,
      COALESCE(
        NULLIF(TRIM(subdivision_name), ''),
        'ZIP ' || postal_code
      ) AS neighborhood,
      LEFT(public_remarks, 140) AS remarks_summary
    FROM listings
    ${baseWhere}
    ORDER BY 
      CASE WHEN photo_url IS NOT NULL THEN 0 ELSE 1 END,
      modification_timestamp DESC NULLS LAST
    LIMIT 6
  `;

  const result = await pool.query(query, [city]);

  return result.rows.map((row) => ({
    price: Math.round(Number(row.price)),
    beds: row.beds ? parseInt(row.beds) : null,
    baths: row.baths ? parseFloat(row.baths) : null,
    sqft: row.sqft ? parseInt(row.sqft) : null,
    propertyType: normalizePropertyType(row.property_type),
    neighborhood: row.neighborhood || null,
    remarksSummary: row.remarks_summary
      ? cleanRemarksSummary(row.remarks_summary)
      : null,
  }));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizePropertyType(type: string | null): string | null {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower.includes('condo')) return 'Condo';
  if (lower.includes('townhouse') || lower.includes('town house')) return 'Townhouse';
  if (lower.includes('multi')) return 'Multi-Family';
  if (lower.includes('single') || lower.includes('residential')) return 'Single Family';
  return type;
}

function cleanRemarksSummary(remarks: string): string {
  // Remove agent-speak, contact info, and clean up
  return remarks
    .replace(/call\s+\d{3}[-.]?\d{3}[-.]?\d{4}/gi, '')
    .replace(/email\s+\S+@\S+/gi, '')
    .replace(/contact\s+(listing\s+)?agent/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// FORMAT FOR AI INPUT
// ============================================================================

export function formatEnhancedStatsForAI(stats: EnhancedLandingStats): Record<string, unknown> {
  return {
    // Core stats
    median_price: stats.medianPrice,
    price_per_sqft: stats.pricePerSqft,
    days_on_market: stats.daysOnMarket,
    total_active: stats.totalActive,

    // Price distribution
    price_bands: stats.priceBands.map((b) => ({
      range: b.label,
      count: b.count,
      share: `${b.percentage}%`,
    })),

    // Property type breakdown
    property_type_mix: stats.propertyTypeMix.map((p) => ({
      type: p.type,
      count: p.count,
      share: `${p.percentage}%`,
      median_price: p.medianPrice,
      median_sqft_price: p.medianPricePerSqft,
    })),

    // Bedroom distribution
    bedroom_mix: stats.bedroomMix.map((b) => ({
      beds: b.beds,
      count: b.count,
      share: `${b.percentage}%`,
    })),

    // Top neighborhoods by inventory
    top_neighborhoods: stats.topNeighborhoods.map((n) => ({
      name: n.name,
      active_listings: n.activeCount,
      median_price: n.medianPrice,
      price_per_sqft: n.medianPricePerSqft,
    })),

    // Market momentum indicators
    market_momentum: {
      new_listings_7d: stats.momentum.newListingsLast7Days,
      new_listings_14d: stats.momentum.newListingsLast14Days,
      price_reductions_7d: stats.momentum.priceReductionsLast7Days,
      price_reductions_14d: stats.momentum.priceReductionsLast14Days,
      pending_count: stats.momentum.pendingCount,
      pending_to_active_ratio: stats.momentum.pendingToActiveRatio,
    },

    // Featured listing summaries (for AI to reference real inventory)
    featured_listings: stats.featuredSummaries.map((f) => ({
      price: f.price,
      beds: f.beds,
      baths: f.baths,
      sqft: f.sqft,
      type: f.propertyType,
      area: f.neighborhood,
      highlight: f.remarksSummary,
    })),
  };
}

/**
 * Build comprehensive market stats text from enhanced stats
 */
export function buildEnhancedMarketStatsText(city: string, stats: EnhancedLandingStats): string {
  const parts: string[] = [];

  // Core stats
  if (stats.medianPrice) {
    parts.push(`The median home price in ${city} is $${stats.medianPrice.toLocaleString()}`);
  }
  if (stats.pricePerSqft) {
    parts.push(`averaging $${stats.pricePerSqft}/sqft`);
  }
  if (stats.daysOnMarket) {
    parts.push(`with properties spending ${stats.daysOnMarket} days on market`);
  }
  if (stats.totalActive) {
    parts.push(`There are currently ${stats.totalActive} active listings`);
  }

  // Price distribution insight
  const topBand = stats.priceBands[0];
  if (topBand && topBand.percentage > 20) {
    parts.push(
      `Most inventory (${topBand.percentage}%) falls in the ${topBand.label} range`
    );
  }

  // Property type insight
  const topType = stats.propertyTypeMix[0];
  if (topType && topType.percentage > 30) {
    parts.push(
      `${topType.type} properties dominate at ${topType.percentage}% of listings`
    );
  }

  // Neighborhood insight
  if (stats.topNeighborhoods.length > 0) {
    const topHoods = stats.topNeighborhoods.slice(0, 3).map((n) => n.name);
    parts.push(
      `Most inventory is concentrated in ${topHoods.join(', ')}`
    );
  }

  // Momentum insight
  if (stats.momentum.pendingToActiveRatio && stats.momentum.pendingToActiveRatio > 0.3) {
    parts.push(
      `The market shows strong demand with a ${stats.momentum.pendingToActiveRatio} pending-to-active ratio`
    );
  }

  return parts.join('. ') + '.';
}
