/** Dual-path networks: local ledger today, Mina Devnet when zkApp path lands. */

export const NETWORKS = {
  demo: {
    id: 'demo',
    label: 'Local ledger',
    short: 'Local',
    live: false,
    description:
      'Full gate → present → claim → refund in this browser. Selective disclosure, nullifier, destination-bound auth. No chain calls until the zkApp ships.',
  },
  mina: {
    id: 'mina',
    label: 'Mina Devnet',
    short: 'Devnet',
    live: true,
    chainId: 'devnet',
    /** Public GraphQL — used for status probes only until zkApp deploy. */
    graphqlUrl: 'https://api.minascan.io/node/devnet/v1/graphql',
    explorer: 'https://minascan.io/devnet',
    /** Filled after zkApp deploy — leave null; never invent. */
    gateZkApp: null,
    faucets: [
      { label: 'Mina faucet', url: 'https://faucet.minaprotocol.com/' },
      { label: 'Minascan faucet', url: 'https://minascan.io/devnet/txn-tools/faucet' },
    ],
    description:
      'Wallet connect and GraphQL probes work today. M1: presentation + zkApp verify when gateZkApp is set. M2: funded escrow + on-chain nullifier registry.',
  },
}

/** Local ledger is default until an on-chain zkApp exists. */
export const DEFAULT_NETWORK = 'demo'
