/** Demo crypto helpers. Production claims use mina-attestations presentations + on-chain nullifiers. */

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text)
  const dig = await crypto.subtle.digest('SHA-256', data)
  return toHex(dig)
}

/** One-time claim key: binds drop + owner (M2 expands to an on-chain nullifier set). */
export async function nullifier(dropId, ownerId) {
  return sha256Hex(`pg:v1:${dropId}:${ownerId}`)
}

/**
 * Destination-bound claim auth (demo).
 * Signature material = dropId | destination | amount | nullifier.
 * A presentation copied and retargeted to another destination must fail.
 */
export async function claimAuth(dropId, destination, amount, nullifierHex) {
  return sha256Hex(`pg:claim:${dropId}:${destination}:${amount}:${nullifierHex}`)
}

export async function verifyClaimAuth(expectedHex, dropId, destination, amount, nullifierHex) {
  const got = await claimAuth(dropId, destination, amount, nullifierHex)
  return got === expectedHex
}

export function randomId(prefix = 'pg') {
  const a = crypto.getRandomValues(new Uint8Array(8))
  return `${prefix}_${toHex(a)}`
}

/** Bearer claim fragment secret — required in claim links. */
export function randomSecret(byteLen = 16) {
  const a = crypto.getRandomValues(new Uint8Array(byteLen))
  return toHex(a)
}

/**
 * Claim secret lives in the URL hash only — never query, never POST.
 * Format: `#/claim/{dropId}/{claimSecret}`
 */
export function encodeClaimLink(origin, { dropId, claimSecret }) {
  const base = String(origin || '').replace(/\/$/, '')
  if (!dropId) throw new Error('dropId required')
  if (!claimSecret) throw new Error('claimSecret required for bearer claim links')
  const frag = `#/claim/${encodeURIComponent(dropId)}/${encodeURIComponent(claimSecret)}`
  return `${base}/app${frag}`
}

export function parseClaimHash(hash) {
  if (!hash) return null
  // New: #/claim/{dropId}/{secret}
  const modern = String(hash).match(/#\/claim\/([^/?#]+)\/([^/?#]+)/)
  if (modern) {
    return {
      dropId: decodeURIComponent(modern[1]),
      claimSecret: decodeURIComponent(modern[2]),
    }
  }
  // Legacy (no secret): #/claim/{dropId} or #/claim/{dropId}:{hint}
  const legacy = String(hash).match(/#\/claim\/([^/:?#]+)(?::([^/?#]+))?/)
  if (!legacy) return null
  return {
    dropId: decodeURIComponent(legacy[1]),
    claimSecret: null,
    ownerHint: legacy[2] ? decodeURIComponent(legacy[2]) : null,
  }
}

export function encodeRefundLink(origin, dropId) {
  const base = String(origin || '').replace(/\/$/, '')
  return `${base}/app#/refund/${encodeURIComponent(dropId)}`
}

export function parseRefundHash(hash) {
  if (!hash) return null
  const m = String(hash).match(/#\/refund\/(.+)/)
  if (!m) return null
  return { dropId: decodeURIComponent(m[1]) }
}

/** True when presented secret matches the drop (legacy drops without a secret are rejected). */
export function claimSecretOk(drop, claimSecret) {
  if (!drop?.claimSecret) return false
  return Boolean(claimSecret) && claimSecret === drop.claimSecret
}
