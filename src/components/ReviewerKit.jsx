import { Link } from 'react-router-dom'
import { OPERATOR_PROOF } from '../config/operatorProof'
import { NETWORKS } from '../config/networks'
import { WALLET_INSTALLS } from '../lib/wallet'

export default function ReviewerKit() {
  const faucets = NETWORKS.mina.faucets
  return (
    <div className="panel reviewer-kit">
      <h2>How to verify</h2>
      <ol className="kit-steps">
        <li>
          Optional wallet:{' '}
          {WALLET_INSTALLS.map((w, i) => (
            <span key={w.id}>
              {i > 0 ? ' · ' : ''}
              <a href={w.url} target="_blank" rel="noreferrer">
                {w.label}
              </a>
            </span>
          ))}
          . Connect from the header for destination autofill.
        </li>
        <li>
          Local path needs no faucet. Devnet later:{' '}
          {faucets.map((f, i) => (
            <span key={f.url}>
              {i > 0 ? ' · ' : ''}
              <a href={f.url} target="_blank" rel="noreferrer">
                {f.label}
              </a>
            </span>
          ))}
        </li>
        <li>
          In <Link to="/app">App</Link>: Create → issue credential → Present & claim → retry (must fail). Then run{' '}
          <Link to="/security">Security</Link> checks.
        </li>
        {OPERATOR_PROOF.sampleClaimLink ? (
          <li>
            Sample claim:{' '}
            <a href={OPERATOR_PROOF.sampleClaimLink} className="mono">
              open pre-funded link
            </a>
          </li>
        ) : (
          <li>Sample claim link will be pinned after the first Devnet E2E.</li>
        )}
      </ol>
    </div>
  )
}
