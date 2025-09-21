'use client'
export function useABVariant() {
  if (typeof document === 'undefined') return 'A'
  const m = document.cookie.match(/(?:^|;)\s*ab_variant=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : 'A'
}
// Keep server APIs separate if needed; this hook reads the cookie client-side only.
