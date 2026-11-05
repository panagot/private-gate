# Private Gate

**Prove a private fact. Claim a reward once.**

Operator product for **attestation-gated claim drops** on [Mina](https://minaprotocol.com). Claimants satisfy a gate (age 18+, non-US, email domain, …) without revealing the raw credential. One claim per drop. Claim authorization is **destination-bound**. Unclaimed value is **refundable after expiry**.

| | |
|---|---|
| **Live** | [private-gate.vercel.app](https://private-gate.vercel.app) |
| **Repo** | [github.com/panagot/private-gate](https://github.com/panagot/private-gate) |
| **License** | [MIT](LICENSE) |
| **Stage** | Exploration prototype — **not audited**, not mainnet |
| **Ask** | Mina Builders Exploration · **$2,000** ($1k M1 · $1k M2) |

> Consumes audited [mina-attestations](https://github.com/zksecurity/mina-attestations) (zkSecurity). Private Gate does **not** reinvent issuers, presentations, or wallet credential stores — it is the missing **create gate → prove → claim once** surface.

---

## Why it exists

Mina shipped audited attestations and wallet credential support. What operators still lack is a standard product to fund a gated reward, collect a private proof, and pay out exactly once — so they invent one-offs or collect PII.

Private Gate closes that gap:

1. **Operator** stamps a rule, amount, and expiry — then shares a bearer claim link.
2. **Claimant** presents only what the gate needs (selective disclosure).
3. **Drop closes** after one successful claim; unclaimed value is refundable after expiry.

---

## Status at a glance

| Capability | Status |
|---|---|
| Create gate → present → claim once → refund (Local) | **Shipped** |
| Bearer claim link `#/claim/{id}/{secret}` | **Shipped** |
| Destination-bound claim auth | **Shipped** |
| Auro wallet connect + Devnet GraphQL probes | **Shipped** |
| Runnable Security checks (isolated ledger) | **Shipped** |
| mina-attestations PresentationRequest via Auro | **M1** |
| zkApp verify on Devnet | **M1** |
| Funded escrow + on-chain nullifier registry | **M2** |
| Mainnet | **Later** — only after pinned Devnet E2E |

---

## Two honest modes

| Mode | What works | Wallet | Status |
|------|------------|--------|--------|
| **Local ledger** | Create → present → claim once → refund | Optional (destination autofill) | **Default — full path today** |
| **Mina Devnet** | Auro connect + GraphQL probes | [Auro](https://www.aurowallet.com/) | On-chain verify when `gateZkApp` is set (**M1**); escrow in **M2** |

Devnet claim **fails honestly** until a zkApp is deployed. Evidence slots stay **null** until real [Minascan](https://minascan.io/devnet) hashes exist — no invented explorer links.

**Do not install from pallad.co** — that domain was observed compromised (gambling SEO spam, Nov 2026). Use [Auro Wallet](https://www.aurowallet.com/) or the [Mina wallet list](https://minaprotocol.com/wallet).

---

## How proofs work (Local vs M1)

A **gate rule** is a yes/no question about a credential the claimant already holds. The operator never receives raw ID fields.

| Gate | Operator learns | Stays private |
|------|-----------------|---------------|
| Age 18+ | age ≥ 18 | Date of birth / exact age |
| Non-US | nationality ≠ United States | Which country |
| Email `@mina.local` | email ends with that domain | Full address (`@mina.local` is a **demo** domain for review) |

**Local (now):** Issue a browser credential stand-in → Present & claim checks the predicate in-app → only the statement is recorded.

**M1 (funded):** Issuer puts a real credential in Auro via mina-attestations → Private Gate sends a `PresentationRequest` → wallet returns a ZK presentation → zkApp verifies on Devnet. Raw PII never leaves the wallet.

**M2 (funded):** Funded escrow + on-chain nullifier registry settle the payout once.

In-app walkthrough: [/docs#proofs](https://private-gate.vercel.app/docs#proofs) · per-rule Local vs M1 panels in [/app](https://private-gate.vercel.app/app).

---

## Quick start

### Option A — live site (fastest)

1. Open **[private-gate.vercel.app](https://private-gate.vercel.app)**
2. Keep network on **Local** (header)
3. Follow the [Reviewer E2E](#reviewer-e2e-local-path) below — no faucet required

### Option B — run locally

```bash
git clone https://github.com/panagot/private-gate.git
cd private-gate
npm install
npm run dev
```

Open the URL Vite prints (commonly `http://127.0.0.1:5179` if that port is free).

```bash
npm run build        # production build
npm run test:smoke   # wallet / links / security / ledger checks
npm run lint         # oxlint
npm run preview      # serve dist/
```

**Stack:** Vite · React 19 · React Router · MIT.

---

## Reviewer E2E (local path)

**No faucet and no attestation wallet required.** Expanded steps: [`docs/REVIEWER_E2E.md`](docs/REVIEWER_E2E.md).

1. **App → Create** — title, amount (e.g. `1`), rule (Age 18+), expiry hours  
2. Tick **bearer warning** + **backed up** · copy claim link or **Open as recipient**  
3. **Claim** — Issue credential (defaults pass age 18+) · set destination · **Present & claim**  
4. Retry claim → must fail (drop closed)  
5. **Security** — Run all checks (isolated ledger; **not an audit**)  
6. **Status** — Probe Devnet GraphQL (reachable ≠ fundable until zkApp)  
7. **Ask** — Exploration narrative + evidence slots  

**Tip:** Set credential age `16` to fail Age 18+, nationality `United States` to fail Non-US, or email `you@gmail.com` to fail the domain gate.

---

## Site map

| Route | Purpose |
|-------|---------|
| [`/`](https://private-gate.vercel.app/) | Product overview · gap · proofs · capability |
| [`/app`](https://private-gate.vercel.app/app) | Create / claim / refund / ledger workspace |
| [`/docs`](https://private-gate.vercel.app/docs) | Protocol, Local vs M1, glossary, FAQ |
| [`/security`](https://private-gate.vercel.app/security) | Threat model + runnable checks |
| [`/status`](https://private-gate.vercel.app/status) | Devnet GraphQL probes |
| [`/roadmap`](https://private-gate.vercel.app/roadmap) | Shipped / Next / Later + exit criteria |
| [`/ask`](https://private-gate.vercel.app/seed) | Exploration ask + how to verify |

Claim links use the URL **hash** only: `#/claim/{dropId}/{secret}` — never query strings, never POSTed to a server. Treat the full link as cash.

---

## Architecture

```
Operator create gate  →  claim link (#/claim/{id}/{secret}) + refund link
Claimant credential   →  selective disclosure (local today / mina-attestations M1)
Presentation          →  destination-bound auth + drop closed after one claim
Ledger / zkApp        →  Local record today · M1 verify · M2 escrow + nullifier set
```

| Layer | Today (Local) | M1 | M2 |
|-------|---------------|----|----|
| Credential | Browser stand-in fields | Auro + mina-attestations presentation | — |
| Verify | In-browser rule check | zkApp presentation verify | — |
| Payout | Local ledger record | Verify path live | Funded escrow |
| Sybil | One claim per drop | — | On-chain nullifier registry |
| Safety | Destination-bound SHA-256 auth + hash secret | Same UX · stronger crypto | Same |

Pinned Devnet proof slots: [`src/config/operatorProof.js`](src/config/operatorProof.js) — **leave null until real Minascan hashes exist**.

### Repository layout

```
src/
  pages/          Home, App (Workspace), Docs, Security, Status, Roadmap, Ask
  components/     Layout, wallet, GateFigure, ReviewerKit
  lib/            ledger, attestations adapter, crypto, security checks, probes
  config/         networks (Local / Devnet), operatorProof slots
scripts/          smoke-wallet · smoke-links · smoke-security · smoke-demo-ledger
docs/             REVIEWER_E2E · STATUS
```

---

## Exploration ask

| | |
|---|---|
| **Program** | Mina Builders · Exploration ($1k–$5k range) |
| **Ask** | **$2,000** — two equal milestones: **M1 verifies**, **M2 settles** |
| **Timeline** | ~8–12 weeks from approval |

### M1 — $1,000 · ~4–6 weeks

- Auro + mina-attestations `PresentationRequest` for existing gates  
- zkApp verify on Devnet (`gateZkApp` set)  
- **Exit:** pinned Minascan verify hash; Devnet no longer returns “zkApp pending”

### M2 — $1,000 · ~4–6 weeks

- Funded drop escrow  
- On-chain nullifier registry  
- Integrator docs  
- **Exit:** pinned fund + claim hashes; second claim fails on-chain  

Narrative and evidence UI: live [/ask](https://private-gate.vercel.app/seed) page.

---

## What Private Gate is / is not

**Is**

- An operator product for attestation-gated drops on Mina  
- A dual-path prototype (Local full path · Devnet honest stub → M1/M2)  
- A consumer of audited mina-attestations — not a new credential stack  
- Open source (MIT)

**Is not**

- Audited as a product  
- Mainnet-funded payout advice  
- An Archive / indexer observatory  
- An issuer, identity wallet, or KYC provider  
- A recommendation to visit pallad.co  

---

## Security

See [`SECURITY.md`](SECURITY.md) and the in-app [/security](https://private-gate.vercel.app/security) page.

- Claim links embed a **hash secret** — treat as cash  
- Local ledger is **browser storage**  
- Local enforces **one claim per drop**; per-claimant nullifier sets are **M2**  
- Upstream mina-attestations is audited; **this UI is not**  
- Runnable Security checks exercise retarget / bearer secret / double-claim / expiry on an **isolated** ledger — passing ≠ audit  

---

## Contributing / review

Issues and PRs welcome for clarity, honesty bugs, and Local-path UX. For security-sensitive reports, prefer private contact over public issues that could confuse reviewers about live-path safety (see [`SECURITY.md`](SECURITY.md)).

Related docs in-repo: [`PRODUCT.md`](PRODUCT.md) · [`DESIGN.md`](DESIGN.md) · [`docs/STATUS.md`](docs/STATUS.md).

---

## Links

- Live app: [private-gate.vercel.app](https://private-gate.vercel.app)  
- mina-attestations: [github.com/zksecurity/mina-attestations](https://github.com/zksecurity/mina-attestations)  
- Upstream demo: [mina-attestations-demo.zksecurity.xyz](https://mina-attestations-demo.zksecurity.xyz)  
- Auro Wallet: [aurowallet.com](https://www.aurowallet.com/)  
- Mina Builders grants: [minaprotocol.com/builder-grants-program](https://minaprotocol.com/builder-grants-program)  

---

## License

MIT — see [`LICENSE`](LICENSE).
