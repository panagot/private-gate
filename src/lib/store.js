import { randomId, randomSecret } from './crypto.js'
import { getRule } from './rules.js'

const KEY = 'private-gate:v2'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      // migrate v1 if present
      const v1 = localStorage.getItem('private-gate:v1')
      if (v1) {
        const parsed = JSON.parse(v1)
        const migrated = migrateV1(parsed)
        write(migrated)
        return migrated
      }
      return { drops: [], claims: [], credential: null }
    }
    return JSON.parse(raw)
  } catch {
    return { drops: [], claims: [], credential: null }
  }
}

function migrateV1(parsed) {
  return {
    drops: (parsed.drops || []).map((d) => ({
      ...d,
      status: d.status || 'open',
      expiresAt: d.expiresAt || d.createdAt + 72 * 3600_000,
      unit: d.unit === 'demo MINA' ? 'MINA' : d.unit || 'MINA',
      claims: d.claims || 0,
    })),
    claims: parsed.claims || [],
    credential: parsed.credential || null,
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  return state
}

export function listDrops() {
  return read().drops.slice().sort((a, b) => b.createdAt - a.createdAt)
}

export function getDrop(id) {
  return read().drops.find((d) => d.id === id) || null
}

export function createDrop({ title, amount, ruleId, note, expiryHours = 72 }) {
  const state = read()
  const rule = getRule(ruleId)
  const hours = Math.max(1, Number(expiryHours) || 72)
  const now = Date.now()
  const drop = {
    id: randomId('drop'),
    title: title.trim() || 'Untitled drop',
    amount: String(amount || '1'),
    unit: 'MINA',
    ruleId: rule.id,
    ruleLabel: rule.label,
    note: (note || '').trim(),
    claimSecret: randomSecret(16),
    createdAt: now,
    expiresAt: now + hours * 3600_000,
    mode: 'demo',
    status: 'open',
    claims: 0,
    destination: null,
    claimedAt: null,
    refundedAt: null,
  }
  state.drops.unshift(drop)
  write(state)
  return drop
}

export function dropStatus(drop, now = Date.now()) {
  if (!drop) return 'missing'
  if (drop.status === 'claimed') return 'claimed'
  if (drop.status === 'refunded') return 'refunded'
  if (now > drop.expiresAt) return 'expired'
  return 'open'
}

export function getCredential() {
  return read().credential
}

/** Issue a browser-local demo credential (stands in for wallet-held mina-attestations credential). */
export function issueDemoCredential(overrides = {}) {
  const state = read()
  const credential = {
    id: randomId('cred'),
    kind: 'demo-native',
    issuedAt: Date.now(),
    age: overrides.age ?? 21,
    nationality: overrides.nationality ?? 'Greece',
    email: overrides.email ?? 'builder@mina.local',
    note: 'Local credential — stands in for a Mina Attestations wallet credential until M1.',
  }
  state.credential = credential
  write(state)
  return credential
}

export function listClaims(dropId) {
  return read().claims.filter((c) => c.dropId === dropId)
}

export function hasClaimed(dropId, nullifierHex) {
  return read().claims.some((c) => c.dropId === dropId && c.nullifier === nullifierHex)
}

export function recordClaim({ dropId, ownerId, nullifierHex, revealed, destination, authHex, claimSecret }) {
  const state = read()
  const drop = state.drops.find((d) => d.id === dropId)
  if (!drop) throw new Error('Drop not found')
  if (!drop.claimSecret || claimSecret !== drop.claimSecret) {
    throw new Error('Invalid or missing claim secret — open the bearer claim link from Create')
  }
  const st = dropStatus(drop)
  if (st === 'claimed') throw new Error('Already claimed')
  if (st === 'refunded') throw new Error('Drop was refunded')
  if (st === 'expired') throw new Error('Drop expired; refund instead')
  if (state.claims.some((c) => c.dropId === dropId && c.nullifier === nullifierHex)) {
    throw new Error('Already claimed with this nullifier')
  }
  if (!destination || !String(destination).trim()) {
    throw new Error('Destination required (destination-bound claim)')
  }
  const claim = {
    id: randomId('claim'),
    dropId,
    ownerId,
    nullifier: nullifierHex,
    revealed,
    destination: String(destination).trim(),
    authHex: authHex || null,
    claimedAt: Date.now(),
    mode: 'demo',
  }
  state.claims.unshift(claim)
  drop.status = 'claimed'
  drop.destination = claim.destination
  drop.claimedAt = claim.claimedAt
  drop.claims = (drop.claims || 0) + 1
  write(state)
  return claim
}

export function markRefunded(dropId) {
  const state = read()
  const drop = state.drops.find((d) => d.id === dropId)
  if (!drop) throw new Error('Drop not found')
  const st = dropStatus(drop)
  if (st === 'claimed') throw new Error('Already claimed — cannot refund')
  if (st === 'refunded') throw new Error('Already refunded')
  if (st !== 'expired' && Date.now() <= drop.expiresAt) {
    throw new Error('Not expired yet')
  }
  drop.status = 'refunded'
  drop.refundedAt = Date.now()
  write(state)
  return drop
}

export function clearAll() {
  localStorage.removeItem(KEY)
  localStorage.removeItem('private-gate:v1')
}
