'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { usePrediction } from '../hooks/usePrediction'
import { evaluateStress, THRESHOLDS } from '../lib/sensorLogic'
import './Page.css'

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeSoilValue(raw) {
  if (raw == null || Number.isNaN(raw)) return null
  return raw > 120 ? raw / 100 : raw
}

function formatSoilPercent(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return value >= 10 ? value.toFixed(0) : value.toFixed(1)
}

function normalizeReadingForAdvice(reading) {
  if (!reading) return null
  return {
    soil: normalizeSoilValue(reading.soil),
    tempC: Number.isFinite(reading.tempC) ? reading.tempC : null,
    humidity: Number.isFinite(reading.humidity) ? reading.humidity : null,
    light: Number.isFinite(reading.light) ? Math.min(100, reading.light) : null,
  }
}

const ACTION_HINTS = {
  soil_low: (reading) =>
    `Increase watering to raise soil moisture (currently ${formatSoilPercent(
      reading.soil,
    )}%, target ≥ ${THRESHOLDS.soil.min}%).`,
  soil_high: (reading) =>
    `Pause watering so soil can dry (currently ${formatSoilPercent(
      reading.soil,
    )}%, target ≤ ${THRESHOLDS.soil.max}%).`,
  temp_low: (reading) =>
    `Warm the area; temperature is ${reading.tempC?.toFixed(1) ?? '-'}°C, below ${THRESHOLDS.tempC.min}°C.`,
  temp_high: (reading) =>
    `Cool things down or add shade; temperature is ${reading.tempC?.toFixed(1) ?? '-'}°C, above ${THRESHOLDS.tempC.max}°C.`,
  hum_low: (reading) =>
    `Raise humidity with misting or a humidifier (currently ${reading.humidity?.toFixed(
      0,
    )}%, target ≥ ${THRESHOLDS.humidity.min}%).`,
  hum_high: (reading) =>
    `Improve airflow to lower humidity (currently ${reading.humidity?.toFixed(
      0,
    )}%, target ≤ ${THRESHOLDS.humidity.max}%).`,
  light_low: (reading) =>
    `Move the plant closer to light or extend grow lights (relative brightness ${reading.light?.toFixed(0) ?? '-'}% is low).`,
  light_high: (reading) =>
    `Add shade or dim lights (relative brightness ${reading.light?.toFixed(0) ?? '-'}% exceeds the safe range).`,
}

