/**
 * Smoke: security checks (retarget / double / expiry) via dynamic import of src modules.
 * Needs a Web Crypto polyfill in Node — uses globalThis.crypto (Node 20+).
 * Run: node scripts/smoke-security.mjs
 */

import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) globalThis.crypto = webcrypto

const { runSecurityCase, SECURITY_CASES } = await import('../src/lib/securityChecks.js')

let failed = 0
for (const c of SECURITY_CASES) {
  const r = await runSecurityCase(c.id)
  if (!r.pass) {
    console.error('FAIL', c.id, r.detail)
    failed += 1
  } else {
    console.log('ok  ', c.id, '—', r.detail)
  }
}

if (failed) {
  console.error(`\n${failed} failed`)
  process.exit(1)
}
console.log(`\n${SECURITY_CASES.length} security cases passed`)
