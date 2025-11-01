// src/lib/discovery/google-trends.ts
import * as googleTrends from 'google-trends-api'
import { getOpenAI } from '../singletons'

// Lazily acquire OpenAI client when enriching topics

export type TrendTopic = {
  title: string        // raw query
  url?: string
  traffic?: string
  published_at?: string
  source?: string
  blog_topic?: string  // enriched blog-ready idea
}

export async function fetchRealEstateTrends(): Promise<TrendTopic[]> {
  const topics: TrendTopic[] = []

  const parseJSON = (raw: unknown): any | null => {
    try {
      if (typeof raw === 'string' && raw.trim().startsWith('<')) return null
      return JSON.parse(raw as string)
    } catch { return null }
  }

  // Fetch related queries about real estate
  try {
    const raw = await (googleTrends as any).relatedQueries({
      keyword: 'real estate',
      geo: 'US',
      timeframe: 'now 7-d'
    })
    const data = parseJSON(raw)
    const queries: any[] = data?.default?.rankedList?.[0]?.rankedKeyword || []

    for (const q of queries.slice(0, 10)) {
      const title = q?.query || ''
      if (!title) continue
      topics.push({
        title,
        url: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
        traffic: q?.formattedValue,
        published_at: new Date().toISOString(),
        source: 'google_trends'
      })
    }
  } catch (e) {
    console.warn('[google-trends] failed:', e)
  }

  // Enrich topics into descriptive blog-ready titles
  if (topics.length > 0) {
    try {
      const prompt = `You are an SEO content strategist.
Return ONLY the rewritten blog post headlines, one per line, with no numbering, no quotes, and no extra commentary.
Rewrite each of these Google Trends queries into a compelling blog-ready title:
${topics.map(t => `- ${t.title}`).join('\n')}
`;

  const client = getOpenAI()
  const res = await client.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1
      })

      const content = res.choices?.[0]?.message?.content || ''

      // Robust line cleaning: remove preface, numbering, bullets, and quotes
      const rawLines = content.split('\n').map(l => l.trim()).filter(Boolean)
      const cleaned: string[] = []
      for (let line of rawLines) {
        const lower = line.toLowerCase()
        // Skip common prefaces or section labels
        if (lower.startsWith('sure!') || lower.startsWith('here are') || lower.startsWith('queries:') || lower.startsWith('example:')) continue
        // Remove Markdown bullets or numbering
        line = line.replace(/^\s*\d+\.[)\s]*\s*/,'')
                   .replace(/^\s*[-*]\s*/,'')
                   .replace(/^"|"$/g,'')
                   .trim()
        if (!line) continue
        cleaned.push(line)
      }

      // Assign cleaned titles in order; fallback if not enough
      topics.forEach((t, i) => {
        const title = cleaned[i]
        t.blog_topic = title && title.length > 3 ? title : `Trending: ${t.title}`
      })
    } catch (e) {
      console.warn('[google-trends] enrichment failed:', e)
    }
  }

  return topics
}