function getForecastAdvice(level, reading) {
  const normalized = level ? level.toLowerCase() : 'unknown'

  const summary = (() => {
    if (!level) {
      return {
        title: 'Monitor conditions',
        body: 'Prediction is unavailable. Keep an eye on the live readings and refresh shortly.',
      }
    }
    if (normalized.includes('critical')) {
      return {
        title: 'Act now',
        body: 'Stress is forecasted soon. Adjust watering, shading, and airflow immediately.',
      }
    }
    if (normalized.includes('mild')) {
      return {
        title: 'Tune the environment',
        body: 'Conditions may drift soon. Make small adjustments before stress escalates.',
      }
    }
    if (normalized.includes('healthy')) {
      return {
        title: 'Keep steady',
        body: 'Forecast is positive—maintain the current care routine.',
      }
    }
    return {
      title: 'Monitor conditions',
      body: 'Prediction level is unknown. Watch live data and adjust if you see sudden drops.',
    }
  })()

  const normalizedReading = normalizeReadingForAdvice(reading)
  if (!normalizedReading) return { ...summary, actions: [] }

  const factors = evaluateStress(normalizedReading)
  const actions = factors
    .map((reason) => {
      const formatter = ACTION_HINTS[reason.key]
      return formatter ? formatter(normalizedReading) : null
    })
    .filter(Boolean)

  return { ...summary, actions }
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ─── PSI Chart ──────────────────────────────────────────────────────────────

function PsiHistoryChart({ history, prediction, hoursAhead }) {
  if (!history || history.length === 0) {
    return <p className="page-foot">Waiting for history data…</p>
  }

  // Convert history → wellness score (100 - psiScore)
  const historyPoints = history.map((r) => ({
    at: r.at,
    psi: Math.max(0, Math.min(100, 100 - (r.psiScore ?? 0))),
    type: 'history',
  }))

  // Build prediction point at now + hoursAhead
  let predPoint = null
  if (prediction?.predicted_psi != null) {
    const predAt = Date.now() + hoursAhead * 60 * 60 * 1000
    predPoint = {
      at: predAt,
      psi: Math.max(0, Math.min(100, 100 - prediction.predicted_psi)),
      type: 'prediction',
    }
  }

  // Combine: history + gap point (last history repeated) + pred point
  const chartData = predPoint
    ? [
        ...historyPoints,
        { at: Date.now(), psi: historyPoints[historyPoints.length - 1]?.psi, type: 'now' },
        { at: predPoint.at, psi: predPoint.psi, type: 'prediction' },
      ]
    : historyPoints

  const nowTs = Date.now()

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div
        style={{
          background: 'var(--card-bg, #fff)',
          border: '1px solid var(--border, #ddd)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>
          {d.type === 'prediction' ? '🔮 Forecast' : formatTime(d.at)}
        </p>
        <p style={{ margin: 0, color: 'var(--accent, #5a7c4e)' }}>
          Wellness: <strong>{d.psi?.toFixed(1)}</strong>
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="psiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5a7c4e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#5a7c4e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e09f3e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e09f3e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #eee)" />
        <XAxis
          dataKey="at"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatTime}
          tick={{ fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* Vertical line at "now" */}
        <ReferenceLine
          x={nowTs}
          stroke="#aaa"
          strokeDasharray="4 4"
          label={{ value: 'Now', position: 'top', fontSize: 11, fill: '#aaa' }}
        />

        {/* History area */}
        <Area
          type="monotone"
          dataKey="psi"
          stroke="#5a7c4e"
          strokeWidth={2}
          fill="url(#psiGrad)"
          dot={false}
          activeDot={{ r: 4 }}
          connectNulls
        />

        {/* Prediction dot */}
        {predPoint && (
          <ReferenceDot
            x={predPoint.at}
            y={predPoint.psi}
            r={7}
            fill="#e09f3e"
            stroke="#fff"
            strokeWidth={2}
            label={{
              value: `${predPoint.psi.toFixed(0)}`,
              position: 'top',
              fontSize: 11,
              fill: '#e09f3e',
            }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── component ──────────────────────────────────────────────────────────────

export default function PredictionSection({ reading, history, initialHours = 3 }) {
  const {
    prediction,
    loading: predictionLoading,
    error: predictionError,
    hoursAhead,
    setHoursAhead,
    refresh: refreshPrediction,
  } = usePrediction(initialHours)

  const predictedPsi =
    prediction?.predicted_psi != null ? prediction.predicted_psi.toFixed(1) : '--'
  const predictedLevel = prediction?.predicted_level ?? 'Unknown'
  const confidence = prediction?.confidence ?? 'unknown'

  const levelSlug = predictedLevel.toLowerCase().replace(/\s+/g, '-')
  const confidenceSlug = confidence.toLowerCase()
  const levelClass = `prediction-pill prediction-pill--${levelSlug}`
  const confidenceClass = `prediction-confidence prediction-confidence--${confidenceSlug}`

  const forecastAdvice = getForecastAdvice(predictedLevel, reading)

  return (
    <div className="page">
      <header className="page-head">
        <h1 id="prediction-heading">Prediction</h1>
        <p className="page-desc">See the forecasted plant stress level for the next 1–12 hours.</p>
      </header>

      {/* ── PSI History Chart ── */}
      <article className="realtime-card realtime-card--chart" style={{ marginBottom: '1.25rem' }}>
        <div className="realtime-card__header">
          <h3>Wellness history &amp; forecast</h3>
          <span className="realtime-card__hint">
            Green = history · <span style={{ color: '#e09f3e' }}>●</span> Orange dot = predicted
          </span>
        </div>
        <PsiHistoryChart history={history} prediction={prediction} hoursAhead={hoursAhead} />
      </article>

      {/* ── Prediction card ── */}
      <article className="prediction-card">
        <div className="prediction-metric">
          <p className="prediction-label">Next {hoursAhead} hours</p>
          <div className="prediction-values">
            <strong className="prediction-psi">{predictedPsi}</strong>
            <span className={levelClass}>{predictedLevel}</span>
          </div>
          <p className={confidenceClass}>
            Confidence: <strong>{confidence}</strong>
          </p>
        </div>

        <div className="prediction-panel">
          <div className="prediction-state">
            {predictionLoading && <p className="prediction-hint">Fetching forecast…</p>}
            {!predictionLoading && predictionError && (
              <p className="alert-bad-title prediction-hint">{predictionError}</p>
            )}
            {!predictionLoading && !predictionError && prediction && (
              <p className="prediction-hint">
                Forecast runs on Random Forest (classifier + regressor) trained on labeled PSI
                levels.
              </p>
            )}
          </div>

          <label className="prediction-control">
            <span>
              Forecast window <strong>{hoursAhead}h</strong>
            </span>
            <input
              type="range"
              min="1"
              max="12"
              value={hoursAhead}
              onChange={(e) => setHoursAhead(Number(e.target.value))}
            />
          </label>

          <div className="prediction-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={refreshPrediction}
              disabled={predictionLoading}
            >
              Refresh now
            </button>
            <span className="prediction-updated">
              Updated {prediction ? `~${prediction.hours_ahead}h ahead` : '—'}
            </span>
          </div>

          {forecastAdvice && (
            <div className="prediction-advice">
              <strong>{forecastAdvice.title}</strong>
              <p>{forecastAdvice.body}</p>
              {forecastAdvice.actions?.length > 0 && (
                <ul>
                  {forecastAdvice.actions.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}