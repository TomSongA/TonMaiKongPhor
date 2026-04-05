'use client'

import PsiBar from '../components/PsiBar'
import MultiSensorChart from '../components/MultiSensorChart'
import { useLiveSensors } from '../hooks/useLiveSensors'
import './Page.css'

export default function DashboardPage() {
  const sensors = useLiveSensors()
  if (!sensors) return null

  const { history, lastUpdated, psi, stressReasons, error, reading } = sensors

  if (error && !reading) {
    return (
      <div className="page">
        <header className="page-head">
          <h1>Dashboard</h1>
        </header>
        <p className="alert-bad-title">We can't reach the sensor service right now.</p>
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
              <span className="realtime-card__hint">Shows today's readings, refreshed every 10 seconds.</span>
            </div>
            {history.length === 0 ? <p className="page-foot">Waiting for live readings…</p> : <MultiSensorChart history={history} />}
          </article>
        </div>
      </section>
    </div>
  )
}
