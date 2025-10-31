import { getOpenAI } from '@/lib/singletons'
import { getSupabase } from '@/lib/supabase'
import { pool } from '@/lib/db/connection'
import { LANDING_PROMPTS } from '@/lib/ai/prompts/landings'

export type FAQItem = { question: string; answer: string }
type RichFAQItem = { q: string; longAnswer: string; shortAnswer?: string }
export type SEOMeta = { title?: string; description?: string; keywords?: string[]; jsonLd?: any }

// Lazily create an OpenAI client only when needed to avoid build-time env requirements

async function fetchCitySqlContext(city: string): Promise<string> {
  try {
    const base = await pool.query(
      `SELECT COUNT(*)::int AS total_active,
              ROUND(AVG(list_price))::int AS avg_price,
              ROUND(AVG(list_price / NULLIF(living_area,0)))::int AS price_per_sqft,
              ROUND(AVG(GREATEST(1, EXTRACT(DAY FROM (NOW() - first_seen_ts)))))::int AS avg_days_on_market,
              MIN(list_price)::int AS min_price,
              MAX(list_price)::int AS max_price
         FROM properties
        WHERE status='Active' AND (hidden IS NULL OR hidden = false) AND LOWER(city)=LOWER($1)`,
      [city]
    )
    const types = await pool.query(
      `SELECT LOWER(COALESCE(property_type,'unknown')) AS type, COUNT(*)::int AS count
         FROM properties
        WHERE status='Active' AND (hidden IS NULL OR hidden = false) AND LOWER(city)=LOWER($1)
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
  // Detect build/static-export and skip heavy DB/OpenAI work during npm build/next build
  const argv = Array.isArray(process.argv) ? process.argv.join(' ') : ''
  const likelyNextBuild = argv.includes('next') && argv.includes('build')
  if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' || process.env.VERCEL === '1' || process.env.NEXT_BUILD === '1' || process.env.npm_lifecycle_event === 'build' || process.env.NPM_LIFECYCLE_EVENT === 'build' || likelyNextBuild) {
    if (process.env.LANDING_TRACE) console.log('[faqs] skipping FAQ generation due to build-detection')
    return null
  }

  const sb = getSupabase()
  if (!sb) return null
  const pageName = slug
  const loweredCity = city.toLowerCase()
  // 1) Read existing
  const { data, error } = await sb
    .from('landing_pages')
    .select('faqs, seo_metadata')
    .eq('city', loweredCity)
    .eq('page_name', pageName)
    .maybeSingle()
  if (!error && data?.faqs) {
    const existing = (data.faqs as FAQItem[]) || []
    if (existing.length >= 10) {
      return {
        faqs: existing,
        markdown: buildMarkdownFromFaqs(existing),
        jsonLd: buildFAQJsonLd(loweredCity, pageName, existing),
        meta: data.seo_metadata as SEOMeta | undefined
      }
    }
    // else fall through to regenerate to reach 10
  }
  // 2) Generate via OpenAI using shared FAQ template + SQL context
  if (!process.env.OPENAI_API_KEY) return { faqs: [], markdown: '', jsonLd: {} }
  const sqlContext = await fetchCitySqlContext(city)
  const generationPrompt = buildFaqGenerationPrompt(city, slug, sqlContext)
  // Use the OpenAI client to create a chat completion. Keep messages as valid single-line strings
  // to avoid TypeScript parsing issues from embedded newlines in template literals.
  const client = getOpenAI()
  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL || 'gpt-5-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an expert real estate SEO writer. Follow the user instructions precisely and return only valid JSON.' },
      { role: 'user', content: generationPrompt }
    ],
    temperature: 1
  })
  let parsed: any
  try {
    parsed = JSON.parse(res.choices[0]?.message?.content || '{}')
  } catch {
    parsed = {}
  }
  const markdown: string = parsed.markdown || ''
  const jsonLd: any = parsed.jsonLd || {}
  const meta: SEOMeta | undefined = parsed.meta || undefined
  let faqs: FAQItem[] = []
  const richFaqs: RichFAQItem[] = Array.isArray(parsed.faqs) ? parsed.faqs : []
  const addUnique = (list: FAQItem[]) => {
    for (const item of list) {
      if (!item.question || !item.answer) continue
      if (!faqs.find(f => f.question.toLowerCase() === item.question.toLowerCase())) {
        faqs.push(item)
        if (faqs.length >= 10) break
      }
    }
  }
  if (richFaqs.length) {
    addUnique(richFaqs.map((r: RichFAQItem) => ({ question: String(r.q || '').trim(), answer: String(r.longAnswer || '').trim() })))
  }
  if (faqs.length < 10 && jsonLd && Array.isArray(jsonLd.mainEntity)) {
    addUnique((jsonLd.mainEntity as any[])
      .map(e => ({ question: String(e?.name || '').trim(), answer: String(e?.acceptedAnswer?.text || '').trim() }))
      .filter((f: any) => f.question && f.answer))
  }
  if (faqs.length < 10) {
    addUnique(extractFaqsFromMarkdown(markdown))
  }
  // Trim to exactly 10 if overfilled
  if (faqs.length > 10) faqs = faqs.slice(0, 10)

  // 3) Persist
  await sb.from('landing_pages').upsert({
    city: loweredCity,
    page_name: pageName,
    kind: pageName,
    faqs: faqs as any,
    seo_metadata: meta as any,
    updated_at: new Date().toISOString()
  }, { onConflict: 'city,page_name' })

  // If JSON-LD missing or incomplete, build from short answers when available, otherwise from the chosen FAQs
  const finalJsonLd = (jsonLd && Array.isArray(jsonLd.mainEntity) && jsonLd.mainEntity.length >= 10)
    ? jsonLd
    : buildFAQJsonLd(loweredCity, pageName, faqs, richFaqs)

  return { faqs, markdown: markdown || buildMarkdownFromFaqs(faqs), jsonLd: finalJsonLd, meta }
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