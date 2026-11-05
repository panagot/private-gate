/**
 * Smoke: no compromised / dangerous install URLs in source + docs.
 * Run: node scripts/smoke-links.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const BAD = ['pallad.co', 'https://pallad.co']
const SKIP = new Set(['node_modules', 'dist', '.git'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(js|jsx|mjs|md|html|json|css)$/.test(name)) out.push(p)
  }
  return out
}

const files = walk(root)
let failed = 0
for (const f of files) {
  // Allow documenting the compromise in comments/docs — but never as an href install target.
  const text = readFileSync(f, 'utf8')
  const hrefHits = [...text.matchAll(/href=["']https?:\/\/pallad\.co[^"']*["']/gi)]
  const installHits = [...text.matchAll(/url:\s*['"]https?:\/\/pallad\.co[^'"]*['"]/gi)]
  const mdHits = [...text.matchAll(/\[[^\]]*\]\(https?:\/\/pallad\.co[^)]*\)/gi)]
  if (hrefHits.length || installHits.length || mdHits.length) {
    console.error('FAIL clickable link to pallad.co in', f)
    failed += 1
  }
}

// Positive: Auro present in wallet installs
const wallet = readFileSync(join(root, 'src/lib/wallet.js'), 'utf8')
if (!wallet.includes('aurowallet.com')) {
  console.error('FAIL missing Auro install URL')
  failed += 1
} else {
  console.log('ok   Auro install URL present')
}

if (failed) {
  console.error(`\n${failed} failed`)
  process.exit(1)
}
console.log(`ok   scanned ${files.length} files — no pallad.co install/href`)
console.log(`\nlink smoke passed (bad patterns checked: ${BAD.join(', ')})`)
