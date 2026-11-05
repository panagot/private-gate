/**
 * Thin Mina wallet bridge for Private Gate.
 * Install CTA: Auro only. pallad.co is compromised (SEO/gambling hijack) — do not link it.
 * window.pallad / window.mina injection still detected if a user already has an extension.
 * Attestation presentations stay on the demo path until mina-attestations is wired (M1).
 */

import { NETWORKS } from '../config/networks.js'

/**
 * Recommended install targets when none is detected.
 * Never link https://pallad.co/ — domain was hijacked (observed Nov 2026: AJO89 spam).
 * Pallad GitHub is archived; Chrome Web Store listing still points website at pallad.co.
 */
export const WALLET_INSTALLS = [
  { id: 'auro', label: 'Auro Wallet', url: 'https://www.aurowallet.com/' },
  {
    id: 'mina-docs',
    label: 'Mina wallet list',
    url: 'https://docs.minaprotocol.com/using-mina/install-a-wallet',
  },
]

/** Pick an injected Mina provider across known injection shapes. */
export function getInjectedWallet() {
  if (typeof window === 'undefined') return null
  // Auro injects window.mina
  if (window.mina) return window.mina
  if (window.auroMina) return window.auroMina
  // Legacy Pallad injection (no install link — domain compromised)
  if (window.pallad?.mina) return window.pallad.mina
  if (window.pallad) return window.pallad
  const key = Object.keys(window).find((k) => {
    if (!k.toLowerCase().includes('mina')) return false
    const w = window[k]
    return w && (typeof w.requestAccounts === 'function' || typeof w.getAccounts === 'function')
  })
  return key ? window[key] : null
}

export function hasInjectedWallet() {
  return Boolean(getInjectedWallet())
}

/** Map wallet / RPC failures into short reviewer-facing copy. */
export function formatWalletError(err) {
  if (!err) return 'Unknown wallet error'
  if (err.code === 'NO_ATTESTATION') {
    return 'This wallet has no Mina Attestations credential API yet. Use the local credential panel, or an Auro build that holds attestations.'
  }
  if (err.code === 'WRONG_NETWORK') {
    return err.message || 'Switch the wallet to Mina Devnet, then retry.'
  }
  if (err.code === 'NO_WALLET') {
    return 'No Mina wallet detected. Install Auro Wallet, unlock it, then retry.'
  }
  if (err.code === 'NO_ACCOUNT') {
    return err.message || 'Wallet exposed no account. Unlock it and pick an account, then retry.'
  }
  if (err.code === 'ZKAPP_PENDING') {
    return 'Gate zkApp is not deployed yet. Switch to Local for the full claim path; Devnet claim lands in M1.'
  }
  const raw = String(err.message || err || '')
  const lower = raw.toLowerCase()
  if (
    lower.includes('user rejected') ||
    lower.includes('user abort') ||
    lower.includes('user refused') ||
    lower.includes('rejected by user') ||
    lower.includes('cancelled') ||
    lower.includes('canceled')
  ) {
    return 'Request rejected in the wallet. Nothing was submitted.'
  }
  if (lower.includes('insufficient') || lower.includes('not enough') || lower.includes('balance')) {
    return 'Insufficient MINA for this amount + fee. Top up on Devnet and retry.'
  }
  if (lower.includes('network') || lower.includes('chain') || lower.includes('devnet') || lower.includes('mainnet')) {
    return 'Wallet network looks wrong. Switch to Mina Devnet and retry.'
  }
  if (lower.includes('no mina') || lower.includes('not detected')) {
    return 'No Mina wallet detected. Install Auro Wallet, unlock it, then retry.'
  }
  if (lower.includes('timeout') || lower.includes('failed to fetch') || lower.includes('network error')) {
    return 'RPC or wallet bridge timed out. Check connection and retry.'
  }
  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw
}

export function normalizeNetworkId(value) {
  if (value == null) return null
  const s = String(value).trim().toLowerCase()
  if (!s) return null
  if (s.includes('devnet') || s === 'testnet' || s === 'berkeley') return 'devnet'
  if (s.includes('mainnet') || s === 'main') return 'mainnet'
  return s
}

