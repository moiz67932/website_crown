import { getPgPool } from '@/lib/db'
import type { LandingKind } from '@/types/landing'
import { getSupabase } from '@/lib/supabase'

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

interface GetOpts { forceRegenerate?: boolean }

export async function getAIDescription(city: string, kind: LandingKind, opts: GetOpts = {}): Promise<string | undefined> {
  const loweredCity = city.toLowerCase()
  const key = `${loweredCity}::${kind}`
  const debug = !!process.env.LANDING_DEBUG
  const trace = !!process.env.LANDING_TRACE

  if (trace) console.log('[ai.desc] START', { city: loweredCity, kind, force: opts.forceRegenerate, envOpenAI: !!process.env.OPENAI_API_KEY })

  if (pending.has(key)) {
    if (trace) console.log('[ai.desc] pending awaited', key)
    return pending.get(key)!
  }

  if (!opts.forceRegenerate && !process.env.FORCE_AI_REGEN && memCache.has(key)) {
    if (trace) console.log('[ai.desc] memCache hit', key)
    return memCache.get(key)
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
        memCache.set(key, data.ai_description_html)
        if (trace) console.log('[ai.desc] supabase cache hit', key)
        return data.ai_description_html
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
        memCache.set(key, rows[0].html)
        if (trace) console.log('[ai.desc] legacy pg hit', key)
        return rows[0].html
      }
    } catch (e: any) {
      if (!/relation .* does not exist/i.test(e.message || '')) console.warn('[ai.desc] legacy pg lookup error', e.message)
    }
  }

  const executor = async (): Promise<string | undefined> => {
    // 3. Generate (requires OpenAI key)
    if (!process.env.OPENAI_API_KEY) {
      if (trace || debug) console.warn('[ai.desc] OPENAI_API_KEY missing; skipping generation', { city: loweredCity, kind })
      return undefined
    }
    const prompt = `You are a real estate SEO assistant. Write a 2–3 paragraph description of ${city} ${kind.replace(/-/g,' ')}, highlighting lifestyle, housing trends, and buyer appeal. Keep it factual, local, and professional.`
    if (trace) console.log('[ai.desc] calling OpenAI', { key, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' })
    let html: string | undefined
    try {
      html = await callOpenAI(prompt)
    } catch (e: any) {
      console.warn('[ai.desc] OpenAI generation failed', e.message)
      return undefined
    }
    if (!html) {
      console.warn('[ai.desc] OpenAI returned empty content', { key })
      if (!process.env.FORCE_AI_NO_PLACEHOLDER) {
        html = `<p><!--placeholder-->An AI overview for <strong>${escapeHtml(city)}</strong> ${escapeHtml(kind.replace(/-/g,' '))} is generating. Please refresh shortly.</p>`
        if (trace) console.log('[ai.desc] using placeholder', { key })
      } else {
        if (trace) console.log('[ai.desc] placeholder disabled (FORCE_AI_NO_PLACEHOLDER)')
        return undefined
      }
    }
    memCache.set(key, html)
    if (trace) console.log('[ai.desc] generated OpenAI', { key, length: html.length })

    // 4. Persist to Supabase
    try {
      const sb = getSupabase()
      if (sb) {
        if (trace) console.log('[ai.desc] persisting supabase', { key })
        const usingService = !!process.env.SUPABASE_SERVICE_ROLE_KEY
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
      }
    } catch (e: any) {
      console.warn('[ai.desc] supabase persist exception', e.message)
    }

    // 5. Legacy PG persistence
    try {
      const pool2 = await getPgPool()
      await ensureLegacyTable(pool2)
      await pool2.query('INSERT INTO landing_ai_descriptions(city,kind,html) VALUES($1,$2,$3) ON CONFLICT (city,kind) DO UPDATE SET html=EXCLUDED.html, generated_at=now()', [loweredCity, kind, html])
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
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 25000))
  try {
    const started = Date.now()
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant producing concise HTML paragraphs without a wrapping <body>.' },
          { role: 'user', content: prompt }
        ],
        temperature: 1,
        max_completion_tokens: 550
      })
    })
    const ms = Date.now() - started
    if (!resp.ok) {
      let text: string
      try { text = await resp.text() } catch { text = '<failed-to-read-body>' }
      console.warn('[ai.desc] openai http_error', { status: resp.status, ms, snippet: text.slice(0,300) })
      throw new Error(`OpenAI ${resp.status}: ${text}`)
    }
    const json = await resp.json()
    if (process.env.LANDING_TRACE) {
      const choice = json?.choices?.[0]?.message?.content
      console.log('[ai.desc] openai response', { ms, hasContent: !!choice, contentPreview: (choice||'').slice(0,80) })
    }
    return json.choices?.[0]?.message?.content?.trim()
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.warn('[ai.desc] openai aborted timeout', { timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 25000) })
    }
    throw e
  } finally {
    clearTimeout(timeout)
  }
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] as string))
}
