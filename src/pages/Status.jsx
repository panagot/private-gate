import { Link } from 'react-router-dom'
import { useNetwork } from '../components/NetworkContext'
import { NETWORKS } from '../config/networks'

export default function Status() {
  const { health, probing, refreshHealth, probeHistory, setNetworkId, networkId } = useNetwork()

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Network</p>
        <h1>Status</h1>
        <p>
          Use this page to confirm Mina Devnet GraphQL answers before attempting wallet flows. Local mode needs no
          probes. A green probe means the network answers — it does <strong>not</strong> mean this UI can fund or settle
          a claim until <code>gateZkApp</code> is configured.
        </p>
      </header>

      <div className="page-rail">
        <article>
          <strong>Local</strong>
          <p>No chain calls. Full create → claim → refund path for UX review.</p>
        </article>
        <article>
          <strong>Devnet GraphQL</strong>
          <p>{health?.ok ? `Reachable · h${health.blockHeight ?? '—'}` : 'Probe to confirm the endpoint answers.'}</p>
        </article>
        <article>
          <strong>zkApp</strong>
          <p>{NETWORKS.mina.gateZkApp ? 'Configured in networks.js' : 'Pending M1 deploy — claims fail honestly.'}</p>
        </article>
        <article>
          <strong>Read this as</strong>
          <p>Infrastructure signal, not a settlement guarantee or uptime SLA.</p>
        </article>
      </div>

      <div className="content-stack">
        <section className="panel prose">
          <h2>How to read this page</h2>
          <p>
            <strong>Reachable</strong> means the pinned Devnet GraphQL endpoint returned a block height. That is useful
            for reviewers checking network posture before attempting wallet flows.
          </p>
          <p>
            <strong>Claimable on Devnet</strong> needs <code>gateZkApp</code> (M1 verify) plus wallet presentation.{' '}
            <strong>Funded settlement</strong> is M2 escrow. Until those land, keep Local for the complete walkthrough.
          </p>
        </section>

        <div className="cta">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setNetworkId('mina')
              refreshHealth()
            }}
            disabled={probing}
          >
            {probing ? 'Probing…' : 'Probe Devnet'}
          </button>
          {networkId !== 'mina' ? <span className="hint">Switches to Devnet for this probe.</span> : null}
          <Link className="btn ghost" to="/roadmap">
            Milestone map
          </Link>
        </div>

        <section className="panel">
          <div className="status-theater">
            <span className={`pulse-dot ${health?.ok ? 'on' : ''}`} />
            <strong>{probing ? 'Checking…' : health?.ok ? 'Reachable' : health ? 'Issue' : 'Not probed'}</strong>
          </div>
          <dl className="facts">
            <div>
              <dt>GraphQL endpoint</dt>
              <dd className="mono small">{NETWORKS.mina.graphqlUrl}</dd>
            </div>
            <div>
              <dt>GraphQL</dt>
              <dd>{health?.graphqlOk ? 'ok' : health ? 'fail' : '—'}</dd>
            </div>
            <div>
              <dt>Block height</dt>
              <dd className="mono">{health?.blockHeight ?? '—'}</dd>
            </div>
            <div>
              <dt>Latency</dt>
              <dd>{health?.ms != null ? `${health.ms} ms` : '—'}</dd>
            </div>
            <div>
              <dt>zkApp configured</dt>
              <dd>{NETWORKS.mina.gateZkApp ? 'yes' : 'no — pending M1 deploy'}</dd>
            </div>
            <div>
              <dt>zkApp reachable</dt>
              <dd>
                {NETWORKS.mina.gateZkApp ? (health?.zkAppReachable ? 'yes' : health ? 'no' : '—') : 'n/a'}
              </dd>
            </div>
            <div>
              <dt>Explorer</dt>
              <dd>
                <a href={NETWORKS.mina.explorer} target="_blank" rel="noreferrer">
                  {NETWORKS.mina.explorer}
                </a>
              </dd>
            </div>
            <div>
              <dt>Error</dt>
              <dd>{health?.error || '—'}</dd>
            </div>
          </dl>
          <p className="hint">
            <strong>reachable</strong> — GraphQL answers · <strong>fundable</strong> — zkApp set + wallet on Devnet ·{' '}
            <strong>attestation path</strong> — mina-attestations wired (M1). See <Link to="/roadmap">Roadmap</Link>.
          </p>
        </section>

        <section className="panel">
          <h2>Session history</h2>
          <p className="hint">Probes from this browser session only. Not a public uptime product.</p>
          {probeHistory.length === 0 ? (
            <p className="empty">No probes yet.</p>
          ) : (
            <ul className="probe-list">
              {probeHistory.slice(0, 12).map((p, i) => (
                <li key={`${p.t}-${i}`}>
                  <span className={`cap-dot ${p.ok ? 'ready' : 'next'}`} />
                  {new Date(p.t).toLocaleTimeString()} · {p.ok ? 'ok' : 'fail'} · {p.ms ?? '—'} ms · h
                  {p.height ?? '—'}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
