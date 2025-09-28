export function useABVariant() {
  if (typeof document === 'undefined') return 'A'
  const m = document.cookie.match(/(?:^|;)\s*ab_variant=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : 'A'
}

// Server/client-safe helper. In RSCs there is no document; default to 'A'.
export function getBucket(): 'A' | 'B' {
  if (typeof document !== 'undefined') {
    const m = document.cookie.match(/(?:^|;)\s*ab_variant=([^;]+)/)
    const v = m ? decodeURIComponent(m[1]) : 'A'
    return v === 'B' ? 'B' : 'A'
  }
  return 'A'
}
// Keep server APIs separate if needed; this module avoids server-only imports.
