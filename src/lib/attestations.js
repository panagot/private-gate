/**
 * Attestation adapter.
 *
 * Today: demo path — selective disclosure + destination-bound auth + nullifier.
 * Next (grant M1): wire `mina-attestations` PresentationRequest / Presentation.create
 * against Auro (and compatible injections), then verify in a zkApp.
 */

import { getRule } from './rules.js'
import { claimAuth, claimSecretOk, nullifier } from './crypto.js'
import { dropStatus, getCredential, hasClaimed, recordClaim } from './store.js'
import { assertZkAppReady } from './wallet.js'

export const ATTESTATIONS_STATUS = {
  library: 'mina-attestations (npm) — wallet presentation in M1',
  demo: 'local selective disclosure + nullifier + destination-bound auth',
  wallets: 'Auro (recommended). Do not install from pallad.co — domain compromised.',
  upstreamDemo: 'https://mina-attestations-demo.zksecurity.xyz',
  repo: 'https://github.com/zksecurity/mina-attestations',
}

/**
 * Build a "presentation" for a drop rule.
 * Demo: returns only the boolean result + public outputs — never stores raw unused fields.
 */
export async function presentForDrop(drop, ownerId, destination, claimSecret) {
  if (!drop) {
    return { ok: false, error: 'Drop not found.' }
  }
  if (!claimSecretOk(drop, claimSecret)) {
    return {
      ok: false,
      error: 'Invalid or missing claim secret. Open the bearer claim link from Create (includes #/claim/…/secret).',
    }
  }
  const st = dropStatus(drop)
  if (st === 'claimed') {
    return { ok: false, error: 'Already claimed for this drop (nullifier spent).' }
  }
  if (st === 'refunded') {
    return { ok: false, error: 'Drop was refunded.' }
  }
  if (st === 'expired') {
    return { ok: false, error: 'Drop expired; refund instead.' }
  }
  const cred = getCredential()
  if (!cred) {
    return { ok: false, error: 'No credential. Attach one in the Claim panel first.' }
  }
  if (!destination || !String(destination).trim()) {
    return { ok: false, error: 'Destination required. Connect a wallet or paste a Mina address.' }
  }
  const rule = getRule(drop.ruleId)
  const ok = rule.demoCheck(cred)
  if (!ok) {
    return {
      ok: false,
      error: `Credential does not satisfy gate: ${rule.short}`,
    }
  }

  const revealed =
    rule.id === 'age18'
      ? { statement: 'age >= 18', ageBucket: '18+' }
      : rule.id === 'non_us'
        ? { statement: 'nationality ≠ United States' }
        : { statement: 'email domain = @mina.local' }

  const nullifierHex = await nullifier(drop.id, ownerId)
  if (hasClaimed(drop.id, nullifierHex)) {
    return { ok: false, error: 'Already claimed for this drop (nullifier spent).' }
  }

  const dest = String(destination).trim()
  const authHex = await claimAuth(drop.id, dest, drop.amount, nullifierHex)

  return {
    ok: true,
    mode: 'demo',
    revealed,
    nullifierHex,
    ownerId,
    destination: dest,
    authHex,
    claimSecret,
    ruleId: rule.id,
  }
}

export async function claimWithPresentation(drop, presentation) {
  if (!presentation?.ok) throw new Error(presentation?.error || 'Invalid presentation')
  return recordClaim({
    dropId: drop.id,
    ownerId: presentation.ownerId,
    nullifierHex: presentation.nullifierHex,
    revealed: presentation.revealed,
    destination: presentation.destination,
    authHex: presentation.authHex,
    claimSecret: presentation.claimSecret,
  })
}

/** Live path stub — honest failure until zkApp + mina-attestations land. */
export async function presentLive(_drop, _ownerId, _destination) {
  assertZkAppReady()
  throw new Error('Live presentation not wired yet')
}
