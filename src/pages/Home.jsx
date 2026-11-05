import { Link, useNavigate } from 'react-router-dom'
import GateFigure from '../components/GateFigure'
import { useNetwork } from '../components/NetworkContext'
import { encodeClaimLink } from '../lib/crypto'
import { dropStatus, listDrops } from '../lib/store'

const CAPABILITIES = [
  {
    label: 'Create gate → present → claim once',
    detail: 'Full operator path in the local ledger, including shareable claim and refund links.',
    state: 'ready',
    tag: 'shipped',
  },
  {
    label: 'Nullifier + destination-bound auth',
    detail: 'One claim per drop. Nullifier binds the claimant; authorization commits to the payout address.',
    state: 'ready',
    tag: 'shipped',
  },
  {
    label: 'Expiry + refund',
    detail: 'Unclaimed value recovers after expiry. Claim is refused once the gate lapses.',
    state: 'ready',
    tag: 'shipped',
  },
  {
    label: 'Auro wallet connect',
    detail: 'Destination autofill and Devnet readiness. No private keys leave the wallet.',
    state: 'ready',
    tag: 'shipped',
  },
  {
    label: 'mina-attestations presentation + zkApp verify',
    detail: 'Wallet-held credential → PresentationRequest → Devnet zkApp verify. Replaces the local credential panel.',
    state: 'partial',
    tag: 'M1 · $1k',
  },
  {
    label: 'Funded escrow + nullifier registry',
    detail: 'On-chain drop escrow and nullifier set so verified claims settle once. Then mainnet readiness.',
    state: 'next',
    tag: 'M2 · $1k',
  },
]

const USE_CASES = [
  {
    k: 'Community rewards',
    v: 'Age- or jurisdiction-gate a drop without collecting passports or selfies.',
  },
  {
    k: 'Contributor allowlists',
    v: 'Prove an email domain or membership credential, then claim a grant tranche once.',
  },
  {
    k: 'Sybil-resistant tips',
    v: 'One claim per drop. A spent nullifier blocks a second payout without revealing other claimants.',
  },
  {
    k: 'Compliance-shaped drops',
    v: 'Non-US (or similar) checks without revealing nationality to the operator.',
  },
]

const INVARIANTS = [
  'Selective disclosure — only the gate predicate is proven.',
  'Nullifier — one claim per drop; the spent nullifier blocks a second payout.',
  'Destination-bound auth — a copied presentation cannot retarget payout.',
  'Expiry — past the deadline, claim fails and refund opens.',
  'Hash-only links — claim material never sits in the query string.',
]

