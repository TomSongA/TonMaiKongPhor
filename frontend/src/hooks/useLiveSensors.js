import { useCallback, useEffect, useState } from 'react'
import { appendPoint } from '../lib/sensorLogic'
import {
  fetchLatestReading,
  fetchReadingsRange,
  mapReadingRow,
  reasonsFromLatestResponse,
  wellnessFromStressPsi,
} from '../lib/sensorApi'

const POLL_MS = 900000
const HISTORY_CAP = 500

function ymd(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useLiveSensors() {
  const [reading, setReading] = useState(null)
  const [history, setHistory] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  const applyLatest = useCallback((apiRow) => {
    const m = mapReadingRow(apiRow)
    setReading(m)
    setLastUpdated(m.at)
    return m
  }, [])

  const load = useCallback(async () => {
    const today = ymd(Date.now())
    let latest
    try {
      latest = await fetchLatestReading()
    } catch (e) {
      const msg =
        e?.response?.status === 404
          ? 'No sensor readings in database yet. POST data to /api/sensor or start MQTT.'
          : e?.message || 'Cannot reach API'
      setError(msg)
      setReading(null)
      setHistory([])
      setLastUpdated(null)
      setReady(true)
      return
    }

    applyLatest(latest)
    setError(null)

    let dayRows = []
    try {
      dayRows = await fetchReadingsRange(today, today)
    } catch {
      dayRows = []
    }

    const mappedDay = dayRows.length ? dayRows : [mapReadingRow(latest)]
    setHistory(mappedDay.slice(-HISTORY_CAP))
    setReady(true)
  }, [applyLatest])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  const tick = useCallback(async () => {
    try {
      const latest = await fetchLatestReading()
      const m = applyLatest(latest)
      setHistory((prev) => {
        const last = prev[prev.length - 1]
        if (last && m.id != null && last.id === m.id) return prev
        return appendPoint(prev, m, HISTORY_CAP)
      })
      setError(null)
    } catch {
      /* keep last good values */
    }
  }, [applyLatest])

  useEffect(() => {
    if (!ready || error) return undefined
    const id = setInterval(tick, POLL_MS)
    return () => clearInterval(id)
  }, [ready, error, tick])

  if (!ready) return null

  const psi = reading ? wellnessFromStressPsi(reading.psiScore) : 0
  const stressReasons = reading ? reasonsFromLatestResponse(reading) : []

  return {
    reading,
    history,
    lastUpdated,
    psi,
    stressReasons,
    error,
    refresh: load,
  }
}
