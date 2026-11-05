/**
 * Pinned Devnet proof for Seed reviewers (static).
 * Fill after the first successful live gate → present → claim run.
 * Leave null until real explorer hashes exist — do not invent txs.
 */
export const OPERATOR_PROOF = {
  /** Minascan tx hash for gate create / fund */
  fundTx: null,
  /** Minascan tx hash for claim / payout */
  claimTx: null,
  /** Optional walkthrough URL */
  demoVideoUrl: null,
  /** Pre-funded sample claim link for reviewers */
  sampleClaimLink: null,
  updatedAt: null,
  note: 'Operator fills after first Devnet E2E. Local evidence on /seed still logs each browser run.',
}
