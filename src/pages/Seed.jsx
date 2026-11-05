import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReviewerKit from '../components/ReviewerKit'
import { OPERATOR_PROOF } from '../config/operatorProof'
import { buildSeedBlurb, loadEvidence } from '../lib/evidence'

export default function Seed() {
  const [copied, setCopied] = useState(false)
  const evidence = loadEvidence()

  async function copyBlurb() {
    const text = buildSeedBlurb()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Mina Builders · Exploration</p>
        <h1>Exploration ask</h1>
        <p>
          Attestation-gated claim drops for Mina operators. Ask <strong>$2,000</strong> — two equal{' '}
          <strong>$1,000</strong> milestones: M1 verifies, M2 settles.
        </p>
      </header>

      <div className="page-rail">
        <article>
          <strong>$2,000</strong>
          <p>Two equal $1,000 milestones: M1 verifies, M2 settles.</p>
        </article>
        <article>
          <strong>M1 · $1,000</strong>
          <p>Auro + mina-attestations presentation verified on Devnet.</p>
        </article>
        <article>
          <strong>M2 · $1,000</strong>
          <p>Funded escrow, on-chain nullifier registry, integrator docs.</p>
        </article>
        <article>
          <strong>Ships now</strong>
          <p>Local create → claim → refund path runnable without a faucet.</p>
        </article>
      </div>

      <div className="content-stack">
        <section className="panel prose">
          <h2>Why this</h2>
          <p>
            Mina shipped audited <code>mina-attestations</code> and wallet credential support. What was missing: a clear{' '}
            <strong>create gate → prove → claim once</strong> product. Private Gate is that surface. We consume the
            library; we do not reinvent credentials.
          </p>
          <p>
            The local path is complete for review. Devnet claim fails honestly until <code>gateZkApp</code> is set.
            Evidence slots below stay null until real Minascan hashes exist.
          </p>
          <p>
            <strong>End state this ask funds:</strong> a reviewer completes a real Devnet claim with a pinned Minascan
            hash in the evidence slots below — M1 verifies the presentation on-chain; M2 settles via funded escrow.
          </p>
        </section>

        <div className="doc-grid">
          <section className="panel prose">
            <h2>Milestones</h2>
            <ol>
              <li>
                <strong>M1 — $1,000</strong> — Auro presentation via mina-attestations, zkApp verify on Devnet.
              </li>
              <li>
                <strong>M2 — $1,000</strong> — Funded escrow, on-chain nullifier registry, integrator docs.
              </li>
            </ol>
            <p>
              See <Link to="/roadmap">Roadmap</Link> for shipped vs next.
            </p>
          </section>
          <section className="panel prose">
            <h2>What already exists</h2>
            <p>
              Operator workspace, bearer claim / refund links, destination-bound auth, nullifier double-claim, expiry
              refund, Status probes, Security checks, and this evidence surface.
            </p>
            <p>
              Start at <Link to="/app">App</Link>. Prefer Local mode for the complete walkthrough today.
            </p>
          </section>
        </div>

        <section className="panel">
          <h2>Evidence</h2>
          <dl className="facts">
            <div>
              <dt>Fund tx</dt>
              <dd className="mono">{OPERATOR_PROOF.fundTx || 'pending — set after first Devnet E2E'}</dd>
            </div>
            <div>
              <dt>Claim tx</dt>
              <dd className="mono">{OPERATOR_PROOF.claimTx || 'pending — set after first Devnet E2E'}</dd>
            </div>
            <div>
              <dt>Sample claim link</dt>
              <dd className="mono">{OPERATOR_PROOF.sampleClaimLink || 'not pinned yet'}</dd>
            </div>
            <div>
              <dt>Walkthrough</dt>
              <dd>{OPERATOR_PROOF.demoVideoUrl || 'not pinned yet'}</dd>
            </div>
            <div>
              <dt>Local evidence (this browser)</dt>
              <dd>
                {evidence.length} recorded action{evidence.length === 1 ? '' : 's'}
              </dd>
            </div>
          </dl>
          <div className="cta">
            <button type="button" className="btn primary" onClick={copyBlurb}>
              {copied ? 'Copied' : 'Copy evidence blurb'}
            </button>
            <Link className="btn ghost" to="/app">
              Open app
            </Link>
          </div>
        </section>

        <ReviewerKit />
      </div>
    </div>
  )
}
