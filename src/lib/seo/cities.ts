// Central California city slugs for initial SEO launch
// Idempotent: safe to re-run without duplication.
export const CA_CITIES = [
  // 'escondido',
  // 'san-diego',
  // 'los-angeles',
  'san-jose',
  'san-francisco',
  // 'fresno',
  // 'oakland',
  // 'irvine',
  // 'riverside',
  // 'sacramento',
  // 'bakersfield',
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
