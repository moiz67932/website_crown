export type SearchFilters = {
  city?: string
  state?: string
  maxPrice?: number
  minPrice?: number
  beds?: number
  baths?: number
  hasPool?: boolean
  page?: number
  pageSize?: number
  raw?: string
}

const CITY_ALIASES: Record<string, string> = {
  la: "los angeles",
  losangeles: "los angeles",
  "los angeles": "los angeles",
  nyc: "new york",
}

export function parseSearchFilters(text: string): SearchFilters {
  const t = (text || "").trim().toLowerCase()
  const filters: SearchFilters = { page: 1, pageSize: 6, raw: text }
  if (!t) return filters

  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (t.includes(alias)) { filters.city = canonical; break }
  }
  const inMatch = t.match(/\bin\s+([a-z\s]+?)(?:\b|$)/)
  if (!filters.city && inMatch) filters.city = inMatch[1].trim()

  // Heuristic: detect common cities even without the "in" preposition
  if (!filters.city) {
    const COMMON_CITIES = [
      'san diego', 'los angeles', 'irvine', 'san francisco', 'san jose',
      'long beach', 'santa monica', 'newport beach', 'laguna beach',
      'orange county', 'riverside', 'ventura', 'san fernando valley'
    ]
    for (const c of COMMON_CITIES) {
      if (t.includes(c)) { filters.city = c; break }
    }
  }

  const under = t.match(/(?:under|below|less than)\s*\$?\s*([\d,.]+)\s*([mk])?/)
  if (under) filters.maxPrice = normalizedNumber(under[1], under[2])

  const dollar = t.match(/\$?\s*([\d,.]+)\s*([mk])\b/)
  if (dollar && !filters.maxPrice) filters.maxPrice = normalizedNumber(dollar[1], dollar[2])

  const beds = t.match(/\b(\d+)\s*bed/); if (beds) filters.beds = parseInt(beds[1], 10)
  const baths = t.match(/\b(\d+)\s*bath/); if (baths) filters.baths = parseInt(baths[1], 10)

  if (/\bpool(s)?\b/.test(t) || /with pool/.test(t)) filters.hasPool = true
  if ((process.env.DEBUG_VECTOR_SEARCH ?? '').toLowerCase() !== '0') {
    console.log('[vector-search] parseSearchFilters:', { text, parsed: filters })
  }
  return filters
}

function normalizedNumber(num: string, suffix?: string): number {
  const n = parseFloat(num.replace(/,/g, ""))
  if (!suffix) return n
  if (suffix.toLowerCase() === "m") return Math.round(n * 1_000_000)
  if (suffix.toLowerCase() === "k") return Math.round(n * 1_000)
  return n
}

export function summarizeFilters(f: SearchFilters): string {
  const parts: string[] = []
  if (f.city) parts.push(capital(f.city!))
  if (f.maxPrice) parts.push(`≤ $${f.maxPrice.toLocaleString()}`)
  if (f.beds) parts.push(`${f.beds}+ beds`)
  if (f.baths) parts.push(`${f.baths}+ baths`)
  if (f.hasPool) parts.push("Pool")
  return parts.length ? parts.join(" • ") : "All properties"
}

function capital(s: string) { return s.replace(/\b\w/g, c => c.toUpperCase()) }
