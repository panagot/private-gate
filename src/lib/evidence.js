/**
 * Local evidence log for Seed “Copy for Seed submission”.
 * Never invent explorer hashes — only record what this browser actually did.
 */

import { OPERATOR_PROOF } from '../config/operatorProof.js'

const KEY = 'private-gate:evidence-v1'

export function loadEvidence() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function recordEvidence(entry) {
  const list = loadEvidence()
  list.unshift({
    ...entry,
    at: Date.now(),
  })
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)))
  return list
}

export function clearEvidence() {
  localStorage.removeItem(KEY)
}

export function buildSeedBlurb() {
  const local = loadEvidence()
  const lines = [
    'Private Gate — Exploration evidence',
    '',
    `Pinned fundTx: ${OPERATOR_PROOF.fundTx || 'pending (do not invent)'}`,
    `Pinned claimTx: ${OPERATOR_PROOF.claimTx || 'pending (do not invent)'}`,
    `Sample claim link: ${OPERATOR_PROOF.sampleClaimLink || 'none'}`,
    `Walkthrough: ${OPERATOR_PROOF.demoVideoUrl || 'none'}`,
    '',
    'Local evidence (this browser):',
  ]
  if (local.length === 0) {
    lines.push('(none yet — create a gate and claim once)')
  } else {
    local.slice(0, 8).forEach((e, i) => {
      lines.push(
        `${i + 1}. [${e.kind}] ${e.dropId || '—'} · nullifier ${(e.nullifier || '').slice(0, 12) || '—'} · ${new Date(e.at).toISOString()}`,
      )
    })
  }
  lines.push('', 'Honesty: local ledger until gateZkApp is set. Product not audited.')
  return lines.join('\n')
}
