/**
 * Landing Page Input Enrichment from Cloud SQL
 * =============================================
 * Computes listing mix and aggregates from the MLS-synced database
 * to provide rich, factual data for AI content generation.
 * 
 * @version 4.0.0
 */

import { getPgPool } from '@/lib/db';
import type { LandingKind } from '@/types/landing';
import { isBuildPhase } from '@/lib/env/buildDetection';
import { deriveAllowedPlaceNames } from '../validators/landingOutputValidator';
import type { InputJson } from '../landing';

// ============================================================================
// Types
// ============================================================================

export interface ListingMix {
  /** Total count matching filters */
  listing_count?: number;
  /** Property type distribution */
  property_type_counts?: Record<string, number>;
  /** Price band distribution */
  price_bands?: Array<{ label: string; min?: number; max?: number; count?: number }>;
  /** Bedroom distribution */
  beds_distribution?: Array<{ label: string; count: number }>;
  /** Days on market buckets */
  dom_buckets?: Array<{ label: string; count: number }>;
  /** Notable signals (qualitative observations) */
  notable_signals?: string[];
  /** Common filters for this page type */
  common_filters?: string[];
}

export interface PageTypeSignals {
  /** Short description of what this page type focuses on */
  focus: string;
  /** Typical buyer profile */
  typical_buyer?: string;
  /** Key differentiators from general search */
  differentiators?: string[];
}

export interface LocalArea {
  name: string;
  notes?: string;
  internal_link_href?: string;
  internal_link_text?: string;
}

export interface InternalLinkItem {
  href: string;
  anchor: string;
}

export interface InternalLinks {
  related_pages?: InternalLinkItem[];
  more_in_city?: InternalLinkItem[];
  nearby_cities?: InternalLinkItem[];
}

export interface EnrichedInputJson extends InputJson {
  listing_mix?: ListingMix;
  page_type_signals?: PageTypeSignals;
  allowed_place_names?: string[];
}

// ============================================================================
// Page Type Filter Mapping (reuse from query.ts logic)
// ============================================================================

interface KindFilter {
  sql: string;
  params: unknown[];
  description: string;
}

function buildKindFilter(kind: LandingKind): KindFilter {
  switch (kind) {
    case 'homes-with-pool':
      return {
        sql: "AND (pool_features IS NOT NULL AND pool_features <> '')",
        params: [],
        description: 'homes with pool features',
      };
    case 'homes-under-500k':
      return {
        sql: 'AND list_price <= $PARAM',
        params: [500000],
        description: 'homes priced under $500,000',
      };
    case 'homes-over-1m':
      return {
        sql: 'AND list_price >= $PARAM',
        params: [1000000],
        description: 'homes priced over $1,000,000',
      };
    case 'luxury-homes':
      return {
        sql: 'AND list_price >= $PARAM',
        params: [1000000],
        description: 'luxury homes (typically $1M+)',
      };
    case 'condos-for-sale':
      return {
        sql: "AND LOWER(property_type) LIKE '%condo%'",
        params: [],
        description: 'condominium properties',
      };
    case '2-bedroom-apartments':
      return {
        sql: 'AND bedrooms_total = 2',
        params: [],
        description: '2-bedroom units',
      };
    case 'homes-for-sale':
    default:
      return {
        sql: '',
        params: [],
        description: 'all residential properties',
      };
  }
}

/**
 * Get page type signals based on landing kind
 */
function getPageTypeSignals(kind: LandingKind): PageTypeSignals {
  switch (kind) {
    case 'homes-with-pool':
      return {
        focus: 'Properties with private pool or pool access',
        typical_buyer: 'Families, outdoor enthusiasts, entertainers',
        differentiators: ['Pool maintenance considerations', 'Year-round outdoor living', 'Premium lot sizes'],
      };
    case 'homes-under-500k':
      return {
        focus: 'Entry-level and affordable housing options',
        typical_buyer: 'First-time buyers, budget-conscious families, investors',
        differentiators: ['Value-focused', 'May require updates', 'Competitive market segment'],
      };
    case 'homes-over-1m':
      return {
        focus: 'Premium properties above $1 million',
        typical_buyer: 'Move-up buyers, executives, growing families',
        differentiators: ['Larger homes', 'Better locations', 'Premium finishes'],
      };
    case 'luxury-homes':
      return {
        focus: 'High-end luxury real estate',
        typical_buyer: 'Affluent buyers, executives, second-home buyers',
        differentiators: ['Premium locations', 'Exceptional finishes', 'Exclusive amenities'],
      };
    case 'condos-for-sale':
      return {
        focus: 'Condominium and attached properties',
        typical_buyer: 'Young professionals, downsizers, investors',
        differentiators: ['Lower maintenance', 'HOA amenities', 'Urban convenience'],
      };
    case '2-bedroom-apartments':
      return {
        focus: 'Two-bedroom units for smaller households',
        typical_buyer: 'Couples, small families, roommates',
        differentiators: ['Right-sized living', 'Often lower price point', 'Good rental potential'],
      };
    case 'homes-for-sale':
    default:
      return {
        focus: 'All residential properties for sale',
        typical_buyer: 'Home buyers of all types',
        differentiators: ['Full market view', 'Various price points', 'Diverse property types'],
      };
  }
}

