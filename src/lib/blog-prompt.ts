import { readFileSync } from 'fs'
import { join } from 'path'

let PROMPT_CACHE: string | null = null

export function BLOG_PROMPT_VIA_FILE() {
  if (PROMPT_CACHE) return PROMPT_CACHE
  const p = join(process.cwd(), 'src', 'lib', 'blog', 'prompt-template.txt')
  try {
    PROMPT_CACHE = readFileSync(p, 'utf8')
    return PROMPT_CACHE
  } catch (e) {
    return 'You are a senior real-estate copywriter. (prompt file missing)'
  }
}

export default BLOG_PROMPT_VIA_FILE
