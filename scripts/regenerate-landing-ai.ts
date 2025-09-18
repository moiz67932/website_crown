import { getSupabase } from '../src/lib/supabase'

async function callOpenAI(prompt: string): Promise<string> {
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 25000))
  try {
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
    if (!resp.ok) {
      const text = await resp.text().catch(() => '<no-body>')
      throw new Error(`OpenAI ${resp.status}: ${text.slice(0,200)}`)
    }
    const json = await resp.json()
    return json.choices?.[0]?.message?.content?.trim() || ''
  } finally {
    clearTimeout(timeout)
  }
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] as string))
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set. Aborting.')
    process.exit(1)
  }
  const sb = getSupabase()
  if (!sb) {
    console.error('Supabase client not configured (missing env). Aborting.')
    process.exit(1)
  }

  console.log('[regen] querying landing_pages for missing/placeholder ai descriptions')
  const { data: rows, error } = await sb
    .from('landing_pages')
    .select('city,page_name,ai_description_html')
    .or("ai_description_html.is.null,ai_description_html.ilike.%25<!--placeholder-->%25")
    .limit(500)

  if (error) {
    console.error('[regen] supabase select error', error.message)
    process.exit(1)
  }
  const targets = (rows || []) as Array<{ city: string; page_name: string; ai_description_html: string | null }>
  if (!targets.length) {
    console.log('[regen] no targets found. Exiting.')
    return
  }
  console.log(`[regen] found ${targets.length} targets (will regenerate)`)

  for (const t of targets) {
    const city = t.city
    const kind = t.page_name
    const prompt = `You are a real estate SEO assistant. Write a 2–3 paragraph description of ${city} ${kind.replace(/-/g,' ')}, highlighting lifestyle, housing trends, and buyer appeal. Keep it factual, local, and professional.`
    console.log(`[regen] generating for ${city} - ${kind}`)

    let html: string | null = null
    const maxAttempts = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const content = await callOpenAI(prompt)
        if (!content) throw new Error('empty response')
        html = content
        break
      } catch (e: any) {
        console.warn(`[regen] attempt ${attempt} failed for ${city}/${kind}:`, e.message || e)
        if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 500 * attempt))
      }
    }

    if (!html) {
      console.warn(`[regen] all attempts failed for ${city}/${kind} — leaving placeholder or null`)
      // Optionally skip upsert to avoid overwriting valid content; here we upsert placeholder to indicate generation pending
      html = `<p><!--placeholder-->An AI overview for <strong>${escapeHtml(city)}</strong> ${escapeHtml(kind.replace(/-/g,' '))} is generating. Please refresh shortly.</p>`
    }

    try {
      const { error: upsertErr } = await sb
        .from('landing_pages')
        .upsert({ city: city.toLowerCase(), page_name: kind, ai_description_html: html, updated_at: new Date().toISOString() }, { onConflict: 'city,page_name' })
      if (upsertErr) console.error('[regen] supabase upsert failed', upsertErr.message)
      else console.log(`[regen] upsert ok for ${city}/${kind}`)
    } catch (e) {
      console.error('[regen] supabase upsert exception', e)
    }

    // brief delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 400))
  }
  console.log('[regen] done')
}

main().catch(e => { console.error(e); process.exit(1) })
