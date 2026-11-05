import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useNetwork } from '../components/NetworkContext'
import { useWallet } from '../components/WalletContext'
import { presentForDrop, claimWithPresentation } from '../lib/attestations'
import { encodeClaimLink, encodeRefundLink, parseClaimHash, parseRefundHash, randomId } from '../lib/crypto'
import { recordEvidence } from '../lib/evidence'
import { RULES, getRule } from '../lib/rules'
import {
  createDrop,
  dropStatus,
  getCredential,
  getDrop,
  issueDemoCredential,
  listDrops,
  markRefunded,
} from '../lib/store'
import { formatWalletError } from '../lib/wallet'

function appBaseUrl() {
  return `${window.location.origin}${window.location.pathname.replace(/\/app.*/, '') || ''}`.replace(/\/$/, '') || window.location.origin
}

export default function Workspace() {
  const { network, setNetworkId } = useNetwork()
  const location = useLocation()
  const [tab, setTab] = useState('create')
  const [flash, setFlash] = useState(null)
  const [tick, setTick] = useState(0)

  const show = (kind, text) => {
    setFlash({ kind, text })
    window.setTimeout(() => setFlash(null), 7000)
  }

  const refresh = () => setTick((t) => t + 1)

  useEffect(() => {
    const claim = parseClaimHash(window.location.hash)
    const refund = parseRefundHash(window.location.hash)
    if (claim) setTab('claim')
    else if (refund) setTab('refund')
    else if (location.pathname.includes('claim')) setTab('claim')
  }, [location])

  const openAsRecipient = (claimLink) => {
    try {
      const url = new URL(claimLink)
      window.history.replaceState(null, '', `${url.pathname}${url.hash}`)
      setTab('claim')
      refresh()
      show('ok', 'Opened as recipient — present & claim below.')
    } catch {
      window.open(claimLink, '_blank', 'noopener')
    }
  }

  return (
    <div className="page workspace">
      <header className="page-head">
        <p className="eyebrow">Operator</p>
        <h1>Create · Claim · Refund</h1>
        <p>
          {network.live
            ? 'Devnet mode — wallet connect and Status probes work now. On-chain claim waits for gateZkApp (M1). Switch to Local to exercise the full create → present → claim → refund path.'
            : 'Local ledger — stamp a gate, attach a credential, present a selective disclosure, claim once with a destination-bound nullifier, refund after expiry. All in this browser.'}
        </p>
      </header>

      <aside className="path-banner panel">
        <div>
          <p className="eyebrow">How proofs work</p>
          <strong>Local today rehearses M1 tomorrow</strong>
          <p>
            Same gate rules either way. Local uses a browser credential stand-in so you can pass/fail Age 18+, Non-US, or
            email domain without a faucet. M1 swaps that stand-in for a real Auro + mina-attestations presentation verified
            by a zkApp — raw PII stays in the wallet.
          </p>
        </div>
        <Link className="btn ghost tiny" to="/docs#proofs">
          Full Local vs M1 →
        </Link>
      </aside>

      {flash ? <div className={`flash ${flash.kind}`}>{flash.text}</div> : null}

      <div className="ws-tabs">
        {[
          ['create', 'Create'],
          ['claim', 'Claim'],
          ['refund', 'Refund'],
          ['ledger', 'Ledger'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`ws-tab ${tab === id ? 'on' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        {!network.live ? (
          <button type="button" className="ws-tab ghost" onClick={() => setNetworkId('mina')}>
            Devnet
          </button>
        ) : (
          <button type="button" className="ws-tab ghost" onClick={() => setNetworkId('demo')}>
            Local
          </button>
        )}
      </div>

      {tab === 'create' ? (
        <CreatePanel onFlash={show} onOpenAsRecipient={openAsRecipient} onDone={refresh} />
      ) : null}
      {tab === 'claim' ? <ClaimPanel onFlash={show} tick={tick} onDone={refresh} /> : null}
      {tab === 'refund' ? <RefundPanel onFlash={show} onDone={refresh} /> : null}
      {tab === 'ledger' ? <LedgerPanel tick={tick} /> : null}
    </div>
  )
}

function CreatePanel({ onFlash, onOpenAsRecipient, onDone }) {
  const [title, setTitle] = useState('Community reward')
  const [amount, setAmount] = useState('1')
  const [ruleId, setRuleId] = useState(RULES[0].id)
  const [note, setNote] = useState('')
  const [expiryHours, setExpiryHours] = useState('72')
  const [created, setCreated] = useState(null)
  const [cashAck, setCashAck] = useState(false)
  const [backedUp, setBackedUp] = useState(false)
  const [busy, setBusy] = useState(false)

  function onSubmit(e) {
    e.preventDefault()
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      onFlash('err', 'Amount must be a positive number.')
      return
    }
    setBusy(true)
    try {
      const drop = createDrop({ title, amount, ruleId, note, expiryHours })
      const base = appBaseUrl()
      const claimLink = encodeClaimLink(base, { dropId: drop.id, claimSecret: drop.claimSecret })
      const refundLink = encodeRefundLink(base, drop.id)
      setCreated({ drop, claimLink, refundLink })
      setCashAck(false)
      setBackedUp(false)
      recordEvidence({ kind: 'create', dropId: drop.id, amount: drop.amount })
      onFlash('ok', 'Gate created. Back up the refund link before sharing the claim link.')
      onDone?.()
    } finally {
      setBusy(false)
    }
  }

  async function copy(text, label) {
    if (!cashAck && label === 'claim') {
      onFlash('err', 'Confirm the bearer-cash warning before copying the claim link.')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      onFlash('ok', `${label === 'claim' ? 'Claim' : 'Refund'} link copied.`)
    } catch {
      onFlash('err', 'Clipboard blocked — select the link and copy manually.')
    }
  }

  function downloadBackup() {
    if (!created) return
    const blob = new Blob(
      [
        JSON.stringify(
          {
            dropId: created.drop.id,
            title: created.drop.title,
            amount: created.drop.amount,
            rule: created.drop.ruleLabel,
            expiresAt: created.drop.expiresAt,
            claimLink: created.claimLink,
            refundLink: created.refundLink,
            note: 'Private Gate backup — treat claim link as cash.',
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `private-gate-${created.drop.id}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setBackedUp(true)
    onFlash('ok', 'Backup JSON downloaded.')
  }

  if (created) {
    return (
      <div className="panel success-panel">
        <h2>Gate ready</h2>
        <p>
          <strong>{created.drop.title}</strong> — {created.drop.ruleLabel} · {created.drop.amount}{' '}
          {created.drop.unit}
        </p>
        <p className="mono small">{created.drop.id}</p>
        <p className="hint">
          Expires {new Date(created.drop.expiresAt).toLocaleString()} · status{' '}
          <span className={`pill ${dropStatus(created.drop)}`}>{dropStatus(created.drop)}</span>
        </p>

        <label className="check-row">
          <input type="checkbox" checked={cashAck} onChange={(e) => setCashAck(e.target.checked)} />
          <span>
            I understand the claim link embeds a secret in the URL hash — anyone with the full link can attempt a claim.
          </span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={backedUp} onChange={(e) => setBackedUp(e.target.checked)} />
          <span>I backed up the refund link (or downloaded JSON) before sharing.</span>
        </label>

        <div className="link-rows">
          <div>
            <span className="eyebrow">Claim link</span>
            <code className="link-box">{created.claimLink}</code>
            <div className="cta">
              <button type="button" className="btn primary" disabled={!cashAck} onClick={() => copy(created.claimLink, 'claim')}>
                Copy claim link
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={!backedUp}
                onClick={() => onOpenAsRecipient(created.claimLink)}
              >
                Open as recipient
              </button>
            </div>
          </div>
          <div>
            <span className="eyebrow">Refund link</span>
            <code className="link-box">{created.refundLink}</code>
            <div className="cta">
              <button type="button" className="btn ghost" onClick={() => copy(created.refundLink, 'refund')}>
                Copy refund link
              </button>
              <button type="button" className="btn ghost" onClick={downloadBackup}>
                Download backup JSON
              </button>
            </div>
          </div>
        </div>

        <div className="cta">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setCreated(null)
              onDone?.()
            }}
          >
            Create another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="panel form narrow-form" onSubmit={onSubmit}>
      <label>
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} />
      </label>
      <label>
        <span>Amount (MINA)</span>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
      <label>
        <span>Expiry (hours)</span>
        <input value={expiryHours} onChange={(e) => setExpiryHours(e.target.value)} required />
      </label>
      <fieldset>
        <legend>Gate rule</legend>
        <div className="rule-grid">
          {RULES.map((r) => (
            <label key={r.id} className={`rule-card ${ruleId === r.id ? 'on' : ''}`}>
              <input type="radio" name="rule" value={r.id} checked={ruleId === r.id} onChange={() => setRuleId(r.id)} />
              <strong>{r.label}</strong>
              <span>{r.description}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <RulePathExplain rule={getRule(ruleId)} />
      <label>
        <span>Note (optional)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={240} />
      </label>
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? 'Creating…' : 'Create gate'}
      </button>
      <p className="hint">
        Local mode stores the gate in this browser. M1 verifies presentations on-chain; M2 funds escrow settlement.
      </p>
    </form>
  )
}

function RulePathExplain({ rule }) {
  if (!rule) return null
  return (
    <div className="rule-path">
      <div className="rule-path-cols">
        <article>
          <span className="gap-tag">Local (now)</span>
          <p>{rule.localHow}</p>
        </article>
        <article>
          <span className="gap-tag">M1 (funded)</span>
          <p>{rule.m1How}</p>
        </article>
      </div>
      <p className="hint">
        Operator sees: <strong>{rule.reveals}</strong> · Stays private: <strong>{rule.hides}</strong>
      </p>
    </div>
  )
}

function ClaimPanel({ onFlash, tick, onDone }) {
  const { address, connect, status: walletStatus } = useWallet()
  const { network } = useNetwork()
  const drops = useMemo(() => listDrops(), [tick])
  const hashClaim = parseClaimHash(typeof window !== 'undefined' ? window.location.hash : '')
  const [dropId, setDropId] = useState(hashClaim?.dropId || drops[0]?.id || '')
  const [linkSecret, setLinkSecret] = useState(hashClaim?.claimSecret || '')
  const [ownerId, setOwnerId] = useState(() => localStorage.getItem('pg:owner') || randomId('owner'))
  const [destination, setDestination] = useState('')
  const [credForm, setCredForm] = useState({ age: '21', nationality: 'Greece', email: 'builder@mina.local' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (hashClaim?.dropId) setDropId(hashClaim.dropId)
    if (hashClaim?.claimSecret) setLinkSecret(hashClaim.claimSecret)
  }, [hashClaim?.dropId, hashClaim?.claimSecret])

  useEffect(() => {
    if (address) setDestination(address)
  }, [address])

  const drop = dropId ? getDrop(dropId) : null
  const cred = getCredential()
  const rule = drop ? getRule(drop.ruleId) : null
  const st = drop ? dropStatus(drop) : 'missing'
  /** Same-browser operators still hold claimSecret on the drop; external claimants need the bearer link. */
  const claimSecret = linkSecret || drop?.claimSecret || ''
  const canClaim = st === 'open' && Boolean(claimSecret)

  function persistOwner(id) {
    setOwnerId(id)
    localStorage.setItem('pg:owner', id)
  }

  function onIssue(e) {
    e.preventDefault()
    issueDemoCredential({
      age: Number(credForm.age),
      nationality: credForm.nationality,
      email: credForm.email,
    })
    onFlash('ok', 'Credential attached for this browser session.')
    onDone?.()
  }

  async function onClaim(e) {
    e.preventDefault()
    if (!drop) return
    if (!canClaim) {
      onFlash('err', st !== 'open' ? `Cannot claim: status is ${st}` : 'Missing claim secret — open the bearer claim link.')
      return
    }
    if (network.live) {
      onFlash('err', formatWalletError({ code: 'ZKAPP_PENDING' }))
      return
    }
    setBusy(true)
    try {
      const dest = destination.trim() || address
      const presentation = await presentForDrop(drop, ownerId, dest, claimSecret)
      if (!presentation.ok) {
        onFlash('err', presentation.error)
        return
      }
      const claim = await claimWithPresentation(drop, presentation)
      recordEvidence({
        kind: 'claim',
        dropId: drop.id,
        nullifier: claim.nullifier,
        destination: claim.destination,
      })
      onFlash(
        'ok',
        `Claimed ${drop.amount} ${drop.unit} → ${claim.destination.slice(0, 10)}… · nullifier ${claim.nullifier.slice(0, 12)}…`,
      )
      onDone?.()
    } catch (err) {
      onFlash('err', formatWalletError(err))
    } finally {
      setBusy(false)
    }
  }

  if (drops.length === 0) {
    return (
      <div className="panel">
        <p>No gates yet.</p>
        <Link className="btn primary" to="/app">
          Create one
        </Link>
      </div>
    )
  }

  return (
    <div className="claim-grid">
      <form className="panel form" onSubmit={onClaim}>
        <label>
          <span>Drop</span>
          <select value={dropId} onChange={(e) => setDropId(e.target.value)}>
            {drops.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} — {d.ruleLabel} ({dropStatus(d)})
              </option>
            ))}
          </select>
        </label>
        {drop && rule ? (
          <div className="gate-summary">
            <strong>{drop.title}</strong>
            <span>
              {rule.short} · {drop.amount} {drop.unit} ·{' '}
              <span className={`pill ${st}`}>{st}</span>
            </span>
          </div>
        ) : null}

        {rule ? <RulePathExplain rule={rule} /> : null}

        {st === 'open' && !claimSecret ? (
          <div className="status err">
            <p>
              Missing claim secret. Use <strong>Open as recipient</strong> from Create (link includes{' '}
              <code>#/claim/…/secret</code>), or create the gate in this browser.
            </p>
          </div>
        ) : null}

        {st !== 'open' ? (
          <div className={`status ${st === 'claimed' ? 'info' : 'err'}`}>
            <p>
              {st === 'claimed' && 'Already claimed — drop closed. Local: one claim per drop; per-claimant nullifier sets are M2.'}
              {st === 'refunded' && 'Refunded — no claim available.'}
              {st === 'expired' && 'Expired — use the Refund tab.'}
              {st === 'missing' && 'Drop missing.'}
            </p>
          </div>
        ) : null}

        <label>
          <span>Owner id (nullifier seed)</span>
          <input value={ownerId} onChange={(e) => persistOwner(e.target.value)} />
        </label>
        <label>
          <span>Destination (Mina address)</span>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={address || 'B62… or connect wallet'}
            required
          />
        </label>
        {!address ? (
          <button
            type="button"
            className="btn ghost"
            onClick={() => connect().catch((e) => onFlash('err', formatWalletError(e)))}
            disabled={walletStatus === 'connecting'}
          >
            {walletStatus === 'connecting' ? 'Connecting…' : 'Connect wallet for destination'}
          </button>
        ) : null}
        <button type="submit" className="btn primary" disabled={busy || !canClaim}>
          {busy ? 'Presenting…' : 'Present & claim'}
        </button>
      </form>

      <form className="panel form" onSubmit={onIssue}>
        <h2>Local credential</h2>
        <p className="hint">
          <strong>Stand-in only.</strong> Today you type fields here and the app checks the gate in-browser. In M1 this
          panel goes away: Auro holds a real mina-attestations credential and answers a PresentationRequest — you never
          paste age / nationality / email into Private Gate.
        </p>
        <label>
          <span>Age</span>
          <input value={credForm.age} onChange={(e) => setCredForm({ ...credForm, age: e.target.value })} />
        </label>
        <label>
          <span>Nationality</span>
          <input
            value={credForm.nationality}
            onChange={(e) => setCredForm({ ...credForm, nationality: e.target.value })}
          />
        </label>
        <label>
          <span>Email</span>
          <input value={credForm.email} onChange={(e) => setCredForm({ ...credForm, email: e.target.value })} />
        </label>
        <button type="submit" className="btn ghost">
          Issue / refresh credential
        </button>
        {cred ? (
          <p className="mono small">
            Held: age {cred.age} · {cred.nationality} · {cred.email}
          </p>
        ) : (
          <p className="hint">No credential yet — issue one, then Present & claim.</p>
        )}
        <p className="hint">
          Tip: set age <code>16</code> to fail Age 18+, nationality <code>United States</code> to fail Non-US, or email{' '}
          <code>you@gmail.com</code> to fail the domain gate.
        </p>
      </form>
    </div>
  )
}

function RefundPanel({ onFlash, onDone }) {
  const drops = listDrops()
  const hashRefund = parseRefundHash(typeof window !== 'undefined' ? window.location.hash : '')
  const [dropId, setDropId] = useState(hashRefund?.dropId || '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (hashRefund?.dropId) setDropId(hashRefund.dropId)
  }, [hashRefund?.dropId])

  const drop = dropId ? getDrop(dropId) : null
  const st = drop ? dropStatus(drop) : 'missing'
  const canRefund = drop && (st === 'expired' || (st === 'open' && Date.now() > drop.expiresAt))

  async function onRefund(e) {
    e.preventDefault()
    if (!drop) return
    setBusy(true)
    try {
      markRefunded(drop.id)
      recordEvidence({ kind: 'refund', dropId: drop.id })
      onFlash('ok', 'Refund recorded on the local ledger.')
      onDone?.()
    } catch (err) {
      onFlash('err', err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel form narrow-form" onSubmit={onRefund}>
      <label>
        <span>Drop</span>
        <select value={dropId} onChange={(e) => setDropId(e.target.value)}>
          <option value="">Select…</option>
          {drops.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} — {dropStatus(d)}
            </option>
          ))}
        </select>
      </label>
      {drop ? (
        <div className="gate-summary">
          <strong>{drop.title}</strong>
          <span>
            Expires {new Date(drop.expiresAt).toLocaleString()} · <span className={`pill ${st}`}>{st}</span>
          </span>
        </div>
      ) : null}
      {!canRefund && drop ? (
        <div className="status info">
          <p>
            {st === 'claimed' && 'Already claimed — nothing to refund.'}
            {st === 'refunded' && 'Already refunded.'}
            {st === 'open' && 'Not expired yet. Refund unlocks after expiry.'}
          </p>
        </div>
      ) : null}
      <button type="submit" className="btn primary" disabled={busy || !canRefund}>
        {busy ? 'Refunding…' : 'Refund expired drop'}
      </button>
      <p className="hint">Local ledger refund. On-chain escrow refund is M2.</p>
    </form>
  )
}

function LedgerPanel({ tick }) {
  const drops = useMemo(() => listDrops(), [tick])
  return (
    <div className="panel">
      <h2>Gates in this browser</h2>
      <p className="hint">Local: one claim per drop. Claim count below is the ledger counter after a successful claim.</p>
      {drops.length === 0 ? (
        <p className="empty">No drops.</p>
      ) : (
        <ul className="drop-list">
          {drops.map((d) => (
            <li key={d.id}>
              <div>
                <strong>{d.title}</strong>
                <span>
                  {d.ruleLabel} · {d.amount} {d.unit} · claims {d.claims || 0} ·{' '}
                  <span className={`pill ${dropStatus(d)}`}>{dropStatus(d)}</span>
                </span>
              </div>
              <code className="mono small">{d.id}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
