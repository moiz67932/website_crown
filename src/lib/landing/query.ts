// Real Postgres-backed landing query layer.
// Provides aggregate stats + featured listings + basic SEO scaffolding.

import { LandingKind, LandingData, LandingStats, LandingPropertyCard } from '@/types/landing'
import { searchProperties } from '@/lib/db'
import { getPgPool } from '@/lib/db'
import { getAIDescription } from './ai'

// Map landing kind to additional filter predicates for SQL aggregates
function buildKindFilter(kind: LandingKind): { sql: string; params: any[]; searchParams: Record<string, any> } {
  switch (kind) {
    case 'homes-with-pool':
      return { sql: "AND (pool_features IS NOT NULL AND pool_features <> '')", params: [], searchParams: { hasPool: true } }
    case 'homes-under-500k':
      return { sql: 'AND list_price <= $EXTRA1', params: [500000], searchParams: { maxPrice: 500000 } }
    case 'condos-for-sale':
      return { sql: "AND LOWER(property_type) LIKE LOWER('%condo%')", params: [], searchParams: { propertyType: 'condo' } }
    case 'two-bedroom-apartments':
      // Treat as property_type containing apartment & exactly two beds
      return { sql: "AND LOWER(property_type) LIKE LOWER('%apartment%') AND bedrooms = 2", params: [], searchParams: { propertyType: 'apartment', minBedrooms: 2, maxBedrooms: 2 } }
    case 'homes-for-sale':
    default:
      return { sql: '', params: [], searchParams: {} }
  }
}

// State mapping (US) abbreviation -> full name
const STATE_MAP: Record<string, string> = {
  AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california', CO: 'colorado', CT: 'connecticut',
  DE: 'delaware', FL: 'florida', GA: 'georgia', HI: 'hawaii', ID: 'idaho', IL: 'illinois', IN: 'indiana', IA: 'iowa',
  KS: 'kansas', KY: 'kentucky', LA: 'louisiana', ME: 'maine', MD: 'maryland', MA: 'massachusetts', MI: 'michigan',
  MN: 'minnesota', MS: 'mississippi', MO: 'missouri', MT: 'montana', NE: 'nebraska', NV: 'nevada', NH: 'new hampshire',
  NJ: 'new jersey', NM: 'new mexico', NY: 'new york', NC: 'north carolina', ND: 'north dakota', OH: 'ohio', OK: 'oklahoma',
  OR: 'oregon', PA: 'pennsylvania', RI: 'rhode island', SC: 'south carolina', SD: 'south dakota', TN: 'tennessee', TX: 'texas',
  UT: 'utah', VT: 'vermont', VA: 'virginia', WA: 'washington', WV: 'west virginia', WI: 'wisconsin', WY: 'wyoming'
}
const FULL_TO_ABBR: Record<string,string> = Object.fromEntries(Object.entries(STATE_MAP).map(([abbr, full]) => [full, abbr]))

function detectStateToken(tokenRaw: string): { isState: boolean; abbr?: string; canonical?: string } {
  const token = tokenRaw.trim().toLowerCase()
  if (token.length === 2 && STATE_MAP[token.toUpperCase()]) {
    return { isState: true, abbr: token.toUpperCase(), canonical: STATE_MAP[token.toUpperCase()] }
  }
  if (FULL_TO_ABBR[token]) {
    return { isState: true, abbr: FULL_TO_ABBR[token], canonical: token }
  }
  return { isState: false }
}

