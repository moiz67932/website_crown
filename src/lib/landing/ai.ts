import { getPgPool } from '@/lib/db'
import type { LandingKind } from '@/types/landing'
import { getSupabase } from '@/lib/supabase'
import OpenAI from 'openai'

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

  // Detect build environments and skip OpenAI generation during static export/build.
  const argv = Array.isArray(process.argv) ? process.argv.join(' ') : ''
  const likelyNextBuild = argv.includes('next') && argv.includes('build')
  if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' || process.env.VERCEL === '1' || process.env.NEXT_BUILD === '1' || process.env.npm_lifecycle_event === 'build' || process.env.NPM_LIFECYCLE_EVENT === 'build' || likelyNextBuild) {
    if (trace || debug) console.warn('[ai.desc] skipping OpenAI generation due to build-detection or skip-flag', { key, hasKey: !!process.env.OPENAI_API_KEY })
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
    // During static builds the AI generation can be slow or hit rate limits.
    // Allow builds to skip external OpenAI work by setting
    // SKIP_LANDING_EXTERNAL_FETCHES=1. If OPENAI key is missing we also skip.
    if (process.env.SKIP_LANDING_EXTERNAL_FETCHES === '1' || process.env.VERCEL === '1' || !process.env.OPENAI_API_KEY) {
      if (trace || debug) console.warn('[ai.desc] skipping OpenAI generation (SKIP_LANDING_EXTERNAL_FETCHES|VERCEL or missing OPENAI_API_KEY)', { city: loweredCity, kind, hasKey: !!process.env.OPENAI_API_KEY, isVercel: !!process.env.VERCEL })
      return undefined
    }
  const prompt = opts.customPrompt || `You are a real estate SEO assistant. Write a 2–3 paragraph description of ${city} ${kind.replace(/-/g,' ')}, highlighting lifestyle, housing trends, and buyer appeal. Keep it factual, local, and professional.`
  if (trace) console.log('[ai.desc] calling OpenAI', { key, model: process.env.OPENAI_MODEL || 'gpt-4o-mini', usedCustomPrompt: !!opts.customPrompt, promptPreview: prompt.slice(0, 120) })
    let html: string | undefined
    try {
      html = await callOpenAI(prompt)
      // Explicit log of content preview for debugging
      console.log('[ai.desc] openai content', { key, length: html?.length || 0, preview: (html || '').slice(0, 160) })
    } catch (e: any) {
      console.warn('[ai.desc] OpenAI generation failed', e.message)
      html = undefined
    }
    if (!html || !html.trim()) {
      console.warn('[ai.desc] OpenAI returned empty content; using fallback generator', { key })
      html = buildFallbackDescription(city, kind)
    }
    memCache.set(key, html)
    if (trace) console.log('[ai.desc] generated OpenAI', { key, length: html.length })

    // 4. Persist to Supabase
    try {
      const sb = getSupabase()
      if (sb) {
        if (trace) console.log('[ai.desc] persisting supabase', { key, willPersist: !isPlaceholderHtml(html) })
        const usingService = !!process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!isPlaceholderHtml(html)) {
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
      if (!isPlaceholderHtml(html)) {
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

async function callOpenAI(prompt: string): Promise<string | undefined> {
  const primaryModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const fallbackModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'].filter(m => m !== primaryModel)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 25000))
  try {
    // Prefer official OpenAI SDK for consistent behavior (same as FAQs generator)
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      const maxTokens = Number(process.env.OPENAI_MAX_TOKENS || 3000)
      const tryModel = async (modelName: string) => {
      const started = Date.now()
      const completion = await client.chat.completions.create({
        model: modelName,
        temperature: 1,
          max_completion_tokens: maxTokens,
        messages: [
          { role: 'system', content: 'You are a helpful assistant producing concise HTML paragraphs without a wrapping <body>.' },
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

    // Try primary then fallbacks until we get content
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
      // Common API error includes invalid param "max_tokens" if used; we are sending max_completion_tokens by request of the caller.
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