// ============================================================================
// Database Aggregation Functions
// ============================================================================

/**
 * Fetch listing mix aggregates from Cloud SQL
 * Uses efficient single-query approach with CTEs
 */
async function fetchListingMixFromDb(
  city: string,
  kind: LandingKind
): Promise<ListingMix> {
  // Skip during build
  if (isBuildPhase()) {
    console.log('[fetchListingMix] Skipping - build phase');
    return {};
  }

  try {
    const pool = await getPgPool();
    const kindFilter = buildKindFilter(kind);

    // Build base CTE
    let paramIndex = 1;
    const params: unknown[] = [`%${city}%`];

    let kindSql = kindFilter.sql;
    kindFilter.params.forEach(p => {
      paramIndex++;
      params.push(p);
      kindSql = kindSql.replace('$PARAM', `$${paramIndex}`);
    });

    const sql = `
      WITH filtered AS (
        SELECT 
          list_price,
          property_type,
          bedrooms_total,
          COALESCE(days_on_market, 
            GREATEST(1, EXTRACT(DAY FROM (NOW() - COALESCE(on_market_date, listed_at, modification_timestamp, NOW()))))::int
          ) as dom
        FROM properties
        WHERE status = 'Active'
          AND LOWER(property_type) <> 'land'
          AND LOWER(city) LIKE LOWER($1)
          ${kindSql}
      )
      SELECT 
        -- Total count
        (SELECT COUNT(*) FROM filtered) AS total_count,
        
        -- Property type distribution (top 5)
        (SELECT json_agg(row_to_json(pt))
         FROM (
           SELECT property_type, COUNT(*) as count
           FROM filtered
           WHERE property_type IS NOT NULL
           GROUP BY property_type
           ORDER BY count DESC
           LIMIT 5
         ) pt
        ) AS property_types,
        
        -- Beds distribution
        (SELECT json_agg(row_to_json(bd))
         FROM (
           SELECT 
             CASE 
               WHEN bedrooms_total IS NULL THEN 'Unknown'
               WHEN bedrooms_total <= 1 THEN 'Studio/1 BR'
               WHEN bedrooms_total = 2 THEN '2 BR'
               WHEN bedrooms_total = 3 THEN '3 BR'
               WHEN bedrooms_total = 4 THEN '4 BR'
               ELSE '5+ BR'
             END AS label,
             COUNT(*) as count
           FROM filtered
           GROUP BY label
           ORDER BY count DESC
         ) bd
        ) AS beds_dist,
        
        -- DOM buckets
        (SELECT json_agg(row_to_json(dm))
         FROM (
           SELECT 
             CASE 
               WHEN dom <= 7 THEN 'New (0-7 days)'
               WHEN dom <= 30 THEN '1-4 weeks'
               WHEN dom <= 60 THEN '1-2 months'
               ELSE '60+ days'
             END AS label,
             COUNT(*) as count
           FROM filtered
           GROUP BY label
           ORDER BY 
             CASE label
               WHEN 'New (0-7 days)' THEN 1
               WHEN '1-4 weeks' THEN 2
               WHEN '1-2 months' THEN 3
               ELSE 4
             END
         ) dm
        ) AS dom_buckets,
        
        -- Price percentiles for bands
        (SELECT json_build_object(
           'p25', PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY list_price),
           'p50', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price),
           'p75', PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY list_price),
           'min', MIN(list_price),
           'max', MAX(list_price)
         ) FROM filtered
         WHERE list_price IS NOT NULL
        ) AS price_stats
    `;

    const { rows } = await pool.query(sql, params);
    const row = rows[0];

    if (!row || !row.total_count) {
      return { listing_count: 0 };
    }

    const listingMix: ListingMix = {
      listing_count: Number(row.total_count),
    };

    // Property type counts
    if (row.property_types && Array.isArray(row.property_types)) {
      listingMix.property_type_counts = {};
      row.property_types.forEach((pt: { property_type: string; count: number }) => {
        if (pt.property_type && listingMix.property_type_counts) {
          listingMix.property_type_counts[pt.property_type] = Number(pt.count);
        }
      });
    }

    // Beds distribution
    if (row.beds_dist && Array.isArray(row.beds_dist)) {
      listingMix.beds_distribution = row.beds_dist.map((b: { label: string; count: number }) => ({
        label: b.label,
        count: Number(b.count),
      }));
    }

    // DOM buckets
    if (row.dom_buckets && Array.isArray(row.dom_buckets)) {
      listingMix.dom_buckets = row.dom_buckets.map((d: { label: string; count: number }) => ({
        label: d.label,
        count: Number(d.count),
      }));
    }

    // Price bands from percentiles
    if (row.price_stats) {
      const stats = row.price_stats;
      listingMix.price_bands = [
        { label: 'Entry Level', max: stats.p25, count: undefined },
        { label: 'Mid-Range', min: stats.p25, max: stats.p75, count: undefined },
        { label: 'Premium', min: stats.p75, count: undefined },
      ].filter(b => b.max || b.min);
    }

    // Generate notable signals based on data
    const signals: string[] = [];
    if (listingMix.listing_count && listingMix.listing_count > 50) {
      signals.push('Active inventory available');
    }
    if (listingMix.dom_buckets) {
      const newListings = listingMix.dom_buckets.find(b => b.label.includes('New'));
      if (newListings && newListings.count > 10) {
        signals.push('Fresh listings coming to market');
      }
    }
    if (signals.length > 0) {
      listingMix.notable_signals = signals;
    }

    // Common filters for this page type
    listingMix.common_filters = getCommonFilters(kind);

    return listingMix;
  } catch (error) {
    console.error('[fetchListingMix] Error:', error);
    return {};
  }
}

