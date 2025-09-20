// src/lib/discovery/google-trends.ts
import { XMLParser } from 'fast-xml-parser'

export type TrendTopic = {
  title: string
  url?: string
  traffic?: string
  published_at?: string
}

const RSS_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US'

/** Fetch and parse Google Trends daily US RSS, filter for real estate topics. */
export async function fetchRealEstateTrends(): Promise<TrendTopic[]> {
  try {
    const res = await fetch(RSS_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Bad response ${res.status}`)
    const xml = await res.text()
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })
    const parsed = parser.parse(xml)
    const items = parsed?.rss?.channel?.item || []
    const keywords = /(real estate|housing|homes?|mortgage|property|rent|zillow|realtor|home price|interest rate)/i
    const topics: TrendTopic[] = []
    for (const it of items) {
      const title: string = it?.title || ''
      const link: string | undefined = it?.link
      const pubDate: string | undefined = it?.pubDate
      // traffic can live under "ht:approx_traffic"
      const traffic: string | undefined = it?.['ht:approx_traffic'] || it?.approx_traffic
      if (!title) continue
      if (!keywords.test(title)) continue
      topics.push({ title, url: link, traffic, published_at: pubDate })
      if (topics.length >= 10) break
    }
    return topics
  } catch (e) {
    console.warn('[google-trends] failed', e)
    return []
  }
}
