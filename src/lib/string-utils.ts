export function interpolate(template: string, vars: Record<string, any>) {
  if (!template) return ''
  // Simple ${var} replacement; also support ${nearbyCities} where array -> join
  return template.replace(/\$\{([^}]+)\}/g, (_m, key) => {
    const val = vars[key.trim()]
    if (val === undefined || val === null) return ''
    if (Array.isArray(val)) return val.join(', ')
    return String(val)
  })
}

export default interpolate
