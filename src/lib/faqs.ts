import OpenAI from 'openai'
import { getSupabase } from '@/lib/supabase'
import { getPgPool } from '@/lib/db'
import { isBuildPhase } from '@/lib/env/buildDetection'
import { LANDING_PROMPTS } from '@/lib/ai/prompts/landings'

export type FAQItem = { question: string; answer: string }
type RichFAQItem = { q: string; longAnswer: string; shortAnswer?: string }
export type SEOMeta = { title?: string; description?: string; keywords?: string[]; jsonLd?: any }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ============================================================================
// MIN_FAQS: Guarantee at least 10 FAQs on every landing page
// ============================================================================
export const MIN_FAQS = 10;

/**
 * Fallback FAQs for when cached FAQs are missing or insufficient.
 * These are buyer-focused, generic enough to work for any California city,
 * but include agent mention for E-E-A-T.
 * 
 * CRITICAL: At least one FAQ MUST reference Reza Barghlameno and DRE #02211952
 * This is EXPORTED for use by the rendering layer as a deterministic fallback.
 */
export function getFallbackFAQs(city: string): FAQItem[] {
  const cityTitle = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  return [
    {
      question: `How does Reza Barghlameno (DRE #02211952) help buyers review HOA documents?`,
      answer: `Reza Barghlameno provides comprehensive HOA document review services including analysis of CC&Rs, financial statements, reserve studies, and meeting minutes. This helps buyers understand their obligations, assess the association's financial health, and identify potential special assessments before purchase.`
    },
    {
      question: `What should I know about home inspections in ${cityTitle}?`,
      answer: `A professional home inspection in ${cityTitle} typically costs $400-$600 and examines structural elements, electrical systems, plumbing, roof condition, and HVAC. Consider additional inspections for termites, foundation, and pool if applicable. Inspections provide negotiating leverage and help avoid costly surprises.`
    },
    {
      question: `How long does it take to close on a home in ${cityTitle}?`,
      answer: `The typical closing timeline in ${cityTitle} is 30-45 days from accepted offer to keys. Cash purchases may close faster (14-21 days). Factors affecting timeline include loan approval, appraisal scheduling, title search, and any inspection-related negotiations.`
    },
    {
      question: `What are typical closing costs when buying in ${cityTitle}?`,
      answer: `Buyers in ${cityTitle} should budget 2-3% of purchase price for closing costs, including lender fees, title insurance, escrow fees, recording fees, and prorated property taxes. Some costs are negotiable between buyer and seller.`
    },
    {
      question: `How do I know if a ${cityTitle} home is priced fairly?`,
      answer: `Evaluate fair pricing by reviewing comparable sales (similar homes sold in the last 90 days within 1 mile), price per square foot relative to neighborhood averages, days on market compared to local norms, and any price reductions. Your agent can provide a Comparative Market Analysis (CMA).`
    },
    {
      question: `What mortgage options are available for ${cityTitle} homes?`,
      answer: `Common mortgage options include conventional loans (20% down typical), FHA loans (3.5% down, income limits apply), VA loans (0% down for veterans), and jumbo loans for amounts exceeding conforming limits. Current California conforming loan limits and interest rates vary by lender.`
    },
    {
      question: `What should I look for in ${cityTitle} neighborhood research?`,
      answer: `Key neighborhood factors include school ratings, crime statistics, commute times, walkability scores, planned developments, and property tax rates. Visit at different times of day to assess noise, traffic, and parking. Review HOA rules if applicable.`
    },
    {
      question: `How competitive is the ${cityTitle} real estate market?`,
      answer: `Market competitiveness varies by neighborhood and price point. Check days on market (DOM), list-to-sale price ratios, and active inventory levels. Lower DOM and higher ratios indicate seller-favorable conditions requiring more competitive offers.`
    },
    {
      question: `When is the best time to buy a home in ${cityTitle}?`,
      answer: `While spring traditionally sees more inventory, late fall and winter may offer less competition and more motivated sellers. The best time depends on your personal timeline, interest rates, and local market conditions rather than season alone.`
    },
    {
      question: `What property types are available for purchase in ${cityTitle}?`,
      answer: `${cityTitle} offers single-family homes, condominiums, townhomes, and small multifamily properties (2-4 units). Each type has different ownership structures, HOA considerations, and maintenance responsibilities. Your choice depends on lifestyle, budget, and investment goals.`
    },
    {
      question: `How do property taxes work in California?`,
      answer: `California property taxes run approximately 1.1-1.25% of assessed value annually. Under Proposition 13, assessed value increases are capped at 2% annually until sale, when it resets to market value. Supplemental tax bills may apply after purchase.`
    },
    {
      question: `What questions should I ask before making an offer?`,
      answer: `Key questions include: How long has the property been listed? Have there been price reductions? Are there multiple offers? What's included in the sale? Are there any known issues? What's the seller's timeline? Has the seller disclosed all material facts?`
    },
  ];
}

/**
 * Pad FAQs to meet minimum count using fallback questions.
 * EXPORTED for use in rendering layer to guarantee ≥10 FAQs.
 * This is a DETERMINISTIC operation (no AI calls).
 */