/**
 * Get common search filters for a page type
 */
function getCommonFilters(kind: LandingKind): string[] {
  const baseFilters = ['Price range', 'Bedrooms', 'Bathrooms', 'Square footage'];
  
  switch (kind) {
    case 'homes-with-pool':
      return [...baseFilters, 'Pool type', 'Lot size'];
    case 'condos-for-sale':
      return [...baseFilters, 'HOA fees', 'Floor level', 'Parking'];
    case 'luxury-homes':
    case 'homes-over-1m':
      return [...baseFilters, 'Views', 'Lot size', 'Year built'];
    case 'homes-under-500k':
      return [...baseFilters, 'Condition', 'Year built'];
    default:
      return baseFilters;
  }
}

// ============================================================================
// Local Areas Source
// ============================================================================

/**
 * Local areas configuration by city
 * 
 * NOTE: This is a curated list. In production, this should come from a DB table.
 * TODO: Migrate to local_areas table in Supabase/Cloud SQL
 * 
 * Environment variable LANDING_LOCAL_AREAS_SOURCE can be:
 * - 'config' (default): Use this hardcoded config
 * - 'database': Query from local_areas table (TODO: implement)
 */
const LOCAL_AREAS_CONFIG: Record<string, LocalArea[]> = {
  // California cities - curated, verified areas
  'los-angeles': [
    { name: 'Downtown Los Angeles', notes: 'Urban core, lofts, high-rises' },
    { name: 'Westside', notes: 'Beach-adjacent communities' },
    { name: 'San Fernando Valley', notes: 'Suburban, family-oriented' },
  ],
  'san-diego': [
    { name: 'Central San Diego', notes: 'Urban neighborhoods near downtown' },
    { name: 'Coastal Communities', notes: 'Beach-adjacent areas' },
    { name: 'North County', notes: 'Suburban communities north of downtown' },
  ],
  'san-jose': [
    { name: 'Central San Jose', notes: 'Downtown and surrounding neighborhoods' },
    { name: 'South San Jose', notes: 'Suburban residential areas' },
    { name: 'West San Jose', notes: 'Near tech corridors' },
  ],
  'san-francisco': [
    { name: 'Downtown SF', notes: 'Urban core, Financial District' },
    { name: 'Sunset District', notes: 'Residential, foggy, family homes' },
    { name: 'South of Market', notes: 'Modern condos, tech-adjacent' },
  ],
  'irvine': [
    { name: 'Central Irvine', notes: 'Business district, newer developments' },
    { name: 'Woodbridge', notes: 'Established community with lakes' },
    { name: 'Turtle Rock', notes: 'Hillside homes, established area' },
  ],
  'pasadena': [
    { name: 'Old Town Pasadena', notes: 'Historic, walkable, urban' },
    { name: 'South Pasadena', notes: 'Tree-lined streets, Craftsman homes' },
    { name: 'East Pasadena', notes: 'Suburban, family-oriented' },
  ],
  'santa-monica': [
    { name: 'Downtown Santa Monica', notes: 'Urban, walkable to beach' },
    { name: 'North of Montana', notes: 'Premium residential area' },
    { name: 'Ocean Park', notes: 'Eclectic, near beach' },
  ],
};

/**
 * Get local areas for a city
 * Returns curated list from config or empty array if not defined
 */
