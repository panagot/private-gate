/**
 * Recorded security checks Private Gate can demonstrate in-browser.
 * Uses an isolated in-memory ledger so the Demo App ledger stays clean.
 */
import {
  claimAuth,
  encodeClaimLink,
  nullifier,
  parseClaimHash,
  randomId,
  randomSecret,
  verifyClaimAuth,
} from './crypto.js'

function makeMemoryLedger() {
  const drops = {}
  const claims = []
  return {
    createDrop(entry) {
      drops[entry.id] = { ...entry }
      return drops[entry.id]
    },
    recordClaim({ dropId, ownerId, nullifierHex, destination, claimSecret }) {
      const d = drops[dropId]
      if (!d) throw new Error('Drop not found')
      if (!d.claimSecret || claimSecret !== d.claimSecret) throw new Error('bad claim secret')
      if (d.status !== 'open') throw new Error(`cannot claim: status is ${d.status}`)
      if (Date.now() > d.expiresAt) throw new Error('expired')
      if (claims.some((c) => c.dropId === dropId && c.nullifier === nullifierHex)) {
        throw new Error('nullifier spent')
      }
      claims.push({ dropId, ownerId, nullifier: nullifierHex, destination })
      d.status = 'claimed'
      return d
    },
    getDrop(id) {
      return drops[id] || null
    },
  }
}

export const SECURITY_CASES = [
  {
    id: 'retarget',
    title: 'Retarget resistance',
    body: 'A valid claim auth bound to destination A must fail verification for destination B.',
  },
  {
    id: 'bearer',
    title: 'Bearer claim-link secret',
    body: 'Claim links must carry a hash secret (#/claim/{id}/{secret}). Links without a secret, or with the wrong secret, must not claim.',
  },
  {
    id: 'double',
    title: 'Double-claim / drop closed',
    body: 'After a successful claim, the drop is closed — a second claim must be rejected. Local: one claim per drop; per-claimant nullifier sets are M2.',
  },
  {
    id: 'expiry',
    title: 'Expiry gate',
    body: 'Past expiresAt, claim is refused; refund is the recovery path.',
  },
]

export async function runRetargetCheck() {
  const dropId = randomId('sec')
  const nullifierHex = await nullifier(dropId, 'owner-a')
  const amount = '1'
  const authA = await claimAuth(dropId, 'B62qRecipientA', amount, nullifierHex)
  const okA = await verifyClaimAuth(authA, dropId, 'B62qRecipientA', amount, nullifierHex)
  const okB = await verifyClaimAuth(authA, dropId, 'B62qAttackerB', amount, nullifierHex)
  if (!okA) return { pass: false, detail: 'Valid destination failed verification' }
  if (okB) return { pass: false, detail: 'Retargeted destination incorrectly verified' }
  return { pass: true, detail: 'Auth verifies for A only; B rejected' }
}

export async function runBearerCheck() {
  const dropId = randomId('drop')
  const secret = randomSecret(16)
  const link = encodeClaimLink('http://127.0.0.1:5179', { dropId, claimSecret: secret })
  if (link.includes('?')) return { pass: false, detail: 'Claim secret leaked into query string' }
  const parsed = parseClaimHash(new URL(link).hash)
  if (!parsed?.claimSecret || parsed.claimSecret !== secret || parsed.dropId !== dropId) {
    return { pass: false, detail: 'Claim link did not round-trip dropId + secret in the hash' }
  }
  const legacy = parseClaimHash(`#/claim/${dropId}`)
  if (legacy?.claimSecret) return { pass: false, detail: 'Legacy link unexpectedly had a secret' }
  return {
    pass: true,
    detail: 'Hash carries #/claim/{id}/{secret}; query unused; legacy no-secret links parse without a secret',
  }
}

export async function runDoubleClaimCheck() {
  const ledger = makeMemoryLedger()
  const id = randomId('sec')
  const secret = randomSecret(8)
  const now = Date.now()
  ledger.createDrop({
    id,
    status: 'open',
    createdAt: now,
    expiresAt: now + 60_000,
    amount: '1',
    claimSecret: secret,
  })
  const n = await nullifier(id, 'owner-1')
  ledger.recordClaim({
    dropId: id,
    ownerId: 'owner-1',
    nullifierHex: n,
    destination: 'B62qA',
    claimSecret: secret,
  })
  let blocked = false
  try {
    ledger.recordClaim({
      dropId: id,
      ownerId: 'owner-2',
      nullifierHex: await nullifier(id, 'owner-2'),
      destination: 'B62qB',
      claimSecret: secret,
    })
  } catch {
    blocked = true
  }
  if (!blocked) return { pass: false, detail: 'Second claim unexpectedly succeeded' }
  return { pass: true, detail: 'Second claim rejected after first success (drop closed; local one-claim-per-drop)' }
}

export async function runExpiryCheck() {
  const ledger = makeMemoryLedger()
  const id = randomId('sec')
  const secret = randomSecret(8)
  const now = Date.now()
  ledger.createDrop({
    id,
    status: 'open',
    createdAt: now - 120_000,
    expiresAt: now - 60_000,
    amount: '1',
    claimSecret: secret,
  })
  const n = await nullifier(id, 'owner-1')
  let blocked = false
  try {
    ledger.recordClaim({
      dropId: id,
      ownerId: 'owner-1',
      nullifierHex: n,
      destination: 'B62qA',
      claimSecret: secret,
    })
  } catch {
    blocked = true
  }
  if (!blocked) return { pass: false, detail: 'Expired drop incorrectly claimed' }
  return { pass: true, detail: 'Expired drop refused; refund is the recovery path' }
}

export async function runSecurityCase(id) {
  if (id === 'retarget') return runRetargetCheck()
  if (id === 'bearer') return runBearerCheck()
  if (id === 'double') return runDoubleClaimCheck()
  if (id === 'expiry') return runExpiryCheck()
  return { pass: false, detail: 'Unknown case' }
}
