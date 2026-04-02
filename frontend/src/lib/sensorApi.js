import axios from 'axios'

/** Backend PSI: higher score = more stress (see FastAPI `calculate_psi`). */
export function wellnessFromStressPsi(psiScore) {
  const s = Number(psiScore)
  if (Number.isNaN(s)) return 50
  return Math.max(0, Math.min(100, 100 - s))
}

export function getApiBaseUrl() {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  }
  return 'http://localhost:8000'
}

const client = () =>
  axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: { Accept: 'application/json' },
  })

/** Map API row → shape used by charts (tempC, light scaled 0–100 for line; keep lux for labels). */
export function mapReadingRow(row) {
  const at = new Date(row.timestamp).getTime()
  const lux = Number(row.light)
  return {
    id: row.id,
    soil: Number(row.soil),
    tempC: Number(row.temp),
    humidity: Number(row.humidity),
    light: Math.min(100, lux / 500),
    lightLux: lux,
    at,
    psiScore: Number(row.psi_score),
    psiLevel: row.psi_level,
    explanation: row.explanation ?? '',
  }
}

export function reasonsFromLatestResponse(r) {
  if (!r) return []
  const level = r.psi_level ?? r.psiLevel
  if (level === 'Healthy') return []
  return [
    {
      key: 'level',
      label: level,
      detail: r.explanation || '',
    },
  ]
}

export async function fetchLatestReading() {
  const { data } = await client().get('/api/sensor/latest')
  return data
}

export async function fetchReadingsRange(fromDate, toDate) {
  const { data } = await client().get('/api/readings', {
    params: { from_date: fromDate, to_date: toDate },
  })
  return Array.isArray(data) ? data.map(mapReadingRow) : []
}

export async function fetchStressHistory() {
  const { data } = await client().get('/api/stress-history')
  return Array.isArray(data) ? data : []
}

/** Group API readings into calendar days; `psi` is wellness (100 − avg stress) for display. */
export function buildCalendarMonth(year, month, mappedRows) {
  const last = new Date(year, month + 1, 0).getDate()
  const byDay = {}
  for (const r of mappedRows) {
    const dt = new Date(r.at)
    if (dt.getFullYear() !== year || dt.getMonth() !== month) continue
    const d = dt.getDate()
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(r)
  }
  const days = []
  for (let d = 1; d <= last; d++) {
    const samples = (byDay[d] || []).sort((a, b) => a.at - b.at)
    const dayStart = new Date(year, month, d).getTime()
    let avgStress = 0
    let stressed = false
    if (samples.length) {
      const sum = samples.reduce((a, b) => a + b.psiScore, 0)
      avgStress = sum / samples.length
      stressed = avgStress > 40
    }
    days.push({
      date: dayStart,
      psi: samples.length ? Math.round(100 - avgStress) : null,
      stressed,
      samples,
    })
  }
  return { year, month, days }
}