function getLocalAreasForCity(citySlug: string): LocalArea[] {
  const normalized = citySlug.toLowerCase().replace(/\s+/g, '-');
  return LOCAL_AREAS_CONFIG[normalized] || [];
}

// ============================================================================
// Main Enrichment Function
// ============================================================================

export interface BuildEnrichedInputOptions {
  city: string;
  state?: string;
  kind: LandingKind;
  canonicalPath: string;
  county?: string;
  region?: string;
  internalLinks?: InternalLinks;
  /** Market stats (if already fetched) */
  marketStats?: {
    medianPrice?: number;
    pricePerSqft?: number;
    daysOnMarket?: number;
    totalActive?: number;
  };
  /** Whether featured listings have missing specs */
  featuredListingsHasMissingSpecs?: boolean;
  /** Data source label */
  dataSource?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Build enriched INPUT_JSON with listing mix, local areas, and allowed place names
 * 
 * This is the main function for v4 input enrichment.
 * It computes additional aggregates from Cloud SQL and derives the allowlist.
 */
export async function buildEnrichedInputJson(
  options: BuildEnrichedInputOptions
): Promise<EnrichedInputJson> {
  const {
    city,
    state = 'CA',
    kind,
    canonicalPath,
    county,
    region = 'California',
    internalLinks,
    marketStats,
    featuredListingsHasMissingSpecs = true,
    dataSource = 'Cloud SQL (MLS-synced)',
    debug = process.env.LANDING_DEBUG === 'true',
  } = options;

  if (debug) {
    console.log('[buildEnrichedInputJson] Starting enrichment', { city, kind });
  }

  // Build base input
  const baseInput: EnrichedInputJson = {
    city,
    canonical_path: canonicalPath,
    data_source: dataSource,
    last_updated_iso: new Date().toISOString(),
    featured_listings_has_missing_specs: featuredListingsHasMissingSpecs,
    region,
  };

  if (county) {
    baseInput.county = county;
  }

  // Add market stats if provided
  if (marketStats) {
    if (marketStats.medianPrice != null) {
      baseInput.median_price = marketStats.medianPrice;
    }
    if (marketStats.pricePerSqft != null) {
      baseInput.price_per_sqft = marketStats.pricePerSqft;
    }
    if (marketStats.daysOnMarket != null) {
      baseInput.days_on_market = marketStats.daysOnMarket;
    }
    if (marketStats.totalActive != null) {
      baseInput.total_active = marketStats.totalActive;
    }

    // Build market stats text
    const parts: string[] = [];
    if (marketStats.medianPrice != null) {
      parts.push(`Median price $${marketStats.medianPrice.toLocaleString()}`);
    }
    if (marketStats.pricePerSqft != null) {
      parts.push(`price per sqft $${Math.round(marketStats.pricePerSqft)}`);
    }
    if (marketStats.daysOnMarket != null) {
      parts.push(`average DOM ${marketStats.daysOnMarket} days`);
    }
    if (marketStats.totalActive != null) {
      parts.push(`active listings ${marketStats.totalActive.toLocaleString()}`);
    }
    if (parts.length > 0) {
      baseInput.market_stats_text = parts.join(', ') + '.';
    }
  }

  // Add internal links
  if (internalLinks) {
    baseInput.internal_links = internalLinks;
  }

  // Fetch listing mix from DB
  const listingMix = await fetchListingMixFromDb(city, kind);
  if (Object.keys(listingMix).length > 0) {
    baseInput.listing_mix = listingMix;
  }

  // Add page type signals
  baseInput.page_type_signals = getPageTypeSignals(kind);

  // Get local areas
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const localAreas = getLocalAreasForCity(citySlug);
  
  // Attach internal links to local areas if available
  if (localAreas.length > 0 && internalLinks) {
    const allLinks = [
      ...(internalLinks.related_pages || []),
      ...(internalLinks.more_in_city || []),
    ];
    
    localAreas.forEach((area, idx) => {
      if (allLinks[idx]) {
        area.internal_link_href = allLinks[idx].href;
        area.internal_link_text = allLinks[idx].anchor;
      }
    });
    
    baseInput.local_areas = localAreas;
  }

  // Derive allowed place names
  baseInput.allowed_place_names = deriveAllowedPlaceNames(baseInput);

  if (debug) {
    console.log('[buildEnrichedInputJson] Enrichment complete', {
      hasListingMix: !!baseInput.listing_mix,
      hasLocalAreas: !!baseInput.local_areas,
      allowedPlaceNamesCount: baseInput.allowed_place_names?.length,
    });
  }

  return baseInput;
}

/**
 * Quick function to just derive allowed place names from existing input
 * Use when you already have an InputJson and just need the allowlist
 */
export function enrichWithAllowlist(input: InputJson): EnrichedInputJson {
  return {
    ...input,
    allowed_place_names: deriveAllowedPlaceNames(input),
  };
}
