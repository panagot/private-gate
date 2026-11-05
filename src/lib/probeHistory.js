const KEY = 'private-gate:probe-history-v1'
const MAX = 40

export function loadProbeHistory() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function appendProbeHistory(result) {
  const prev = loadProbeHistory()
  const entry = {
    t: result.checkedAt || Date.now(),
    ok: Boolean(result.ok),
    ms: result.ms,
    height: result.blockHeight ?? null,
  }
  const next = [entry, ...prev].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
