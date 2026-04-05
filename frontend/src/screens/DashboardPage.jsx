'use client'

import PsiBar from '../components/PsiBar'
import MultiSensorChart from '../components/MultiSensorChart'
import { useLiveSensors } from '../hooks/useLiveSensors'
import { usePrediction } from '../hooks/usePrediction'
import './Page.css'

export default function DashboardPage() {
  const sensors = useLiveSensors()
  const {
    prediction,
    loading: predictionLoading,
    error: predictionError,
    hoursAhead,
    setHoursAhead,
    refresh: refreshPrediction,
  } = usePrediction(3)

  if (!sensors) return null

  const { history, lastUpdated, psi, stressReasons, error, reading } = sensors

  if (error && !reading) {
    return (
      <div className="page">
        <header className="page-head">
          <h1>Dashboard</h1>
        </header>
        <p className="alert-bad-title">We cannot reach the sensor service right now.</p>
        <p className="page-foot">
          Please make sure the sensor hub is online and try again shortly.
          <br />
          <span style={{ fontSize: '0.9em' }}>Details: {error}</span>
        </p>
      </div>
    )
  }

  const lastStr = new Date(lastUpdated).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
  const hasStress = stressReasons.length > 0
  const predictedPsi = prediction?.predicted_psi != null ? prediction.predicted_psi.toFixed(1) : '--'
  const predictedLevel = prediction?.predicted_level ?? 'Unknown'
  const confidence = prediction?.confidence ?? 'unknown'
  const levelSlug = predictedLevel.toLowerCase().replace(/\s+/g, '-')
  const confidenceSlug = confidence.toLowerCase()
  const levelClass = `prediction-pill prediction-pill--${levelSlug}`
  const confidenceClass = `prediction-confidence prediction-confidence--${confidenceSlug}`

  return (
    <div className="page">
      <header className="page-head">
        <h1>Dashboard</h1>
        <p className="page-meta">
          <span className="live-dot" aria-hidden />
          Latest update: <time dateTime={new Date(lastUpdated).toISOString()}>{lastStr}</time>
        </p>
        {error && (
          <p className="page-foot" style={{ color: 'var(--danger)' }}>
            Data may be delayed: {error}
          </p>
        )}
      </header>

      <PsiBar value={psi} />

      <section aria-labelledby="sensors-heading">
        <h2 id="sensors-heading" className="section-title">
          Live sensor overview
        </h2>

        <div className="realtime-grid">
          <article className="realtime-card realtime-card--notif">
            <div className="realtime-card__header">
              <h3>Notifications</h3>
              <span className={`badge ${hasStress ? 'badge--warn' : 'badge--ok'}`}>
                {hasStress ? 'Action needed' : 'All good'}
              </span>
            </div>
            <p className="realtime-card__hint">
              Latest check:{' '}
              <time dateTime={new Date(lastUpdated).toISOString()}>{lastStr}</time>
            </p>
            {hasStress ? (
              <ul className="realtime-alerts">
                {stressReasons.map((reason) => (
                  <li key={reason.key}>
                    <strong>{reason.label}</strong>
                    <span>{reason.detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="realtime-card__calm">
                Latest reading looks healthy based on the most recent data.
              </p>
            )}
          </article>

          <article className="realtime-card realtime-card--chart">
            <div className="realtime-card__header">
              <h3>Live graph</h3>
              <span className="realtime-card__hint">Shows the latest readings, refreshed every 10 seconds.</span>
            </div>
            {history.length === 0 ? <p className="page-foot">Waiting for live readings…</p> : <MultiSensorChart history={history} />}
          </article>
        </div>
      </section>

      <section aria-labelledby="prediction-heading" className="prediction-section">
        <h2 id="prediction-heading" className="section-title">
          Prediction
        </h2>

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
                  Forecast runs on Random Forest (classifier + regressor) trained on labeled PSI levels.
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
          </div>
        </article>
      </section>
    </div>
  )
}