export function padFAQsToMinimum(faqs: FAQItem[], city: string): FAQItem[] {
  if (faqs.length >= MIN_FAQS) {
    return faqs;
  }
  
  const fallbacks = getFallbackFAQs(city);
  const existingQuestions = new Set(faqs.map(f => f.question.toLowerCase().trim()));
  
  // Add fallback FAQs that don't duplicate existing questions
  const result = [...faqs];
  for (const fallback of fallbacks) {
    if (result.length >= MIN_FAQS) break;
    if (!existingQuestions.has(fallback.question.toLowerCase().trim())) {
      result.push(fallback);
      existingQuestions.add(fallback.question.toLowerCase().trim());
    }
  }
  
  return result;
}

/**
 * Ensure FAQs meet the minimum requirement for rendering.
 * This is the PRIMARY function for render-time FAQ guarantee.
 * Converts {q, a} format to {question, answer} format if needed.
 * Returns at least MIN_FAQS items, using fallbacks if necessary.
 * 
 * @param rawFaqs - FAQs from DB in either {q, a} or {question, answer} format
 * @param city - City name for generating fallbacks
 * @returns Array of FAQItem with at least MIN_FAQS items
 */
export function ensureFAQsForRender(
  rawFaqs: Array<{ q?: string; a?: string; question?: string; answer?: string }> | undefined,
  city: string
): FAQItem[] {
  if (!rawFaqs || rawFaqs.length === 0) {
    return getFallbackFAQs(city).slice(0, MIN_FAQS);
  }
  
  // Normalize to {question, answer} format
  const normalized: FAQItem[] = rawFaqs
    .map(f => ({
      question: f.question || f.q || '',
      answer: f.answer || f.a || ''
    }))
    .filter(f => f.question && f.answer);
  
  // Pad to minimum
  return padFAQsToMinimum(normalized, city);
}

async function fetchCitySqlContext(city: string): Promise<string> {
  try {
    const pool = await getPgPool()
    const base = await pool.query(
      `SELECT COUNT(*)::int AS total_active,
              ROUND(AVG(list_price))::int AS avg_price,
              ROUND(AVG(list_price / NULLIF(living_area,0)))::int AS price_per_sqft,
              ROUND(AVG(GREATEST(1, EXTRACT(DAY FROM (NOW() - first_seen_ts)))))::int AS avg_days_on_market,
              MIN(list_price)::int AS min_price,
              MAX(list_price)::int AS max_price
         FROM properties
        WHERE status='Active' AND LOWER(property_type) <> 'land' AND LOWER(city)=LOWER($1)`,
      [city]
    )
    const types = await pool.query(
      `SELECT LOWER(COALESCE(property_type,'unknown')) AS type, COUNT(*)::int AS count
         FROM properties
        WHERE status='Active' AND LOWER(property_type) <> 'land' AND LOWER(city)=LOWER($1)
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 5`,
      [city]
    )
    const b = base.rows[0] || {}
    const typeSummary = (types.rows || []).map((r: any) => `${r.type}:${r.count}`).join(', ')
    const lines = [
      `City=${city}`,
      `ActiveListings=${b.total_active ?? 0}`,
      `AvgPrice=${b.avg_price ?? 'n/a'}`,
      `PricePerSqft=${b.price_per_sqft ?? 'n/a'}`,
      `AvgDaysOnMarket=${b.avg_days_on_market ?? 'n/a'}`,
      `MinPrice=${b.min_price ?? 'n/a'}`,
      `MaxPrice=${b.max_price ?? 'n/a'}`,
      `TopPropertyTypes=${typeSummary || 'n/a'}`
    ]
    return lines.join('\n')
  } catch (e) {
    return `City=${city}\nNote=SQL context not available`
  }
}

function buildFaqGenerationPrompt(city: string, slug: string, sqlContext: string) {
  // Use the shared FAQ template prompt from LANDING_PROMPTS
  const base = LANDING_PROMPTS.ai_city_faqs?.(city, '', 'California', []) || ''
  // Wrap with strict JSON return contract and include DB context for factual grounding
  return `Follow the instructions below to generate FAQs. Then, RETURN ONLY valid JSON (no markdown) with this exact schema:
{
  "faqs": [
    { "q": "...", "longAnswer": "150-250 words", "shortAnswer": "50-80 words" },
    { "q": "...", "longAnswer": "...", "shortAnswer": "..." }
    // Exactly 10 items
  ],
  "markdown": "Full FAQ section with long answers, formatted as markdown headings and paragraphs (Part A)",
  "jsonLd": { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [ {"@type":"Question","name":"Q1","acceptedAnswer":{"@type":"Answer","text":"SHORT ANSWER (50-80 words)"}} ] },
  "meta": { "title": "optional", "description": "optional", "keywords": ["optional", "..."] }
}

City: ${city}
Landing Page Slug: ${slug}

---
INSTRUCTIONS TEMPLATE START
${base}
INSTRUCTIONS TEMPLATE END

---
REAL-TIME SQL CONTEXT (use to keep answers factual & locally grounded; do not invent numbers beyond this):
${sqlContext}

Rules:
- Use SQL context qualitatively; do not fabricate precise stats if missing.
- Ensure exactly 10 FAQs.
- Long answers are used on-page; short answers are used in JSON-LD.
- Keep tone professional, concierge-level, and locally specific to ${city}.`
}

