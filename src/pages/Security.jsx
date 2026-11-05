import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SECURITY_CASES, runSecurityCase } from '../lib/securityChecks'

export default function Security() {
  const [results, setResults] = useState({})
  const [busy, setBusy] = useState(null)

  async function run(id) {
    setBusy(id)
    try {
      const r = await runSecurityCase(id)
      setResults((prev) => ({ ...prev, [id]: r }))
    } finally {
      setBusy(null)
    }
  }

  async function runAll() {
    const out = {}
    for (const c of SECURITY_CASES) {
      setBusy(c.id)
      out[c.id] = await runSecurityCase(c.id)
      setResults({ ...out })
    }
    setBusy(null)
  }

  const passed = Object.values(results).filter((r) => r?.pass).length
  const failed = Object.values(results).filter((r) => r && !r.pass).length

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Threat model</p>
        <h1>Security</h1>
        <p>
          Claim links embed a hash secret and assume a hostile network. The checks below exercise retarget resistance,
          bearer-link shape, double-claim, and expiry on an isolated ledger. Passing them is{' '}
          <strong>not an audit</strong>.
        </p>
      </header>

      <div className="page-rail">
        <article>
          <strong>Bearer links</strong>
          <p>Full <code>#/claim/…/secret</code> fragment is required — distribute like cash.</p>
        </article>
        <article>
          <strong>Destination-bound</strong>
          <p>Copied presentations cannot retarget payout to a different address.</p>
        </article>
        <article>
          <strong>One claim / drop</strong>
          <p>Local closes the drop after one success. Per-claimant nullifier sets are M2.</p>
        </article>
        <article>
          <strong>Runnable, not audited</strong>
          <p>
            {passed || failed
              ? `${passed} passed · ${failed} failed this session`
              : 'Run the suite before sharing review notes.'}
          </p>
        </article>
      </div>

      <div className="content-stack">
        <section className="panel prose">
          <h2>Invariants</h2>
          <ul>
            <li>
              Local: one claim per drop. Per-claimant nullifier registry is M2. A second claim is rejected after the drop
              closes.
            </li>
            <li>Claim auth is destination-bound — a copied presentation cannot retarget payout.</li>
            <li>Past expiry ⇒ claim refused; refund is the recovery path.</li>
            <li>
              Claim material lives in the URL hash as <code>#/claim/&#123;id&#125;/&#123;secret&#125;</code> — never query,
              never POST.
            </li>
            <li>Product is not audited. Local ledger state is browser storage.</li>
          </ul>
          <p>
            Full policy notes: <Link to="/docs">Docs</Link> · repository <code>SECURITY.md</code>.
          </p>
        </section>

        <div className="doc-grid">
          <section className="panel prose">
            <h2>Scope today</h2>
            <p>
              Local-path crypto uses SHA-256 bindings suitable for prototype verification. Production claims will use
              mina-attestations presentations and on-chain nullifiers (M1/M2). Do not confuse runnable UI checks with a
              third-party audit of either layer.
            </p>
          </section>
          <section className="panel prose">
            <h2>Assumptions</h2>
            <p>
              Operators protect refund links. Claimants verify the destination before signing. Reviewers do not paste
              bearer fragments into third-party tools. Devnet settlement remains pending until <code>gateZkApp</code>{' '}
              is live.
            </p>
          </section>
        </div>

        <div className="cta">
          <button type="button" className="btn primary" onClick={runAll} disabled={Boolean(busy)}>
            {busy ? `Running ${busy}…` : 'Run all checks'}
          </button>
          <Link className="btn ghost" to="/docs">
            Protocol glossary
          </Link>
        </div>

        <div className="check-list">
          {SECURITY_CASES.map((c) => {
            const r = results[c.id]
            return (
              <article key={c.id} className="panel">
                <h2>{c.title}</h2>
                <p className="hint">{c.body}</p>
                <div className="cta">
                  <button type="button" className="btn ghost" disabled={busy === c.id} onClick={() => run(c.id)}>
                    {busy === c.id ? 'Running…' : 'Run'}
                  </button>
                  {r ? (
                    <span className={`pill ${r.pass ? 'open' : 'expired'}`}>{r.pass ? 'pass' : 'fail'}</span>
                  ) : null}
                </div>
                {r?.detail ? <p className="hint mono small">{r.detail}</p> : null}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
