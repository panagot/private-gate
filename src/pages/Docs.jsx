import { Link } from 'react-router-dom'
import { ATTESTATIONS_STATUS } from '../lib/attestations'
import { RULES } from '../lib/rules'

export default function Docs() {
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Protocol</p>
        <h1>Docs</h1>
        <p>
          Private Gate is the operator surface for attestation-gated claim drops on Mina. This page defines the product,
          the two modes reviewers will see, and the vocabulary used across the app.
        </p>
      </header>

      <div className="page-rail">
        <article>
          <strong>Create → claim</strong>
          <p>Standard gate lifecycle for operators who already hold Mina credentials.</p>
        </article>
        <article>
          <strong>Two modes</strong>
          <p>Local ledger for full review today; Devnet when gateZkApp is configured.</p>
        </article>
        <article>
          <strong>Hash-only links</strong>
          <p>Claim and refund material stay in the URL fragment — never the query string.</p>
        </article>
        <article>
          <strong>Not an issuer</strong>
          <p>Consumes mina-attestations. Does not replace wallets, issuers, or vaults.</p>
        </article>
      </div>

      <div className="content-stack">
        <section className="panel prose">
          <h2>Product</h2>
          <p>
            Operators need sybil-resistant rewards without collecting raw PII. Mina already ships an audited credential
            library —{' '}
            <a href={ATTESTATIONS_STATUS.repo} target="_blank" rel="noreferrer">
              mina-attestations
            </a>{' '}
            by zkSecurity — plus wallet credential support. What was missing is a clear{' '}
            <strong>create gate → prove → claim once</strong> product.
          </p>
          <p>
            Private Gate fills that gap. It does not reinvent issuers, presentations, or wallet vaults. It consumes the
            attestation stack and adds the drop lifecycle operators actually run: stamp a rule, share a claim link,
            verify a private presentation, pay out once, refund after expiry.
          </p>
          <p>
            Typical operator jobs: community age-gated rewards, contributor allowlists (email domain / membership),
            jurisdiction-shaped tips, and any drop where double-claiming would break the budget.
          </p>
        </section>

        <div className="doc-grid">
          <section className="panel prose">
            <h2>Local ledger</h2>
            <p>
              Default for reviewers. Create a gate, attach a local credential stand-in, present a selective disclosure,
              claim with destination-bound auth and a nullifier, then refund after expiry. Everything runs in the
              browser — no chain calls, no faucet.
            </p>
            <p>
              Use this path to verify UX, double-claim rejection, bearer-link handling, and security checks before the
              zkApp lands. State is browser storage; treat it as a rehearsal ledger, not settlement.
            </p>
          </section>
          <section className="panel prose">
            <h2>Devnet (M1 → M2)</h2>
            <p>
              Auro connect and GraphQL probes work today. <strong>M1</strong> wires wallet presentation + zkApp verify
              when <code>gateZkApp</code> is set. <strong>M2</strong> adds funded escrow and an on-chain nullifier
              registry. Until M1, Devnet claim fails with an explicit pending message — dual-path honesty, not a fake
              success.
            </p>
            <p>Pinned explorer hashes stay null until a real Devnet E2E exists. Do not invent proof.</p>
          </section>
        </div>

        <section className="panel prose" id="proofs">
          <h2>How proofs work — Local vs M1</h2>
          <p>
            A <strong>gate rule</strong> is a yes/no question about a credential the claimant already holds. The operator
            never receives the raw ID fields. Local mode rehearses that contract with a browser stand-in. M1 is the same
            contract with real Mina crypto.
          </p>

          <h3>Local (what you can run now)</h3>
          <ol>
            <li>Operator creates a gate (Age 18+, Non-US, or email domain).</li>
            <li>Claimant opens Claim and <strong>issues a local credential</strong> — typed age / nationality / email.</li>
            <li>
              <strong>Present & claim</strong> checks the predicate in-browser, records only the statement (e.g.{' '}
              <code>age ≥ 18</code>), binds payout to a destination, and spends a nullifier.
            </li>
          </ol>
          <p>
            <code>@mina.local</code> is a fake demo domain so reviewers can pass the email gate without a real issuer. It
            is not Mina mail.
          </p>

          <h3>M1 → M2 (what Exploration funds)</h3>
          <ol>
            <li>
              An <strong>issuer</strong> (KYC, org, etc.) writes a real credential into the claimant’s{' '}
              <strong>Auro</strong> wallet using{' '}
              <a href={ATTESTATIONS_STATUS.repo} target="_blank" rel="noreferrer">
                mina-attestations
              </a>
              .
            </li>
            <li>
              <strong>M1 ($1,000)</strong> — Private Gate sends a <strong>PresentationRequest</strong>; the wallet
              builds a ZK presentation; a Devnet <strong>zkApp</strong> verifies it. Raw DOB / country / full email never
              leave the wallet.
            </li>
            <li>
              <strong>M2 ($1,000)</strong> — Funded drop escrow, on-chain nullifier registry, and integrator docs so
              verified presentations settle once to the destination-bound address.
            </li>
          </ol>
          <p>
            Upstream reference:{' '}
            <a href={ATTESTATIONS_STATUS.upstreamDemo} target="_blank" rel="noreferrer">
              mina-attestations demo
            </a>
            . Private Gate does not replace issuers or wallets — it is the operator drop surface on top.
          </p>

          <h3>Per-rule map</h3>
          <div className="content-stack" style={{ marginTop: '1rem' }}>
            {RULES.map((r) => (
              <div key={r.id} className="rule-path">
                <strong>{r.label}</strong>
                <p className="hint" style={{ marginBottom: '0.65rem' }}>
                  Sees: {r.reveals} · Hides: {r.hides}
                </p>
                <div className="rule-path-cols">
                  <article>
                    <span className="gap-tag">Local</span>
                    <p>{r.localHow}</p>
                  </article>
                  <article>
                    <span className="gap-tag">M1</span>
                    <p>{r.m1How}</p>
                  </article>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel prose">
          <h2>Operator lifecycle</h2>
          <ol>
            <li>
              <strong>Stamp the gate</strong> — choose a predicate (age, jurisdiction, email domain), amount, unit, and
              expiry. The app returns a claim link and a separate refund link.
            </li>
            <li>
              <strong>Distribute the claim link</strong> — treat it as cash. Prefer out-of-band channels you control;
              never paste the secret into analytics or server logs.
            </li>
            <li>
              <strong>Claimant presents</strong> — only the gate predicate is proven. Unused credential fields stay with
              the holder.
            </li>
            <li>
              <strong>Payout once</strong> — Local enforces one claim per drop. Per-claimant nullifier sets are M2.
              Auth commits to the destination address.
            </li>
            <li>
              <strong>Refund if needed</strong> — after expiry, unclaimed value recovers via the refund fragment.
            </li>
          </ol>
        </section>

        <section className="panel prose">
          <h2>Glossary</h2>
          <dl className="facts">
            <div>
              <dt>Gate</dt>
              <dd>Operator rule, reward amount, and expiry window for a drop.</dd>
            </div>
            <div>
              <dt>Presentation</dt>
              <dd>Selective disclosure that proves the gate predicate without revealing unused credential fields.</dd>
            </div>
            <div>
              <dt>Nullifier</dt>
              <dd>
                Local: first successful claim closes the drop. Per-claimant nullifier registry lands in M2. Destination
                auth still binds payout address today.
              </dd>
            </div>
            <div>
              <dt>Destination-bound auth</dt>
              <dd>
                Claim authorization commits to the payout address so a presentation copied from the wire cannot retarget
                funds.
              </dd>
            </div>
            <div>
              <dt>Bearer claim link</dt>
              <dd>
                URL fragment <code>#/claim/&#123;dropId&#125;/&#123;secret&#125;</code>. The secret is required to claim —
                treat the full link as cash. Never put it in the query string or POST it to a server.
              </dd>
            </div>
            <div>
              <dt>Refund link</dt>
              <dd>
                Companion fragment for the operator. Unlocks recovery after expiry when the drop was never claimed.
              </dd>
            </div>
          </dl>
        </section>

        <section className="panel prose">
          <h2>FAQ</h2>
          <p>
            <strong>Is this audited?</strong> No. The upstream mina-attestations library is audited; Private Gate as a
            product is not. Do not move mainnet-size funds through this UI.
          </p>
          <p>
            <strong>Do I need a wallet for the local path?</strong> No. Connect Auro when you want destination autofill
            or when exercising Devnet mode.
          </p>
          <p>
            <strong>Why not pallad.co?</strong> That domain was observed compromised (hijacked content). Install Auro
            from aurowallet.com or the Mina wallet list instead.
          </p>
          <p>
            <strong>Can operators invent their own predicates?</strong> The prototype ships a fixed rule catalog suited
            for review. Production predicates follow mina-attestations credential schemas — not free-form PII forms.
          </p>
          <p>
            <strong>Where next?</strong> <Link to="/security">Security checks</Link> · <Link to="/status">Status</Link>{' '}
            · <Link to="/seed">Exploration ask</Link> · <Link to="/app">App</Link>
          </p>
        </section>
      </div>
    </div>
  )
}