export async function getOrGenerateFaqs(city: string, slug: string): Promise<{ faqs: FAQItem[]; markdown: string; jsonLd: any; meta?: SEOMeta } | null> {
  // ============================================================================
  // AI GENERATION DISABLED FOR RUNTIME
  // ============================================================================
  // FAQs are now fetched from cache ONLY. To generate FAQs, use:
  // - POST /api/admin/landing-pages/generate-content (generates full content including FAQs)
  // - CLI scripts with ALLOW_AI_GENERATION=true
  // ============================================================================
  
  // Skip during build phase
  if (isBuildPhase()) {
    if (process.env.LANDING_TRACE) console.log('[faqs] skipping FAQ fetch due to build phase')
    return null
  }

  const sb = getSupabase()
  if (!sb) return null
  
  const pageName = slug
  const loweredCity = city.toLowerCase()
  
  // Fetch existing FAQs from database - NO GENERATION
  // Use order + limit instead of maybeSingle to handle multiple rows safely
  const { data: rows, error } = await sb
    .from('landing_pages')
    .select('content')
    .ilike('city', loweredCity)  // Case-insensitive match
    .eq('page_name', pageName)
    .order('updated_at', { ascending: false })
    .limit(1)
  
  const data = rows?.[0]
  
  // Check if content has faq array (new format)
  // Content is stored as TEXT (stringified JSON) - must parse it
  let contentJson: any = null
  try {
    if (data?.content) {
      contentJson = typeof data.content === 'string' 
        ? JSON.parse(data.content) 
        : data.content
      console.log('[faqs] Parsed content, keys:', Object.keys(contentJson || {}))
    }
  } catch (e) {
    console.warn('[faqs] Failed to parse content:', (e as any)?.message)
  }
  const existingFaqs = contentJson?.faq || contentJson?.faqs || []
  
  if (!error && existingFaqs.length > 0) {
    // Normalize FAQ format (content.faq uses {q, a} format)
    const normalizedFaqs: FAQItem[] = existingFaqs.map((f: any) => ({
      question: f.question || f.q || '',
      answer: f.answer || f.a || ''
    })).filter((f: FAQItem) => f.question && f.answer)
    
    if (normalizedFaqs.length > 0) {
      // Pad to MIN_FAQS if insufficient (defensive fallback)
      const paddedFaqs = padFAQsToMinimum(normalizedFaqs, city);
      console.log('[faqs] Returning cached FAQs from database:', normalizedFaqs.length, 
        paddedFaqs.length > normalizedFaqs.length ? `(padded to ${paddedFaqs.length})` : '');
      return {
        faqs: paddedFaqs,
        markdown: buildMarkdownFromFaqs(paddedFaqs),
        jsonLd: buildFAQJsonLd(loweredCity, pageName, paddedFaqs),
        meta: contentJson?.seo as SEOMeta | undefined
      }
    }
  }
  
  // No cached FAQs found - return fallback set (do NOT generate)
  console.log('[faqs] No cached FAQs found. Returning fallback FAQs. Generate via admin API for production content.')
  const fallbackFaqs = getFallbackFAQs(city);
  return { 
    faqs: fallbackFaqs, 
    markdown: buildMarkdownFromFaqs(fallbackFaqs), 
    jsonLd: buildFAQJsonLd(loweredCity, pageName, fallbackFaqs) 
  }
}

function extractFaqsFromMarkdown(md: string): FAQItem[] {
  // Very basic parser: look for headings/questions and answers between
  const lines = (md || '').split(/\r?\n/)
  const items: FAQItem[] = []
  let q: string | null = null
  let aParts: string[] = []
  const push = () => { if (q && aParts.length) { items.push({ question: q.trim(), answer: aParts.join('\n').trim() }); q=null; aParts=[] } }
  for (const line of lines) {
    const h = line.match(/^\s*#{1,3}\s+(.*)$/)
    if (h) { push(); q = h[1]; continue }
    if (q) aParts.push(line)
  }
  push()
  // Fallback: if empty, create 0 items (API caller can render nothing)
  return items
}

function buildMarkdownFromFaqs(faqs: FAQItem[]): string {
  return (faqs || []).map(f => `### ${f.question}\n\n${f.answer}`).join('\n\n')
}

function buildFAQJsonLd(city: string, slug: string, faqs: FAQItem[], rich?: RichFAQItem[]) {
  const shortMap = new Map<string, string>()
  if (rich && Array.isArray(rich)) {
    for (const r of rich) {
      const q = String(r.q || '').trim()
      const s = String(r.shortAnswer || '').trim()
      if (q && s) shortMap.set(q, s)
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': (faqs || []).map(f => ({
      '@type': 'Question',
      'name': f.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': shortMap.get(f.question) || f.answer }
    }))
  }
}