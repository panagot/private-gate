import { NavLink, Outlet } from 'react-router-dom'
import { useNetwork } from './NetworkContext'
import WalletButton from './WalletButton'

const NAV = [
  { to: '/', end: true, label: 'Overview' },
  { to: '/app', label: 'App' },
  { to: '/docs', label: 'Docs' },
  { to: '/security', label: 'Security' },
  { to: '/status', label: 'Status' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/seed', label: 'Ask' },
]

export default function Layout() {
  const { networkId, setNetworkId, network, health, probing, networks } = useNetwork()

  return (
    <div className="shell">
      <div className="paper-noise" aria-hidden="true" />
      <header className="top">
        <div className="shell-inner header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-text">
              <strong>Private Gate</strong>
              <em>Mina</em>
            </span>
          </NavLink>
          <nav className="nav" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'on' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-tools">
            <div className="net-cluster">
              <select
                className="net-select"
                value={networkId}
                onChange={(e) => setNetworkId(e.target.value)}
                aria-label="Network"
                title={network.description}
              >
                {Object.values(networks).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.short}
                  </option>
                ))}
              </select>
              <span
                className={`net-pill ${network.live ? (health?.ok ? 'live' : probing ? 'wait' : 'down') : 'demo'}`}
                title={
                  network.live
                    ? health?.ok
                      ? 'Devnet GraphQL reachable'
                      : probing
                        ? 'Probe in flight'
                        : 'Probe failed — open Status'
                    : 'Local ledger — no chain calls'
                }
              >
                {network.live ? (probing ? 'checking' : health?.ok ? 'devnet live' : 'devnet issue') : 'local'}
              </span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="foot site-footer">
        <div className="shell-inner footer-inner">
          <div className="footer-grid">
            <div className="footer-brand-block">
              <strong>Private Gate</strong>
              <p>
                Attestation-gated claim drops for Mina operators. Prove a private fact, claim once — without collecting
                raw PII.
              </p>
            </div>
            <div>
              <h3>Product</h3>
              <NavLink to="/app">App</NavLink>
              <NavLink to="/status">Status</NavLink>
              <NavLink to="/seed">Exploration ask</NavLink>
            </div>
            <div>
              <h3>Reference</h3>
              <NavLink to="/docs">Protocol</NavLink>
              <NavLink to="/security">Threat model</NavLink>
              <a href="https://github.com/zksecurity/mina-attestations" target="_blank" rel="noreferrer">
                mina-attestations
              </a>
            </div>
            <div>
              <h3>Honesty</h3>
              <p className="footer-note">
                Not audited. Local ledger ships the full claim path. M1: zkApp verify via <code>gateZkApp</code>. M2:
                funded escrow. Consumes audited attestations. Claim links embed a hash secret — treat as cash.
              </p>
            </div>
          </div>
          <div className="footer-base">
            <span>Private Gate · Mina Protocol</span>
            <span>Credit · zkSecurity mina-attestations</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
