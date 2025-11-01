import type { SearchFilters } from "./search/parse"

export function buildQdrantFilter(f: SearchFilters): any | undefined {
  const must: any[] = []

  if (f.city) {
    const cn = f.city.trim().toLowerCase()
    const cityAny = Array.from(new Set([
      cn,
      capitalizeWords(cn),
      f.city.trim()
    ]))
    // Prefer normalized field when available
    must.push({ key: "city_norm", match: { any: [cn] } })
    // Fallback to raw city variants
    must.push({ key: "city", match: { any: cityAny } })
  }

  if (typeof f.maxPrice === "number") must.push({ key: "list_price", range: { lte: f.maxPrice } })
  if (typeof f.minPrice === "number") must.push({ key: "list_price", range: { gte: f.minPrice } })
  if (typeof f.beds === "number")     must.push({ key: "bedrooms", range: { gte: f.beds } })
  if (typeof f.baths === "number")    must.push({ key: "bathrooms_total", range: { gte: f.baths } })

  if (f.hasPool) {
    // Safe boolean; avoid full-text operators
    must.push({ key: "has_pool", match: { value: true } })
    // Optional: if payload stores features array, uncomment next line
    // must.push({ key: "features", match: { any: ["pool", "Pool"] } })
  }

  return must.length ? { must } as any : undefined
}

function capitalizeWords(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}
