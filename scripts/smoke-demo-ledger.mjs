/**
 * Smoke: demo ledger create → present → claim → double-claim → expiry → refund.
 * Uses an in-memory localStorage shim.
 * Run: node scripts/smoke-demo-ledger.mjs
 */

import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) globalThis.crypto = webcrypto

const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
}

const store = await import('../src/lib/store.js')
const attest = await import('../src/lib/attestations.js')
const { encodeClaimLink, parseClaimHash, verifyClaimAuth } = await import('../src/lib/crypto.js')

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// Round 1: happy path
store.clearAll()
const drop = store.createDrop({
  title: 'Smoke drop',
  amount: '2',
  ruleId: 'age18',
  expiryHours: 72,
})
assert(drop.id.startsWith('drop_'), 'drop id')
assert(drop.claimSecret && drop.claimSecret.length >= 16, 'claim secret issued')
assert(store.dropStatus(drop) === 'open', 'status open')

store.issueDemoCredential({ age: 21, nationality: 'Greece', email: 'a@mina.local' })
const owner = 'owner_smoke'
const dest = 'B62qSmokeDestinationAddress000000000000000000'
const presentation = await attest.presentForDrop(drop, owner, dest, drop.claimSecret)
assert(presentation.ok, presentation.error || 'present ok')
const claim = await attest.claimWithPresentation(drop, presentation)
assert(claim.nullifier, 'nullifier set')
assert(store.dropStatus(store.getDrop(drop.id)) === 'claimed', 'claimed')

// Round 2: double claim blocked
const again = await attest.presentForDrop(store.getDrop(drop.id), owner, dest, drop.claimSecret)
assert(!again.ok, 'second present should fail')
assert(/already claimed|nullifier/i.test(again.error), `double msg: ${again.error}`)

// Round 2b: missing / wrong secret blocked on a fresh drop
store.clearAll()
const gated = store.createDrop({ title: 'Secret gate', amount: '1', ruleId: 'age18' })
store.issueDemoCredential({ age: 22 })
const noSecret = await attest.presentForDrop(gated, 'o', dest, '')
assert(!noSecret.ok && /secret/i.test(noSecret.error), `missing secret: ${noSecret.error}`)
const badSecret = await attest.presentForDrop(gated, 'o', dest, 'deadbeef')
assert(!badSecret.ok && /secret/i.test(badSecret.error), `wrong secret: ${badSecret.error}`)

// Round 3: destination bind (reuse first presentation shape)
store.clearAll()
const drop2 = store.createDrop({ title: 'Auth', amount: '2', ruleId: 'age18' })
store.issueDemoCredential({ age: 21 })
const p2 = await attest.presentForDrop(drop2, owner, dest, drop2.claimSecret)
assert(p2.ok, p2.error || 'present ok')
const authOk = await verifyClaimAuth(p2.authHex, drop2.id, dest, drop2.amount, p2.nullifierHex)
const authBad = await verifyClaimAuth(p2.authHex, drop2.id, 'B62qAttacker', drop2.amount, p2.nullifierHex)
assert(authOk && !authBad, 'destination-bound auth')

// Round 4: claim link hash carries secret
const link = encodeClaimLink('http://127.0.0.1:5179', { dropId: drop2.id, claimSecret: drop2.claimSecret })
assert(link.includes('#/claim/'), 'hash fragment')
assert(link.includes(`/${drop2.claimSecret}`), 'secret in hash')
assert(!link.includes('?drop='), 'no query secret')
const parsed = parseClaimHash(new URL(link).hash)
assert(parsed?.dropId === drop2.id && parsed?.claimSecret === drop2.claimSecret, 'parse claim hash')

// Round 5: expiry + refund
store.clearAll()
const expired = store.createDrop({ title: 'Expired', amount: '1', ruleId: 'age18', expiryHours: 1 })
const stateRaw = JSON.parse(localStorage.getItem('private-gate:v2'))
stateRaw.drops[0].expiresAt = Date.now() - 1000
localStorage.setItem('private-gate:v2', JSON.stringify(stateRaw))
const ex = store.getDrop(expired.id)
assert(store.dropStatus(ex) === 'expired', 'expired status')
store.issueDemoCredential({ age: 30 })
const presentEx = await attest.presentForDrop(ex, 'o2', dest, ex.claimSecret)
assert(!presentEx.ok && /expired/i.test(presentEx.error), `expired present: ${presentEx.error}`)
store.markRefunded(expired.id)
assert(store.dropStatus(store.getDrop(expired.id)) === 'refunded', 'refunded')

// Round 6: rule fail
store.clearAll()
const gate = store.createDrop({ title: 'US gate', amount: '1', ruleId: 'non_us' })
store.issueDemoCredential({ nationality: 'United States', age: 40 })
const fail = await attest.presentForDrop(gate, 'o3', dest, gate.claimSecret)
assert(!fail.ok && /does not satisfy/i.test(fail.error), 'rule fail')

console.log('ok   demo ledger rounds 1–6 passed (incl. claim secret)')
