/**
 * Smoke: wallet error mapping + network normalize + no compromised install URLs.
 * Run: node scripts/smoke-wallet.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const walletSrc = readFileSync(join(root, 'src/lib/wallet.js'), 'utf8')

function formatWalletError(err) {
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
  if (lower.includes('user rejected') || lower.includes('rejected by user') || lower.includes('cancelled')) {
    return 'Request rejected in the wallet. Nothing was submitted.'
  }
  if (lower.includes('insufficient') || lower.includes('not enough')) {
    return 'Insufficient MINA for this amount + fee. Top up on Devnet and retry.'
  }
  if (lower.includes('network') || lower.includes('devnet')) {
    return 'Wallet network looks wrong. Switch to Mina Devnet and retry.'
  }
  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw
}

function normalizeNetworkId(value) {
  if (value == null) return null
  const s = String(value).trim().toLowerCase()
  if (!s) return null
  if (s.includes('devnet') || s === 'testnet' || s === 'berkeley') return 'devnet'
  if (s.includes('mainnet') || s === 'main') return 'mainnet'
  return s
}

function isDevnetNetwork(value) {
  if (value == null) return null
  return normalizeNetworkId(value) === 'devnet'
}

const hasInstallUrl = /url:\s*['"]https?:\/\/pallad\.co/i.test(walletSrc)
const installMatch = walletSrc.match(/WALLET_INSTALLS\s*=\s*\[([\s\S]*?)\]\s*\n/)
const installBlock = installMatch?.[1] || ''
const palladInInstalls = /pallad\.co/i.test(installBlock)

const cases = [
  [!hasInstallUrl && !palladInInstalls, 'WALLET_INSTALLS must not include pallad.co'],
  [walletSrc.includes('aurowallet.com'), 'source recommends Auro'],
  [walletSrc.includes('compromised') || walletSrc.includes('hijack'), 'source documents compromise'],
  [formatWalletError({ code: 'NO_WALLET' }).includes('Auro'), 'NO_WALLET → Auro'],
  [!formatWalletError({ code: 'NO_WALLET' }).toLowerCase().includes('pallad'), 'NO_WALLET no Pallad'],
  [formatWalletError({ code: 'ZKAPP_PENDING' }).includes('Local'), 'ZKAPP_PENDING honest'],
  [formatWalletError({ message: 'User rejected the request' }).includes('rejected'), 'user reject'],
  [formatWalletError({ message: 'insufficient funds' }).includes('Insufficient'), 'balance'],
  [formatWalletError({ message: 'x'.repeat(300) }).endsWith('…'), 'truncate long'],
  [normalizeNetworkId('Devnet') === 'devnet', 'Devnet normalize'],
  [normalizeNetworkId('berkeley') === 'devnet', 'berkeley → devnet'],
  [normalizeNetworkId('mainnet') === 'mainnet', 'mainnet'],
  [isDevnetNetwork('testnet') === true, 'testnet isDevnet'],
  [isDevnetNetwork('mainnet') === false, 'mainnet not Devnet'],
]

let failed = 0
for (const [ok, name] of cases) {
  if (!ok) {
    console.error('FAIL', name)
    failed += 1
  } else {
    console.log('ok  ', name)
  }
}

if (failed) {
  console.error(`\n${failed} failed`)
  process.exit(1)
}
console.log(`\n${cases.length} passed`)
