import { getPgPool } from '@/lib/db'
import type { LandingKind } from '@/types/landing'
import { getSupabase } from '@/lib/supabase'
import OpenAI from 'openai'
import { isBuildPhase } from '@/lib/env/buildDetection'

// Memory cache (runtime only)
const memCache = new Map<string, string>()
// Track in-flight generations to avoid duplicate work (metadata + page render)
const pending = new Map<string, Promise<string | undefined>>()
let attemptedInit = false

async function ensureLegacyTable(pool: any) {
  if (attemptedInit) return
  attemptedInit = true
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS landing_ai_descriptions (
      city text NOT NULL,
      kind text NOT NULL,
      html text NOT NULL,
      generated_at timestamptz DEFAULT now(),
      PRIMARY KEY (city, kind)
    )`)
  } catch {
    // optional
  }
}

interface GetOpts { forceRegenerate?: boolean; customPrompt?: string; promptKey?: string }

function isPlaceholderHtml(html?: string | null): boolean {
  if (!html) return false
  // Detect our known placeholder marker or obvious placeholder phrasing
  const s = String(html)
  return s.includes('<!--placeholder-->') || /is generating\.? please refresh/i.test(s)
}

function buildFallbackDescription(city: string, kind: string): string {
  const niceKind = kind.replace(/-/g, ' ')
  const cityTitle = city.replace(/\b\w/g, c => c.toUpperCase())
  return [
    `<p><strong>${escapeHtml(cityTitle)}</strong> ${escapeHtml(niceKind)} combine lifestyle and value. This curated page highlights active listings, neighborhood feel, and what today’s buyers look for in this market.</p>`,
    `<p>Use the featured homes and filters to explore options that match your budget, desired amenities, and commute. When you’re ready, our team can schedule private tours, provide comps, and guide your offer strategy in ${escapeHtml(cityTitle)}.</p>`
  ].join('\n')
}

// Deterministic long-form fallback that aims for ~1000+ words split into paragraphs.
// Helper: generate a reasonably sized paragraph for a given topic.
function generateParagraphForTopicImpl(cityTitle: string, niceKind: string, topic: string) {
  // Produce a neutral paragraph by composing sentences. Keep it deterministic and non-factual.
  const sentences = [
    `${cityTitle} offers a range of options when it comes to ${niceKind}.`,
    `On ${topic.toLowerCase()}, buyers should consider local nuances and personal priorities.`,
    `Experienced local agents can help prioritize the features that matter most for each buyer.`,
    `When touring properties, focus on layout, natural light, structural condition, and how the home supports your daily routine.`,
    `Neighborhood considerations like walkability, nearby parks, dining, and commute corridors often influence long-term satisfaction.`,
    `Thoughtful searches that balance budget, needs, and market timing tend to produce the best outcomes for buyers in ${cityTitle}.`
  ]
  // Repeat once to ensure decent length without fabricating facts.
  return sentences.join(' ') + ' ' + sentences.join(' ')
}

// Deterministic long-form fallback that aims for ~1000+ words split into paragraphs.
function buildLongFallbackDescription(city: string, kind: string, maxWords = 1000): string {
  const cityTitle = city.replace(/\b\w/g, c => c.toUpperCase())
  const niceKind = kind.replace(/-/g, ' ')
  const sections = [
    `<p><strong>${escapeHtml(cityTitle)} ${escapeHtml(niceKind)}</strong> — Discover the lifestyle, neighborhoods, and housing options that make this area distinct. This introduction summarizes why buyers consider ${escapeHtml(cityTitle)} and what to expect when searching for ${escapeHtml(niceKind)}.</p>`,
  ]

  // Topics to cover; we'll generate paragraphs until we reach maxWords
  const topics = [
    'Neighborhood character and popular areas to consider',
    'Typical housing stock and what different buyers look for',
    'Local amenities, schools, and lifestyle attractions',
    'Market trends and buyer considerations (pricing, competition, seasonality)',
    'What to expect during your home search and tips for touring',
    'Financing considerations and working with local agents',
    'Closing thoughts and a gentle call to action to contact the team'
  ]

  const paras: string[] = []
  paras.push(sections[0])

  // Rough words per paragraph target so we can stop once maxWords reached.
  const approxPerPara = Math.max(120, Math.floor(maxWords / Math.max(3, topics.length + 1)))

  let accumulatedWords = paras.join(' ').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length

  for (const t of topics) {
    if (accumulatedWords >= maxWords) break
    let body = generateParagraphForTopicImpl(cityTitle, niceKind, t)

    // generateParagraphForTopic tends to produce long repeated text; trim to approxPerPara
    const trimmed = body.split(/\s+/).slice(0, approxPerPara).join(' ')
    const paraHtml = `<p>${escapeHtml(trimmed)}</p>`
    paras.push(paraHtml)

    accumulatedWords += trimmed.split(/\s+/).filter(Boolean).length
  }

  // If still under maxWords, append short closing paragraph up to remaining words
  const remaining = maxWords - accumulatedWords
  if (remaining > 20) {
    const closing = Array(Math.min(remaining, 120)).fill(`Working with ${cityTitle} experts helps buyers navigate listings and close confidently.`).join(' ')
    paras.push(`<p>${escapeHtml(closing.split(/\s+/).slice(0, remaining).join(' '))}</p>`)
  }

  return paras.join('\n')
}

// Maintain stable API name used elsewhere
function generateParagraphForTopic(cityTitle: string, niceKind: string, topic: string) {
  return generateParagraphForTopicImpl(cityTitle, niceKind, topic)
}

// Ensure text is wrapped in <p> paragraphs. If already contains <p> tags, return as-is.
function ensureParagraphHtml(raw: string) {
  if (/<p[\s>]/i.test(raw)) return raw
  const parts = String(raw).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  return parts.map(p => `<p>${escapeHtml(p)}</p>`).join('\n')
}

// New helper: truncate HTML by paragraph while preserving tags and closing paragraphs.
function truncateHtmlByParagraphs(html: string, maxWords: number): string {
  if (!html) return html
  // Extract paragraph blocks if present
  const paraRegex = /<p[^>]*>[\s\S]*?<\/p>/gi
  const paras = html.match(paraRegex)
  if (paras && paras.length) {
    const out: string[] = []
    let words = 0
    for (const p of paras) {
      // remove tags to count words
      const inner = p.replace(/<[^>]+>/g, ' ')
      const wcount = inner.split(/\s+/).filter(Boolean).length
      if (words + wcount <= maxWords) {
        out.push(p)
        words += wcount
      } else {
        // need partial paragraph
        const remaining = Math.max(0, maxWords - words)
        if (remaining > 0) {
          // extract plain text, take remaining words, re-wrap
          const text = inner.replace(/\s+/g, ' ').trim().split(/\s+/).slice(0, remaining).join(' ')
          out.push(`<p>${escapeHtml(text)}</p>`)
          words += remaining
        }
        break
      }
    }
    return out.join('\n')
  } else {
    // No paragraphs: fallback to plain-text truncate and wrap in one <p>
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const truncated = plain.split(/\s+/).slice(0, maxWords).join(' ')
    return `<p>${escapeHtml(truncated)}</p>`
  }
}

// Modify callOpenAI to accept maxTokens budget (passed as max_completion_tokens)
async function callOpenAI(prompt: string, maxTokens?: number): Promise<string | undefined> {
  const primaryModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const fallbackModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'].filter(m => m !== primaryModel)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 25000))
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const maxTokensConfigured = Number(process.env.OPENAI_MAX_TOKENS || 3000)
    const maxTokensToUse = typeof maxTokens === 'number' ? Math.min(maxTokensConfigured, Math.max(64, Math.floor(maxTokens))) : maxTokensConfigured

      const tryModel = async (modelName: string) => {
      const started = Date.now()
      const completion = await client.chat.completions.create({
        model: modelName,
        temperature: 1,
        max_completion_tokens: maxTokensToUse,
        messages: [
          { role: 'system', content: 'You are a helpful assistant producing concise HTML paragraphs without a wrapping <body>. Do not exceed the requested maximum word count in the user instruction.' },
          { role: 'user', content: prompt }
        ]
      }, { signal: controller.signal as any })
      const ms = Date.now() - started
      const content = completion.choices?.[0]?.message?.content?.trim()
      if (process.env.LANDING_TRACE) {
        console.log('[ai.desc] openai response', { model: modelName, ms, hasContent: !!content, contentPreview: (content||'').slice(0,80) })
      }
      return content
    }

    let content = await tryModel(primaryModel)
    if (!content) {
      for (const m of fallbackModels) {
        try {
          console.warn('[ai.desc] retrying openai with fallback model', { model: m })
          content = await tryModel(m)
          if (content) break
        } catch (err: any) {
          console.warn('[ai.desc] fallback model failed', { model: m, message: err?.message || String(err) })
        }
      }
    }
    return content
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.warn('[ai.desc] openai aborted timeout', { timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 25000) })
    } else {
      console.warn('[ai.desc] openai error', e?.message || e)
    }
    throw e
  } finally {
    clearTimeout(timeout)
  }
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] as string))
}

export async function getAIDescription(city: string, kind: LandingKind, opts: GetOpts = {}): Promise<string | undefined> {
  const loweredCity = city.toLowerCase()
  const key = `${loweredCity}::${kind}`
  const debug = !!process.env.LANDING_DEBUG
  const trace = !!process.env.LANDING_TRACE

  if (trace) console.log('[ai.desc] START', { city: loweredCity, kind, force: opts.forceRegenerate, envOpenAI: !!process.env.OPENAI_API_KEY, hasCustomPrompt: !!opts.customPrompt, promptKey: opts.promptKey })

  if (pending.has(key)) {
    if (trace) console.log('[ai.desc] pending awaited', key)
    return pending.get(key)!
  }

  // Skip OpenAI generation during build phase only
  // At runtime (even on Vercel), we can generate AI descriptions if needed
  if (isBuildPhase()) {
    if (trace || debug) console.warn('[ai.desc] skipping OpenAI generation due to build phase', { key, hasKey: !!process.env.OPENAI_API_KEY })
    return undefined
  }

  // 1. Supabase lookup (preferred)
  try {
    const sb = getSupabase()
    if (sb) {
      const { data, error } = await sb
        .from('landing_pages')
        .select('ai_description_html')
        .eq('city', loweredCity)
        .eq('page_name', kind)
        .maybeSingle()
      if (error) {
  if (trace) console.warn('[ai.desc] supabase select error', { key, message: error.message, code: error.code })
      } else if (data?.ai_description_html && !opts.forceRegenerate && !process.env.FORCE_AI_REGEN) {
        // If a custom prompt is provided, ensure cached HTML is sufficiently long to satisfy the prompt expectations.
        const minLen = Number(process.env.LANDING_MIN_DESC_LENGTH || 3000)
        const cachedLen = String(data.ai_description_html || '').length
        if (isPlaceholderHtml(data.ai_description_html)) {
          console.warn('[ai.desc] supabase value is placeholder; ignoring and regenerating', { key })
        } else if (opts.customPrompt && cachedLen < minLen) {
          console.warn('[ai.desc] supabase cached html too short for custom prompt; forcing regeneration', { key, cachedLen, minLen })
        } else {
          memCache.set(key, data.ai_description_html)
          if (trace) console.log('[ai.desc] supabase cache hit', key)
          return data.ai_description_html
        }
      } else if (trace) {
        console.log('[ai.desc] supabase miss', { key, hadData: !!data?.ai_description_html })
      }
    } else if (trace) {
      console.log('[ai.desc] no supabase client (missing env)')
    }
  } catch (e: any) {
    console.warn('[ai.desc] supabase lookup failed', e.message)
  }

  // 2. Legacy PG lookup
  if (!opts.forceRegenerate && !process.env.FORCE_AI_REGEN) {
    try {
      const pool = await getPgPool()
      await ensureLegacyTable(pool)
      const { rows } = await pool.query('SELECT html FROM landing_ai_descriptions WHERE city=$1 AND kind=$2', [loweredCity, kind])
      if (rows[0]?.html) {
        const legacyHtml = rows[0].html as string
        if (isPlaceholderHtml(legacyHtml)) {
          console.warn('[ai.desc] legacy pg value is placeholder; will attempt regeneration', { key })
        } else {
          memCache.set(key, legacyHtml)
          if (trace) console.log('[ai.desc] legacy pg hit', key)
          // Best effort: sync to Supabase if possible (skip if placeholder)
          try {
            const sb2 = getSupabase()
            if (sb2) {
              if (trace) console.log('[ai.desc] syncing legacy -> supabase', { key })
              await sb2.from('landing_pages').upsert({
                city: loweredCity,
                page_name: kind,
                kind,
                ai_description_html: legacyHtml,
                updated_at: new Date().toISOString()
              }, { onConflict: 'city,page_name' })
            }
          } catch (e: any) {
            console.warn('[ai.desc] legacy->supabase sync failed', e?.message)
          }
          return legacyHtml
        }
      }
    } catch (e: any) {
      if (!/relation .* does not exist/i.test(e.message || '')) console.warn('[ai.desc] legacy pg lookup error', e.message)
    }
  }

  // 2.5 memCache fallback: if we already have a runtime value, return it but also ensure Supabase is updated
  if (!opts.forceRegenerate && !process.env.FORCE_AI_REGEN && memCache.has(key)) {
    const cached = memCache.get(key)
    const isPh = isPlaceholderHtml(cached)
    if (trace) console.log('[ai.desc] memCache hit (post-lookup)', { key, isPlaceholder: isPh, willSyncSupabase: !isPh })
    if (isPh) {
      console.warn('[ai.desc] cached value is placeholder; proceeding to regenerate', { key })
    } else {
      try {
        const sb3 = getSupabase()
        if (sb3 && cached) {
          await sb3.from('landing_pages').upsert({
            city: loweredCity,
            page_name: kind,
            kind,
            ai_description_html: cached,
            updated_at: new Date().toISOString()
          }, { onConflict: 'city,page_name' })
        }
      } catch (e: any) {
        console.warn('[ai.desc] supabase upsert (from memCache) failed', e?.message)
      }
      return cached
    }
  }

  const executor = async (): Promise<string | undefined> => {
    // 3. Generate (requires OpenAI key)
    // During build phase we skip OpenAI (already handled at top of function)
    // At runtime, we can generate if OpenAI key is available
    // Optionally, users can set SKIP_LANDING_EXTERNAL_FETCHES=1 to disable this at runtime too
    if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' || !process.env.OPENAI_API_KEY) {
      if (trace || debug) console.warn('[ai.desc] skipping OpenAI generation (SKIP_LANDING_EXTERNAL_FETCHES or missing OPENAI_API_KEY)', { city: loweredCity, kind, hasKey: !!process.env.OPENAI_API_KEY })
      return undefined
    }
  const prompt = opts.customPrompt || `You are a real estate SEO assistant. Write a 2–3 paragraph description of ${city} ${kind.replace(/-/g,' ')}, highlighting lifestyle, housing trends, and buyer appeal. Keep it factual, local, and professional.`
  if (trace) console.log('[ai.desc] calling OpenAI', { key, model: process.env.OPENAI_MODEL || 'gpt-4o-mini', usedCustomPrompt: !!opts.customPrompt, promptPreview: prompt.slice(0, 120) })
    let html: string | undefined
    try {
      // compute desired words range (min 800, max 1000) - env overrides allowed
      const envMin = Number(process.env.LANDING_MIN_WORDS || 800)
      const envMax = Number(process.env.LANDING_MAX_WORDS || 1000)
      const desiredMin = Math.max(800, Math.min(envMin, envMax))
      const desiredMax = Math.max(desiredMin, envMax)
  // translate words -> approximate tokens (conservative multiplier) using desiredMax
  const approxTokens = Math.max(300, Math.ceil(desiredMax * 1.6))
  // Ask OpenAI with token budget tuned to desiredMax words
  html = await callOpenAI(prompt, approxTokens)

      // Explicit log of content preview for debugging
      console.log('[ai.desc] openai content', { key, length: html?.length || 0, preview: (html || '').slice(0, 160) })

      // Count words
      const countWords = (s?: string) => {
        if (!s) return 0
        const stripped = String(s).replace(/<[^>]+>/g, ' ')
        return String(stripped).split(/\s+/).filter(Boolean).length
      }
  let words = countWords(html)

      // If model produced more than desiredMax, truncate safely by paragraphs
      if (words > desiredMax) {
        if (process.env.LANDING_TRACE) console.warn('[ai.desc] openai produced more words than max; truncating', { key, produced: words, max: desiredMax })
        html = truncateHtmlByParagraphs(html || '', desiredMax)
        words = countWords(html)
        if (process.env.LANDING_TRACE) console.log('[ai.desc] truncated content words', { key, words })
      }

      // If under desiredWords, retry as before (kept existing retry logic)...
      const maxRetries = 2
      if (words < desiredMin) {
  for (let attempt = 1; attempt <= maxRetries && words < desiredMin; attempt++) {
          try {
            const retryPrompt = (opts.customPrompt || prompt) + `\n\nIMPORTANT: Output at least ${desiredMin} words and at most ${desiredMax} words. Structure the response as multiple paragraphs (use <p>...</p> for each paragraph). Start with an introductory paragraph, then provide several sections covering neighborhood, market trends, buyer appeal, amenities, and a closing CTA. Avoid fabricated numeric facts. Output HTML paragraphs only.`
            if (trace) console.log('[ai.desc] retrying OpenAI for length', { key, attempt, desiredMin, desiredMax })
            const retryHtml = await callOpenAI(retryPrompt, approxTokens)
            if (retryHtml) {
              // if retry overproduces, truncate
              if (countWords(retryHtml) > desiredMax) {
                if (trace) console.warn('[ai.desc] retry produced too many words; truncating retry result', { key, attempt })
                html = truncateHtmlByParagraphs(retryHtml, desiredMax)
              } else {
                html = retryHtml
              }
              words = countWords(html)
              if (trace) console.log('[ai.desc] retry produced more words', { key, attempt, words })
            }
          } catch (e: any) {
            console.warn('[ai.desc] retry attempt failed', { key, attempt, message: e?.message || e })
          }
        }
      }
    } catch (e: any) {
      console.warn('[ai.desc] OpenAI generation failed', e.message)
      html = undefined
    }

    if (!html || !html.trim()) {
      console.warn('[ai.desc] OpenAI returned empty content; using fallback generator', { key })
      // ensure fallback respects desiredWords
      const fallbackWords = Number(process.env.LANDING_MAX_WORDS || process.env.LANDING_MIN_WORDS || 1000)
      html = buildFallbackDescription(city, kind) // short fallback for placeholder
      // replace with long fallback but capped
      html = buildLongFallbackDescription(city, kind, fallbackWords)
    }

    // Ensure paragraphs are wrapped as HTML
    if (html) {
      html = ensureParagraphHtml(html || '')
    }

    // After retries above, enforce long fallback if still too short (but now capped)
    const finalDesiredWords = Number(process.env.LANDING_MAX_WORDS || process.env.LANDING_MIN_WORDS || 1000)
    if ((html && html.length) && (String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length > finalDesiredWords)) {
      // double-safety: if anything still exceeds, truncate
      html = truncateHtmlByParagraphs(html || '', finalDesiredWords)
    }
  // Normalize memCache to always store a string and avoid undefined.
  memCache.set(key, html || '')
  if (trace) console.log('[ai.desc] generated OpenAI', { key, length: html?.length || 0 })

    // 4. Persist to Supabase
    try {
      const sb = getSupabase()
      if (sb) {
        if (trace) console.log('[ai.desc] persisting supabase', { key, willPersist: !isPlaceholderHtml(html) })
        const usingService = !!process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!isPlaceholderHtml(html) && html) {
          const { error } = await sb
            .from('landing_pages')
            .upsert({
              city: loweredCity,
              page_name: kind,
              kind,
              ai_description_html: html,
              updated_at: new Date().toISOString()
            }, { onConflict: 'city,page_name' })
            .select('id')
            .single()
          if (error) {
            console.warn('[ai.desc] supabase upsert failed', { key, msg: error.message, code: error.code, hint: error.hint, serviceRole: usingService })
          } else if (trace) {
            console.log('[ai.desc] supabase upsert ok', key)
          }
        } else {
          console.warn('[ai.desc] skipping supabase persist due to placeholder content', { key })
        }
      }
    } catch (e: any) {
      console.warn('[ai.desc] supabase persist exception', e.message)
    }

    // 5. Legacy PG persistence
    try {
      const pool2 = await getPgPool()
      await ensureLegacyTable(pool2)
      if (!isPlaceholderHtml(html) && html) {
        await pool2.query('INSERT INTO landing_ai_descriptions(city,kind,html) VALUES($1,$2,$3) ON CONFLICT (city,kind) DO UPDATE SET html=EXCLUDED.html, generated_at=now()', [loweredCity, kind, html])
      } else if (trace) {
        console.log('[ai.desc] skipping legacy pg persist due to placeholder', { key })
      }
    } catch (e: any) {
      if (!/relation .* does not exist/i.test(e.message || '')) console.warn('[ai.desc] legacy pg persist failed', e.message)
    }
    return html
  }

  const p = executor().finally(() => pending.delete(key))
  pending.set(key, p)
  return p
}

// The single callOpenAI implementation with optional maxTokens lives earlier in this file.

// escapeHtml already defined above; do not duplicate.