export default function Home() {
  const { setNetworkId, health } = useNetwork()
  const navigate = useNavigate()
  const drops = listDrops().slice(0, 5)

  const openLocal = () => {
    setNetworkId('demo')
    navigate('/app')
  }
  const openDevnet = () => {
    setNetworkId('mina')
    navigate('/app')
  }

  return (
    <div className="page home">
      <section className="hero-stage">
        <div className="hero-copy">
          <p className="eyebrow rise">Attestation-gated claims · Mina</p>
          <h1 className="rise delay-1">Private Gate</h1>
          <p className="lede rise delay-2">
            Prove a private fact without revealing the credential. Claim a reward once. Built for operators who need
            sybil-resistant drops — not another identity library.
          </p>
          <div className="cta rise delay-3">
            <button type="button" className="btn primary" onClick={openLocal}>
              Open app
            </button>
            <button type="button" className="btn ghost" onClick={openDevnet}>
              Devnet mode
            </button>
            <Link className="hero-text-link" to="/seed">
              Exploration ask →
            </Link>
          </div>
          <p className="honest rise delay-4">
            Local ledger runs the full claim path today. On-chain path:{' '}
            <code>mina-attestations</code> → zkApp verify → payout.
            {health?.ok ? ' Devnet GraphQL is reachable.' : ''}
          </p>
          <div className="hero-meta rise delay-4">
            <span>
              <strong>Consumes</strong> mina-attestations
            </span>
            <span>
              <strong>Wallet</strong> Auro only
            </span>
            <span>
              <strong>Ask</strong> $2k Exploration
            </span>
          </div>
        </div>
        <GateFigure />
      </section>

      <aside className="path-banner panel">
        <div>
          <p className="eyebrow">Reviewer path</p>
          <strong>New here?</strong>
          <p>
            App → create a gate → open as recipient → issue credential → Present & claim → retry (must fail) → Security
            → Run all.
          </p>
        </div>
        <Link className="btn primary tiny" to="/app">
          Start in App →
        </Link>
      </aside>

      <section className="section gap">
        <div className="section-head">
          <p className="eyebrow">The gap</p>
          <h2>Audited attestations shipped. The operator drop product did not.</h2>
          <p className="section-lede">
            Mina already has the credential stack. What operators still lack is a standard surface to fund a gated
            reward, collect a private proof, and pay out exactly once.
          </p>
        </div>
        <div className="gap-grid">
          <article className="gap-card bad">
            <span className="gap-tag">Without Private Gate</span>
            <ol>
              <li>A wallet can hold a mina-attestations credential.</li>
              <li>There is no standard create-gate → prove → claim-once surface.</li>
              <li>
                <strong>Operators invent one-offs — or collect PII.</strong>
              </li>
            </ol>
          </article>
          <article className="gap-card good">
            <span className="gap-tag">With Private Gate</span>
            <ol>
              <li>Operator stamps a rule, amount, and expiry.</li>
              <li>Claimant presents only what the gate needs.</li>
              <li>
                <strong>Nullifier spends the slot. Destination-bound. Refund after expiry.</strong>
              </li>
            </ol>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Flow</p>
          <h2>Three steps. One spent nullifier.</h2>
        </div>
        <div className="strip">
          <article>
            <h2>1. Gate</h2>
            <p>
              Set the predicate — age 18+, non-US, email domain — plus reward amount and expiry. Share the bearer claim
              link (hash includes a secret); keep the refund link offline.
            </p>
          </article>
          <article>
            <h2>2. Present</h2>
            <p>
              The claimant proves only what the gate needs. Raw passport data, full email, or nationality stay with the
              credential holder.
            </p>
          </article>
          <article>
            <h2>3. Claim once</h2>
            <p>
              Nullifier spends the slot for that owner. Destination-bound auth blocks retarget if a presentation is
              copied from the wire.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Proofs</p>
          <h2>Local rehearses. M1 settles on Mina.</h2>
          <p className="section-lede">
            Reviewers often ask how Age 18+ / Non-US / email domain get proven. Same gate either way — different credential
            source.
          </p>
        </div>
        <div className="gap-grid">
          <article className="gap-card">
            <span className="gap-tag">Local · now</span>
            <ol>
              <li>Issue a browser credential (type age, nationality, email).</li>
              <li>Present & claim checks the gate in-app.</li>
              <li>
                Only the statement is recorded (e.g. <code>age ≥ 18</code>) — not the raw fields.
              </li>
            </ol>
          </article>
          <article className="gap-card good">
            <span className="gap-tag">M1–M2 · Exploration $2k</span>
            <ol>
              <li>Issuer puts a real credential in Auro via mina-attestations.</li>
              <li>M1 — Private Gate asks for a PresentationRequest; zkApp verifies. PII stays in the wallet.</li>
              <li>M2 — Funded escrow + on-chain nullifier registry settle the payout once.</li>
            </ol>
          </article>
        </div>
        <p className="hint" style={{ marginTop: '1rem' }}>
          Per-rule Local vs M1 walkthrough: <Link to="/docs#proofs">Docs → How proofs work</Link> · try it in{' '}
          <Link to="/app">App</Link>.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Capability</p>
          <h2>What ships today vs what Exploration funds</h2>
          <p className="section-lede">
            Honest dual path: the local ledger is complete for review. Devnet claim activates when{' '}
            <code>gateZkApp</code> is set — it fails clearly until then.
          </p>
        </div>
        <ul className="cap-list dense">
          {CAPABILITIES.map((c) => (
            <li key={c.label}>
              <span className={`cap-dot ${c.state}`} />
              <div>
                <strong>{c.label}</strong>
                <p>{c.detail}</p>
              </div>
              <em>{c.tag}</em>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Operators</p>
          <h2>Who it is for</h2>
        </div>
        <div className="use-row">
          {USE_CASES.map((u) => (
            <article key={u.k}>
              <strong>{u.k}</strong>
              <p>{u.v}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section invariants">
        <div className="section-head">
          <p className="eyebrow">Invariants</p>
          <h2>What every claim must satisfy</h2>
        </div>
        <ul className="invariant-list">
          {INVARIANTS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="hint">
          Runnable checks live on <Link to="/security">Security</Link>. Passing them is not an audit.
        </p>
      </section>

      <section className="recent section">
        <div className="section-head row">
          <div>
            <p className="eyebrow">Activity</p>
            <h2>Recent gates</h2>
          </div>
          <Link className="btn ghost tiny" to="/app">
            Create gate
          </Link>
        </div>
        {drops.length === 0 ? (
          <p className="empty">No gates in this browser yet. Create one to walk create → present → claim → refund.</p>
        ) : (
          <ul className="drop-list">
            {drops.map((d) => (
              <li key={d.id}>
                <div>
                  <strong>{d.title}</strong>
                  <span>
                    {d.ruleLabel} · {d.amount} {d.unit} ·{' '}
                    <span className={`pill ${dropStatus(d)}`}>{dropStatus(d)}</span>
                  </span>
                </div>
                {d.claimSecret ? (
                  <a className="btn tiny" href={encodeClaimLink(window.location.origin, { dropId: d.id, claimSecret: d.claimSecret })}>
                    Claim
                  </a>
                ) : (
                  <Link className="btn tiny" to="/app">
                    Open app
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
