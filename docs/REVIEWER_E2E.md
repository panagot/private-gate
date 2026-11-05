# Reviewer E2E (Local path — no attestation wallet required)

1. Open the app → network pill **Local**.
2. **App → Create** — stamp a gate (e.g. Age 18+, 1 MINA, 72h).
3. Check **bearer warning** + **backed up**, copy claim link or **Open as recipient**.
4. Confirm the claim URL looks like `#/claim/{dropId}/{secret}`.
5. **Claim** tab — **Issue / refresh credential** (defaults pass age 18+).
6. Paste or autofill a destination (or Connect Auro Wallet).
7. **Present & claim** → success flash with nullifier prefix.
8. Retry claim → rejected (drop closed / already claimed).
9. Optional: create a drop with short expiry, wait or force `expiresAt` in the past; confirm claim refused and refund works.
10. Open **/security** → Run all checks (expect PASS).
11. Open **/ask** → evidence slots stay null until a real Devnet E2E; local evidence may list actions from this browser.

**No mina-attestations wallet required for this path.** Live Devnet claim fails honestly until `gateZkApp` is set.

**Fail the gate on purpose:** age `16`, nationality `United States`, or email `you@gmail.com`.
