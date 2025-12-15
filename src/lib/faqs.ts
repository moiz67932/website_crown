import OpenAI from 'openai'
import { getSupabase } from '@/lib/supabase'
import { getPgPool } from '@/lib/db'
import { isBuildPhase } from '@/lib/env/buildDetection'
import { LANDING_PROMPTS } from '@/lib/ai/prompts/landings'

export type FAQItem = { question: string; answer: string }
type RichFAQItem = { q: string; longAnswer: string; shortAnswer?: string }
export type SEOMeta = { title?: string; description?: string; keywords?: string[]; jsonLd?: any }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

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
      console.log('[faqs] Returning cached FAQs from database:', normalizedFaqs.length)
      return {
        faqs: normalizedFaqs,
        markdown: buildMarkdownFromFaqs(normalizedFaqs),
        jsonLd: buildFAQJsonLd(loweredCity, pageName, normalizedFaqs),
        meta: contentJson?.seo as SEOMeta | undefined
      }
    }
  }
  
  // No cached FAQs found - return empty (do NOT generate)
  console.log('[faqs] No cached FAQs found. Generate via admin API.')
  return { faqs: [], markdown: '', jsonLd: {} }
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