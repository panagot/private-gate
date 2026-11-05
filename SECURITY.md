# Security

Private Gate is a **Mina attestation-gated claim prototype**. It has **not** received a formal third-party audit.

## Scope

| Area | Status |
| --- | --- |
| Demo ledger (localStorage) | Browser-local only — not consensus security |
| Nullifier / double-claim | Enforced in demo store; on-chain nullifier is M1/M2 |
| Destination-bound auth | Demo SHA-256 binding; live path uses mina-attestations |
| Bearer claim links | Anyone with `#/claim/{id}/{secret}` can attempt a claim — treat as cash. Local: one claim per drop; per-claimant nullifier sets are M2. |
| Wallet connect | Auro injection — no private keys in the app |
| Install links | **Never** `pallad.co` (domain hijacked Nov 2026 — gambling SEO spam). Prefer Auro / Mina docs. |

## Reporting

Email the maintainer privately for vulnerabilities. Do not open public issues for exploitable demo-ledger bugs that could confuse reviewers about live-path safety.

## Honesty

In-app `/security` checks demonstrate retarget / double-claim / expiry on an **isolated** ledger. Passing checks ≠ audit.