export function isDevnetNetwork(value) {
  if (value == null) return null
  return normalizeNetworkId(value) === 'devnet'
}

function readNetworkFromWallet(wallet) {
  return (
    wallet?.networkId ||
    wallet?.network ||
    wallet?.chainId ||
    wallet?.provider?.networkId ||
    null
  )
}

async function requestAccounts(wallet) {
  let accounts = null
  if (typeof wallet.requestAccounts === 'function') {
    try {
      accounts = await wallet.requestAccounts()
    } catch (e) {
      throw e
    }
  }
  if ((!accounts || !accounts.length) && typeof wallet.getAccounts === 'function') {
    try {
      accounts = await wallet.getAccounts()
    } catch {
      /* ignore */
    }
  }
  if ((!accounts || !accounts.length) && typeof wallet.request === 'function') {
    try {
      accounts = await wallet.request({ method: 'mina_requestAccounts' })
    } catch {
      /* ignore */
    }
  }
  return accounts
}

/** Connect Auro (or compatible) injected wallet. */
export async function connectWallet({ requireDevnet = false } = {}) {
  const wallet = getInjectedWallet()
  if (!wallet) {
    const err = new Error('No Mina wallet detected. Install Auro Wallet, then retry.')
    err.code = 'NO_WALLET'
    throw err
  }

  let accounts
  try {
    accounts = await requestAccounts(wallet)
  } catch (e) {
    const msg = String(e?.message || '').toLowerCase()
    if (msg.includes('reject') || msg.includes('abort') || msg.includes('cancel')) throw e
    const err = new Error('Wallet did not expose an account. Unlock it, pick an account, then retry.')
    err.code = 'NO_ACCOUNT'
    throw err
  }

  const address = Array.isArray(accounts) ? accounts[0] : accounts
  if (!address) {
    const err = new Error('Wallet did not expose an account. Unlock it, pick an account, then retry.')
    err.code = 'NO_ACCOUNT'
    throw err
  }

  let networkId = normalizeNetworkId(readNetworkFromWallet(wallet))
  if (typeof wallet.requestNetwork === 'function') {
    try {
      const n = await wallet.requestNetwork()
      networkId = normalizeNetworkId(n?.networkID || n?.networkId || n) || networkId
    } catch {
      /* ignore */
    }
  }

  if (requireDevnet && networkId != null && isDevnetNetwork(networkId) === false) {
    try {
      if (typeof wallet.switchChain === 'function') {
        await wallet.switchChain({ networkID: 'devnet' })
        networkId = 'devnet'
      } else if (typeof wallet.request === 'function') {
        await wallet.request({ method: 'mina_switchChain', params: { networkID: 'devnet' } })
        networkId = 'devnet'
      }
    } catch {
      /* best-effort */
    }
    if (networkId != null && isDevnetNetwork(networkId) === false) {
      const err = new Error('Switch the wallet to Mina Devnet, then retry.')
      err.code = 'WRONG_NETWORK'
      throw err
    }
  }

  return { wallet, address, networkId }
}

export async function switchWalletToDevnet() {
  const wallet = getInjectedWallet()
  if (!wallet) {
    const err = new Error('No Mina wallet detected.')
    err.code = 'NO_WALLET'
    throw err
  }
  if (typeof wallet.switchChain === 'function') {
    await wallet.switchChain({ networkID: 'devnet' })
    return
  }
  if (typeof wallet.request === 'function') {
    await wallet.request({ method: 'mina_switchChain', params: { networkID: 'devnet' } })
    return
  }
  const err = new Error('This wallet cannot switch networks from the app. Switch to Devnet in the extension.')
  err.code = 'WRONG_NETWORK'
  throw err
}

export function walletNetworkId() {
  const w = getInjectedWallet()
  return normalizeNetworkId(readNetworkFromWallet(w))
}

/** Live claim path needs a deployed zkApp — fail honest until then. */
export function assertZkAppReady() {
  if (!NETWORKS.mina.gateZkApp) {
    const err = new Error('Gate zkApp not deployed yet.')
    err.code = 'ZKAPP_PENDING'
    throw err
  }
}
