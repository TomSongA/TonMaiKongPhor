/** Thresholds for demo — tune to match your sensors */

export const THRESHOLDS = {
  soil: { min: 35, max: 78, idealLow: 42, idealHigh: 68 },
  tempC: { min: 16, max: 31, idealLow: 20, idealHigh: 28 },
  humidity: { min: 32, max: 78, idealLow: 45, idealHigh: 65 },
  light: { min: 28, max: 95, idealLow: 38, idealHigh: 88 },
}

export function evaluateStress(s) {
  const reasons = []
  if (s.soil < THRESHOLDS.soil.min) {
    reasons.push({
      key: 'soil_low',
      label: 'Low soil moisture',
      detail: `Soil cost ${s.soil.toFixed(0)}% Lower ${THRESHOLDS.soil.min}% — Risk of dehydration.`,
    })
  } else if (s.soil > THRESHOLDS.soil.max) {
    reasons.push({
      key: 'soil_high',
      label: 'High soil moisture',
      detail: `Soil cost ${s.soil.toFixed(0)}% Higher ${THRESHOLDS.soil.max}% — Risk of root rot.`,
    })
  }
  if (s.tempC < THRESHOLDS.tempC.min) {
    reasons.push({
      key: 'temp_low',
      label: 'low temperature',
      detail: `${s.tempC.toFixed(1)}°C Lower ${THRESHOLDS.tempC.min}°C`,
    })
  } else if (s.tempC > THRESHOLDS.tempC.max) {
    reasons.push({
      key: 'temp_high',
      label: 'High temperature',
      detail: `${s.tempC.toFixed(1)}°C Higher ${THRESHOLDS.tempC.max}°C`,
    })
  }
  if (s.humidity < THRESHOLDS.humidity.min) {
    reasons.push({
      key: 'hum_low',
      label: 'Low humidity',
      detail: `RH ${s.humidity.toFixed(0)}% Lower ${THRESHOLDS.humidity.min}%`,
    })
  } else if (s.humidity > THRESHOLDS.humidity.max) {
    reasons.push({
      key: 'hum_high',
      label: 'High humidity',
      detail: `RH ${s.humidity.toFixed(0)}% Higher ${THRESHOLDS.humidity.max}%`,
    })
  }
  if (s.light < THRESHOLDS.light.min) {
    reasons.push({
      key: 'light_low',
      label: 'Insufficient light',
      detail: `Light intensity ${s.light.toFixed(0)}% Lower ${THRESHOLDS.light.min}%`,
    })
  } else if (s.light > THRESHOLDS.light.max) {
    reasons.push({
      key: 'light_high',
      label: 'Too bright light',
      detail: `Light intensity ${s.light.toFixed(0)}% Higher ${THRESHOLDS.light.max}%`,
    })
  }
  return reasons
}

/** PSI = Plant Status Index 0–100 (สูง = สมบูรณ์) */
export function computePsi(s) {
  const reasons = evaluateStress(s)
  const penalty = Math.min(85, reasons.length * 22)
  const jitter = (hashReading(s) % 7) - 3
  return Math.max(0, Math.min(100, 100 - penalty + jitter))
}

function hashReading(s) {
  return Math.floor(
    s.soil * 1.1 + s.tempC * 3 + s.humidity + s.light * 0.7,
  )
}

export function randomReading(base = {}) {
  return {
    soil: base.soil ?? 45 + Math.random() * 25,
    tempC: base.tempC ?? 22 + (Math.random() - 0.4) * 6,
    humidity: base.humidity ?? 50 + Math.random() * 18,
    light: base.light ?? 50 + Math.random() * 35,
    at: base.at ?? Date.now(),
  }
}

/** Seeded-ish series for charts */
export function appendPoint(history, reading, maxLen = 36) {
  const next = [...history, reading].slice(-maxLen)
  return next
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function generateDaySummary(dayTs) {
  const dayStart = startOfDay(dayTs)
  const samples = []
  for (let h = 0; h < 24; h += 2) {
    const t = dayStart + h * 3600000
    const seed = dayStart + h  // seed จาก date+hour = ค่าเดิมทุกครั้ง
    samples.push(
      randomReading({
        soil: 48 + Math.sin(h / 4) * 8,
        tempC: 24 + Math.cos(h / 5) * 4,
        humidity: 55 + Math.sin(h / 3) * 10,
        light:
          h >= 6 && h <= 18
            ? 40 + seededRandom(seed) * 45
            : 5 + seededRandom(seed + 1) * 15,
        at: t,
      }),
    )
  }
  const avg = (key) =>
    samples.reduce((a, b) => a + b[key], 0) / samples.length
  const s = {
    soil: avg('soil'),
    tempC: avg('tempC'),
    humidity: avg('humidity'),
    light: avg('light'),
    at: dayStart,
  }
  return {
    date: dayStart,
    psi: computePsi(s),
    stressed: evaluateStress(s).length > 0,
    samples,
    summary: s,
  }
}

export function generateMonthDays(anchorDate = new Date()) {
  const y = anchorDate.getFullYear()
  const m = anchorDate.getMonth()
  const last = new Date(y, m + 1, 0)
  const days = []
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(y, m, d).getTime()
    days.push(generateDaySummary(dt))
  }
  return { year: y, month: m, days }
}

export function filterSamplesByTimeRange(samples, startHour, endHour) {
  const dayStart = startOfDay(samples[0]?.at || Date.now())
  const start = dayStart + startHour * 3600000
  const end = dayStart + endHour * 3600000
  return samples.filter((r) => r.at >= start && r.at <= end)
}
