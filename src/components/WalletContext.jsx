import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  connectWallet,
  formatWalletError,
  getInjectedWallet,
  isDevnetNetwork,
  walletNetworkId,
} from '../lib/wallet'

const Ctx = createContext(null)

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null)
  const [address, setAddress] = useState(null)
  const [networkId, setNetworkId] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const [hasWallet, setHasWallet] = useState(false)

  const sync = useCallback(async () => {
    const w = getInjectedWallet()
    if (!w) return
    try {
      let accounts = null
      if (typeof w.getAccounts === 'function') accounts = await w.getAccounts()
      if ((!accounts || !accounts.length) && w.isConnected && typeof w.requestAccounts === 'function') {
        /* already connected path varies by wallet */
      }
      const addr = Array.isArray(accounts) ? accounts[0] : null
      if (addr) {
        setWallet(w)
        setAddress(addr)
        setNetworkId(walletNetworkId())
        setStatus('connected')
      }
    } catch {
      /* ignore silent sync failures */
    }
  }, [])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    setErrorCode(null)
    try {
      const { wallet: w, address: addr, networkId: net } = await connectWallet({ requireDevnet: false })
      setWallet(w)
      setAddress(addr)
      setNetworkId(net)
      setStatus('connected')
      return addr
    } catch (e) {
      setError(formatWalletError(e))
      setErrorCode(e?.code || null)
      setStatus('error')
      throw e
    }
  }, [])

  const disconnect = useCallback(() => {
    setWallet(null)
    setAddress(null)
    setNetworkId(null)
    setStatus('idle')
    setError(null)
    setErrorCode(null)
    try {
      getInjectedWallet()?.disconnect?.()
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    let tries = 0
    const detect = () => {
      const w = getInjectedWallet()
      setHasWallet(Boolean(w))
      if (w) sync()
      return Boolean(w)
    }
    if (!detect()) {
      const timer = window.setInterval(() => {
        tries += 1
        if (detect() || tries >= 5) window.clearInterval(timer)
      }, 400)
      return () => window.clearInterval(timer)
    }
    return undefined
  }, [sync])

  useEffect(() => {
    const w = getInjectedWallet()
    if (!w?.on) return undefined
    const onAccounts = () => sync()
    const onNetwork = () => setNetworkId(walletNetworkId())
    try {
      w.on('accountsChanged', onAccounts)
      w.on('chainChanged', onNetwork)
      w.on('networkChanged', onNetwork)
    } catch {
      /* ignore */
    }
    return () => {
      try {
        w.off?.('accountsChanged', onAccounts)
        w.off?.('chainChanged', onNetwork)
        w.off?.('networkChanged', onNetwork)
      } catch {
        /* ignore */
      }
    }
  }, [sync, hasWallet])

  const isDevnet = networkId == null ? null : isDevnetNetwork(networkId)

  const value = useMemo(
    () => ({
      wallet,
      address,
      networkId,
      isDevnet,
      status,
      error,
      errorCode,
      hasWallet,
      connect,
      disconnect,
    }),
    [wallet, address, networkId, isDevnet, status, error, errorCode, hasWallet, connect, disconnect],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWallet() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWallet outside provider')
  return v
}
