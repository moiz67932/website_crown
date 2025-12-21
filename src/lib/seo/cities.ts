// Central California city slugs for initial SEO launch
// Idempotent: safe to re-run without duplication.
export const CA_CITIES = [
  "los-angeles",
  "san-diego",
  "san-jose",
  "san-francisco",
  "irvine",
  "pasadena",
  "santa-monica",
] as const;

export type CACitySlug = typeof CA_CITIES[number];

export function cityToTitle(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9- ]/g, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function slugToCity(slug: string) {
  // Placeholder for future mapping / overrides.
  return cityToTitle(slug);
}
