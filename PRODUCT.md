# Private Gate

Attestation-gated claim drops on Mina.

**One-liner:** Prove a private fact without revealing the credential — then claim a reward once.

**Default path (reviewers):** Local ledger — create gate, attach credential, present selective disclosure, destination-bound claim once (nullifier), expiry + refund. Wallet optional.

**Devnet path (M1):** Auro connect works today. `mina-attestations` presentation verified in a zkApp + escrow when `gateZkApp` is set — fails honestly until then. Do not link pallad.co (compromised).

## Users

Operators running sybil-resistant drops, community rewards, and allowlists who cannot collect raw PII.

## Tone

Precise, protocol-honest. Consume audited Mina Attestations — do not reinvent credentials. Read as a prototype product, not a hackathon demo.