// Cache whether days_on_market column exists to build safe aggregate query
let hasDaysOnMarketColumn: boolean | null = null
async function ensureSchemaIntrospection() {
  if (hasDaysOnMarketColumn !== null) return
  try {
    const pool = await getPgPool()
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'days_on_market' LIMIT 1`
    )
    hasDaysOnMarketColumn = !!rows.length
  } catch (e) {
    console.warn('Landing schema introspection failed; assuming no days_on_market column')
    hasDaysOnMarketColumn = false
  }
}

export async function getLandingStats(cityOrState: string, kind: LandingKind): Promise<LandingStats> {
  await ensureSchemaIntrospection()
  const pool = await getPgPool()
  const stateInfo = detectStateToken(cityOrState)
  const baseParams: any[] = []
  const kindFilter = buildKindFilter(kind)
  const selectDays = hasDaysOnMarketColumn
    ? 'ROUND(AVG(days_on_market)) AS days_on_market'
    : "ROUND(AVG(GREATEST(1, EXTRACT(DAY FROM (NOW() - first_seen_ts))))) AS days_on_market" // fallback heuristic
  // Base filter built dynamically depending on whether token is state.
  let locationPredicate = ''
  if (stateInfo.isState) {
    // Normalize full name path to abbreviation (DB likely stores abbreviation)
    baseParams.push(stateInfo.abbr)
    locationPredicate = 'AND LOWER(state) = LOWER($1)'
  } else {
    baseParams.push(cityOrState)
    locationPredicate = 'AND LOWER(city) = LOWER($1)'
  }

  let sql = `SELECT
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)::numeric) AS median_price,
      ROUND(AVG(list_price / NULLIF(living_area,0))) AS price_per_sqft,
      ${selectDays},
      COUNT(*) AS total_active
    FROM properties
    WHERE status = 'Active'
      ${locationPredicate}`

  // Inject kind-specific predicate & params (only once)
  if (kindFilter.sql) {
    if (kindFilter.params.length) {
      kindFilter.params.forEach((p, idx) => {
        baseParams.push(p)
        const paramIndex = baseParams.length
        sql += '\n      ' + kindFilter.sql.replace('$EXTRA' + (idx + 1), '$' + paramIndex)
      })
    } else {
      sql += '\n      ' + kindFilter.sql
    }
  }

  if (process.env.LANDING_DEBUG) {
    console.log('[landing.stats.sql]', sql, baseParams)
  }

  try {
    let { rows } = await pool.query(sql, baseParams)
    let r = rows[0]
    // Fallback: if not state token and zero results, try city OR state match.
    if (!stateInfo.isState && (!r || !r.total_active || Number(r.total_active) === 0)) {
      if (process.env.LANDING_DEBUG) console.log('[landing.stats.fallback] city/state dual predicate for', cityOrState)
      const fallbackSql = sql.replace(locationPredicate, 'AND (LOWER(city)=LOWER($1) OR LOWER(state)=LOWER($1))')
      ;({ rows } = await pool.query(fallbackSql, baseParams))
      r = rows[0]
    }
    if (!r) return {}
    return {
      medianPrice: r.median_price != null ? Number(r.median_price) : undefined,
      pricePerSqft: r.price_per_sqft != null ? Number(r.price_per_sqft) : undefined,
      daysOnMarket: r.days_on_market != null ? Number(r.days_on_market) : undefined,
      totalActive: r.total_active != null ? Number(r.total_active) : undefined
    }
  } catch (e) {
    console.error('Error fetching landing stats', e)
    return {}
  }
}

export async function getFeaturedProperties(cityOrState: string, kind: LandingKind, limit = 12): Promise<LandingPropertyCard[]> {
  const kindFilter = buildKindFilter(kind)
  const stateInfo = detectStateToken(cityOrState)
  try {
    const baseParams: any = {
      limit,
      sort: 'updated',
      ...kindFilter.searchParams
    }
    if (stateInfo.isState) {
      baseParams.state = stateInfo.abbr
    } else {
      baseParams.city = cityOrState
    }
    let { properties } = await searchProperties(baseParams)
    // Fallback for city: if zero results and not state token, retry with state param using possible abbreviation mapping
    if (!stateInfo.isState && properties.length === 0) {
      const maybeState = detectStateToken(cityOrState)
      if (maybeState.isState) {
        if (process.env.LANDING_DEBUG) console.log('[landing.featured.fallback] retrying as state', maybeState.abbr)
        properties = (await searchProperties({ ...baseParams, city: undefined, state: maybeState.abbr })).properties
      }
    }
    if (process.env.LANDING_DEBUG) {
      console.log(`[landing.featured] token=${cityOrState} kind=${kind} count=${properties.length}`)
    }
    return properties.map((p: any) => ({
      listingKey: p.listing_key,
      city: p.city,
      state: p.state,
      price: p.list_price ?? undefined,
      beds: p.bedrooms ?? undefined,
      baths: p.bathrooms_total ?? undefined,
      sqft: p.living_area ?? undefined,
      status: p.status ?? undefined,
      img: p.main_photo_url ?? undefined,
      lat: p.latitude ?? undefined,
      lng: p.longitude ?? undefined
    }))
  } catch (e) {
    console.error('Error fetching featured properties', e)
    return []
  }
}

// High-level orchestrator for landing page data
export async function getLandingData(cityOrState: string, kind: LandingKind): Promise<LandingData> {
  const [stats, featured, aiDescriptionHtml] = await Promise.all([
    getLandingStats(cityOrState, kind),
    getFeaturedProperties(cityOrState, kind, 12),
    getAIDescription(cityOrState, kind).catch((e) => { console.warn('AI description failed', e); return undefined })
  ])

  // Basic placeholder / TODO sections (external data integrations later)
  const neighborhoods: NonNullable<LandingData['neighborhoods']> = [] // TODO integrate neighborhoods API
  const schools: NonNullable<LandingData['schools']> = [] // TODO integrate schools API
  const trends: NonNullable<LandingData['trends']> = [] // TODO market trends source
  const faq: NonNullable<LandingData['faq']> = [
    { q: 'How competitive is the market?', a: 'Market competitiveness data integration pending. Currently derived from active inventory levels.' },
    { q: 'What is the average days on market?', a: stats.daysOnMarket ? `${stats.daysOnMarket} days (rolling average).` : 'Days on market data loading.' }
  ]
  const related: NonNullable<LandingData['related']> = [
    { label: `${titleCase(cityOrState)} Condos`, href: `/${cityOrState}/condos-for-sale` },
    { label: `${titleCase(cityOrState)} Homes with Pool`, href: `/${cityOrState}/homes-with-pool` },
    { label: 'Under 500K', href: `/${cityOrState}/homes-under-500k` }
  ]

  const seoTitleBase = kind.replace(/-/g, ' ')
  const seo: LandingData['seo'] = {
    title: `${titleCase(cityOrState)} ${titleCase(seoTitleBase)}`,
    description: `Explore ${titleCase(cityOrState)} ${seoTitleBase} listings, real-time stats, and local housing insights.`,
    canonical: `/${cityOrState}/${kind}`
  }

  const rawHero = featured[0]?.img
  const heroImage: string | undefined = rawHero ?? undefined

  return {
    kind,
    city: cityOrState,
    heroImage, // coerced to string | undefined (no null)
    introHtml: `<p>Browse active ${seoTitleBase} in ${titleCase(cityOrState)}. Updated listing data includes pricing, photos, and key property details.</p>`,
    aiDescriptionHtml,
    stats,
    featured,
    neighborhoods,
    schools,
    trends,
    faq,
    related,
    amenities: [] as NonNullable<LandingData['amenities']>, // TODO
    transportation: {} as NonNullable<LandingData['transportation']>, // TODO
    weather: {} as NonNullable<LandingData['weather']>, // TODO
    demographics: {} as NonNullable<LandingData['demographics']>, // TODO
    economics: {} as NonNullable<LandingData['economics']>, // TODO
    crime: {} as NonNullable<LandingData['crime']>, // TODO
    businessDirectory: [] as NonNullable<LandingData['businessDirectory']>, // TODO
  relatedCities: [] as NonNullable<LandingData['relatedCities']>, // TODO suggestions based on region
    seo
  }
}

function titleCase(str: string) {
  return str.split(/[-\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Helper to debug available cities (not used in production rendering)
export async function listActiveCities(limit = 25): Promise<Array<{ city: string; count: number }>> {
  const pool = await getPgPool()
  const { rows } = await pool.query(
    `SELECT LOWER(city) AS city, COUNT(*)::int AS count FROM properties WHERE status='Active' AND city IS NOT NULL GROUP BY 1 ORDER BY count DESC LIMIT $1`,
    [limit]
  )
  return rows
}
