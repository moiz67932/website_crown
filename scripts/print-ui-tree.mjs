#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const uiDir = path.join(root, 'src', 'components', 'ui')

function list(dir, prefix = '') {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const e of entries) {
      const full = path.join(dir, e.name)
      console.log(prefix + e.name + (e.isDirectory() ? '/' : ''))
      if (e.isDirectory()) list(full, prefix + '  ')
    }
  } catch (e) {
    console.log(`(failed to list ${dir}: ${e.message})`)
  }
}

function logTsconfig() {
  try {
    const tsconfigPath = path.join(root, 'tsconfig.json')
    const raw = fs.readFileSync(tsconfigPath, 'utf8')
    const ts = JSON.parse(raw)
    const baseUrl = ts?.compilerOptions?.baseUrl
    const paths = ts?.compilerOptions?.paths
    console.log('tsconfig.json compilerOptions.baseUrl =', baseUrl)
    console.log('tsconfig.json compilerOptions.paths =', JSON.stringify(paths))
  } catch (e) {
    console.log('(failed to read tsconfig.json:', e.message, ')')
  }
}

console.log('--- Build env ---')
console.log('platform:', process.platform, 'node:', process.version)
console.log('cwd:', root)
console.log('--- tsconfig ---')
logTsconfig()
console.log('--- src/components/ui tree ---')
list(uiDir)
const expect = ['button.tsx', 'label.tsx', 'alert.tsx']
for (const f of expect) {
  const exists = fs.existsSync(path.join(uiDir, f))
  console.log(`check ${f}:`, exists ? 'OK' : 'MISSING')
}
