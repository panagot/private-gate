import { switchWalletToDevnet, WALLET_INSTALLS } from '../lib/wallet'
import { useNetwork } from './NetworkContext'
import { useWallet } from './WalletContext'

function shortAddr(a) {
  if (!a) return ''
  if (a.length <= 12) return a
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

export default function WalletButton() {
  const { address, status, isDevnet, hasWallet, errorCode, connect, disconnect, error } = useWallet()
  const { network } = useNetwork()
  const wrongNet = network.live && address && isDevnet === false
  const noWallet = errorCode === 'NO_WALLET' || (status === 'error' && !hasWallet)

  if (status === 'connected' && address) {
    return (
      <div className="wallet-cluster">
        {wrongNet ? (
          <button
            type="button"
            className="wallet-warn"
            onClick={() => switchWalletToDevnet().catch(() => {})}
            title="Wallet is not on Mina Devnet. Click to switch."
          >
            Wrong network
          </button>
        ) : null}
        <span className="wallet-pill on" title="Connected wallet">
          <span className={`wallet-dot ${wrongNet ? 'warn' : ''}`} />
          {shortAddr(address)}
        </span>
        <button type="button" className="wallet-signout" onClick={disconnect} title="Sign out">
          Sign out
        </button>
      </div>
    )
  }

  if (noWallet) {
    return (
      <div className="wallet-cluster wallet-install">
        <span className="wallet-install-label">No wallet. Install:</span>
        {WALLET_INSTALLS.map((w) => (
          <a key={w.id} href={w.url} target="_blank" rel="noreferrer" className="wallet-chip">
            {w.label}
          </a>
        ))}
        <button type="button" className="kit-link" onClick={() => connect().catch(() => {})}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-cluster">
      <button
        type="button"
        className="wallet-pill"
        onClick={() => connect().catch(() => {})}
        disabled={status === 'connecting'}
        title={status === 'error' && error ? error : 'Connect Auro Wallet'}
      >
        {status === 'connecting' ? 'Connecting…' : status === 'error' ? 'Retry connect' : 'Connect wallet'}
      </button>
      {status === 'error' && error ? (
        <span className="wallet-err" title={error}>
          {error}
        </span>
      ) : null}
    </div>
  )
}
