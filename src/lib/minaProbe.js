/**
 * Lightweight Mina Devnet reachability probe for /status.
 * When gateZkApp is set, also check account existence via GraphQL.
 */

import { NETWORKS } from '../config/networks.js'

const HEIGHT_QUERY = `query { bestChain(maxLength: 1) { protocolState { consensusState { blockHeight } } } }`
const ACCOUNT_QUERY = `query ($pk: String!) { account(publicKey: $pk) { balance { total } } }`

export async function probeMina() {
  const net = NETWORKS.mina
  const started = Date.now()
  const result = {
    ok: false,
    checkedAt: Date.now(),
    ms: null,
    blockHeight: null,
    graphqlOk: false,
    zkAppConfigured: Boolean(net.gateZkApp),
    zkAppReachable: null,
    faucetLinks: net.faucets,
    explorer: net.explorer,
    error: null,
  }

  try {
    const res = await fetch(net.graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: HEIGHT_QUERY }),
    })
    if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`)
    const json = await res.json()
    const height = json?.data?.bestChain?.[0]?.protocolState?.consensusState?.blockHeight
    result.graphqlOk = height != null
    result.blockHeight = height != null ? Number(height) : null

    if (net.gateZkApp) {
      try {
        const accRes = await fetch(net.graphqlUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: ACCOUNT_QUERY,
            variables: { pk: net.gateZkApp },
          }),
        })
        const accJson = await accRes.json()
        result.zkAppReachable = Boolean(accJson?.data?.account)
      } catch {
        result.zkAppReachable = false
      }
    }

    result.ok = result.graphqlOk
    result.ms = Date.now() - started
    result.checkedAt = Date.now()
    return result
  } catch (err) {
    result.error = err?.message || String(err)
    result.ms = Date.now() - started
    result.checkedAt = Date.now()
    return result
  }
}

export function explorerTx(hash) {
  if (!hash) return null
  return `${NETWORKS.mina.explorer}/tx/${hash}`
}

export function explorerAccount(pk) {
  if (!pk) return null
  return `${NETWORKS.mina.explorer}/account/${pk}`
}
