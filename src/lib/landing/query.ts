// Real Postgres-backed landing query layer.
// Provides aggregate stats + featured listings + basic SEO scaffolding.

import { LandingKind, LandingData, LandingStats, LandingPropertyCard } from '../../types/landing'
import { searchProperties } from '../db'
import { pool } from '../db/connection'
import { getAIDescription } from './ai'
import { LANDING_PROMPTS } from '../ai/prompts/landings'
import type { LandingDef } from './defs'

// Map landing kind to additional filter predicates for SQL aggregates
function buildKindFilter(kind: LandingKind): { sql: string; params: any[]; searchParams: Record<string, any> } {
  switch (kind) {
    case 'homes-with-pool':
      return { sql: "AND (pool_features IS NOT NULL AND pool_features <> '')", params: [], searchParams: { hasPool: true } }
    case 'homes-under-500k':
      return { sql: 'AND list_price <= $EXTRA1', params: [500000], searchParams: { maxPrice: 500000 } }
    case 'homes-over-1m':
      return { sql: 'AND list_price >= $EXTRA1', params: [1000000], searchParams: { minPrice: 1000000 } }
    case 'luxury-homes':
      return { sql: 'AND list_price >= $EXTRA1', params: [1000000], searchParams: { minPrice: 1000000 } }
    case 'condos-for-sale':
      return { sql: "AND LOWER(property_type) LIKE LOWER('%condo%')", params: [], searchParams: { propertyType: 'condo' } }
  case '2-bedroom-apartments':
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

// Temporary location metadata derivation (California-only launch).
// Later: integrate real county / region / nearby city intelligence.
function deriveLocationMeta(city: string): { county: string; region: string; nearby: string[] } {
  // Placeholder: treat region as 'California'; leave county blank until data source available.
  return { county: '', region: 'California', nearby: [] }
}

// Cache whether days_on_market column exists to build safe aggregate query
let hasDaysOnMarketColumn: boolean | null = null
async function ensureSchemaIntrospection() {
  if (hasDaysOnMarketColumn !== null) return
  try {
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
  // Avoid heavy DB queries during Next.js build/static export.
  // If build is detected, return empty stats quickly.
  const argv = Array.isArray(process.argv) ? process.argv.join(' ') : ''
  const likelyNextBuild = argv.includes('next') && argv.includes('build')
  if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' || process.env.VERCEL === '1' || process.env.NEXT_BUILD === '1' || process.env.npm_lifecycle_event === 'build' || process.env.NPM_LIFECYCLE_EVENT === 'build' || likelyNextBuild) {
    if (process.env.LANDING_TRACE) console.log('[landing.stats] skipping DB stats due to build-detection', { cityOrState, kind })
    return {}
  }
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
    WHERE status = 'Active' AND (hidden IS NULL OR hidden = false)
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

export async function getFeaturedProperties(cityOrState: string, kind: LandingKind, limit = 12, extraFilters?: Record<string, any>): Promise<LandingPropertyCard[]> {
  const kindFilter = buildKindFilter(kind)
  const stateInfo = detectStateToken(cityOrState)
  // Short-circuit during build/static export
  const argv = Array.isArray(process.argv) ? process.argv.join(' ') : ''
  const likelyNextBuild = argv.includes('next') && argv.includes('build')
  if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' || process.env.VERCEL === '1' || process.env.NEXT_BUILD === '1' || process.env.npm_lifecycle_event === 'build' || process.env.NPM_LIFECYCLE_EVENT === 'build' || likelyNextBuild) {
    if (process.env.LANDING_TRACE) console.log('[landing.featured] skipping properties fetch due to build-detection', { cityOrState, kind })
    return []
  }
  try {
    const baseParams: any = {
      limit,
      sort: 'updated',
      ...kindFilter.searchParams
    }
  // Merge any additional filters (e.g., from LandingDef presets already mapped to searchProperties schema)
  if (extraFilters) Object.assign(baseParams, extraFilters)
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
export async function getLandingData(cityOrState: string, kind: LandingKind, opts?: { landingDef?: LandingDef }): Promise<LandingData> {
  const landingDef = opts?.landingDef
  // Derive additional filters from config (must be mapped to searchProperties accepted params)
  let extraFilters: Record<string, any> | undefined
  if (landingDef) {
    try {
      const preset = landingDef.filters(cityOrState)
      // Map generic filters to backend param names (basic mapping kept inline for now)
      const mapped: Record<string, any> = {}
      if (preset.city) mapped.city = preset.city
      if ((preset as any).status) mapped.status = (preset as any).status
      if ((preset as any).propertyType) {
        const pt = (preset as any).propertyType
        mapped.propertyType = Array.isArray(pt) ? pt[0] : pt
      }
      if ((preset as any).hasPool) mapped.hasPool = true
      if ((preset as any).priceRange) {
        const [min, max] = (preset as any).priceRange
        if (min != null) mapped.minPrice = min
        if (max != null && max !== Number.MAX_SAFE_INTEGER) mapped.maxPrice = max
      }
      if ((preset as any).beds) {
        const bedsVal = (preset as any).beds
        if (typeof bedsVal === 'string' && bedsVal.endsWith('+')) mapped.minBedrooms = Number(bedsVal.replace(/\+/,'') || '0')
        else mapped.bedrooms = bedsVal
      }
      extraFilters = mapped
    } catch (e) {
      console.warn('[landingData] preset filter mapping failed', e)
    }
  }

  // AI description selection override via landingDef.aiPromptKey
  let aiDescriptionPromise: Promise<string | undefined>
  if (landingDef) {
    const promptFn = LANDING_PROMPTS[landingDef.aiPromptKey]
    if (promptFn) {
      const cityTitleCase = cityOrState.replace(/\b\w/g, c => c.toUpperCase())
      const { county, region, nearby } = deriveLocationMeta(cityTitleCase)
      const generatedPrompt = promptFn(cityTitleCase, county, region, nearby)
      if (process.env.LANDING_TRACE) {
        console.log('[landing.ai.prompt.preview]', generatedPrompt.slice(0, 140) + '...')
      }
      aiDescriptionPromise = getAIDescription(cityOrState, kind, { customPrompt: generatedPrompt, promptKey: landingDef.aiPromptKey })
    } else {
      aiDescriptionPromise = getAIDescription(cityOrState, kind).catch((e) => { console.warn('AI description failed', e); return undefined })
    }
  } else {
    aiDescriptionPromise = getAIDescription(cityOrState, kind).catch((e) => { console.warn('AI description failed', e); return undefined })
  }

  // Robust fetching: avoid whole-page failures if one source times out.
  const disableFeatured = process.env.DISABLE_LANDING_FEATURED === '1'
  const statsP = getLandingStats(cityOrState, kind).catch((e) => { console.warn('landing.stats failed', e); return {} as LandingStats })
  const featuredP = (disableFeatured
    ? Promise.resolve([])
    : getFeaturedProperties(cityOrState, kind, 12, extraFilters)
  ).catch((e) => { console.warn('landing.featured failed', e); return [] as LandingPropertyCard[] })
  const [stats, featured, aiDescriptionHtml] = await Promise.all([
    statsP,
    featuredP,
    aiDescriptionPromise
  ])

  // Basic placeholder / TODO sections (external data integrations later)
  const neighborhoods: NonNullable<LandingData['neighborhoods']> = [] // TODO integrate neighborhoods API
  const schools: NonNullable<LandingData['schools']> = [] // TODO integrate schools API
  const trends: NonNullable<LandingData['trends']> = [] // TODO market trends source
  // FAQ switching by landingDef.faqKey (placeholder logic)
  const buildDefaultFaq = (): NonNullable<LandingData['faq']> => ([
    { q: 'How competitive is the market?', a: 'Market competitiveness data integration pending. Currently derived from active inventory levels.' },
    { q: 'What is the average days on market?', a: stats.daysOnMarket ? `${stats.daysOnMarket} days (rolling average).` : 'Days on market data loading.' }
  ])
  let faq: NonNullable<LandingData['faq']>
  switch (landingDef?.faqKey) {
    case 'faq_condos_for_sale':
      faq = [
        { q: 'What HOA fees should I expect?', a: 'Typical condo HOA fees vary by building amenities; detailed integration coming soon.' },
        { q: 'Are there newer vs older buildings differences?', a: 'Newer builds often feature modern amenities and energy efficiency; older buildings may have larger floor plans.' }
      ]
      break
    case 'faq_homes_with_pool':
      faq = [
        { q: 'How much does pool maintenance cost?', a: 'Monthly professional service can range widely; integration of cost estimates forthcoming.' },
        { q: 'Do pool homes sell faster?', a: 'Seasonally dependent; days on market data will refine this answer soon.' }
      ]
      break
    case 'faq_luxury_homes':
      faq = [
        { q: 'What defines a luxury home locally?', a: 'Generally $1M+ price points with premium finishes, views, or prestige neighborhoods.' },
        { q: 'Are luxury inventories tight?', a: 'Inventory dynamics vary; deeper luxury market analytics planned.' }
      ]
      break
    case 'faq_homes_under_500k':
      faq = [
        { q: 'Is under $500k realistic here?', a: 'Entry-level inventory is competitive; expect tradeoffs in size, age, or location.' },
        { q: 'Can I use FHA or VA loans?', a: 'Yes—financing scenario guidance coming soon.' }
      ]
      break
    case 'faq_homes_over_1m':
      faq = [
        { q: 'What features are common over $1M?', a: 'Often larger lots, upgraded kitchens, outdoor living, or prime locations.' },
        { q: 'Do high-end homes take longer to sell?', a: 'Absorption varies; enhanced metrics are on the roadmap.' }
      ]
      break
    case 'faq_2_bed_apartments':
      faq = [
        { q: 'Are 2-bedroom units good for investment?', a: 'They can balance rentability and cost; rental yield data pending.' },
        { q: 'Do most include parking?', a: 'Varies by building age and location; amenity data integration forthcoming.' }
      ]
      break
    default:
      faq = buildDefaultFaq()
  }
  const related: NonNullable<LandingData['related']> = [
    { label: `${titleCase(cityOrState)} Condos`, href: `/${cityOrState}/condos-for-sale` },
    { label: `${titleCase(cityOrState)} Homes with Pool`, href: `/${cityOrState}/homes-with-pool` },
    { label: 'Under 500K', href: `/${cityOrState}/homes-under-500k` }
  ]

  const seoTitleBase = kind.replace(/-/g, ' ')
  const seo: LandingData['seo'] = landingDef ? {
    title: landingDef.title(cityOrState),
    description: landingDef.description(cityOrState),
    canonical: landingDef.canonicalPath(cityOrState.toLowerCase().replace(/\s+/g,'-'))
  } : {
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
  const { rows } = await pool.query(
    `SELECT LOWER(city) AS city, COUNT(*)::int AS count FROM properties WHERE status='Active' AND city IS NOT NULL GROUP BY 1 ORDER BY count DESC LIMIT $1`,
    [limit]
  )
  return rows
}
