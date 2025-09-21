import { randomBytes } from 'crypto'
export function generateCode(prefix = 'CCH') {
  const n = randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${n}`
}
