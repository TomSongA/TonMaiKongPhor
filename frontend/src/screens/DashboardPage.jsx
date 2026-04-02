'use client'

import PsiBar from '../components/PsiBar'
import MultiSensorChart from '../components/MultiSensorChart'
import { useLiveSensors } from '../hooks/useLiveSensors'
import './Page.css'

export default function DashboardPage() {
  const sensors = useLiveSensors()
  if (!sensors) return null

  const { reading, history, lastUpdated, psi, stressReasons } = sensors

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
      </header>

      <PsiBar value={psi} />

      <section aria-labelledby="sensors-heading">
        <h2 id="sensors-heading" className="section-title">
          Real-time sensor
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
                Every sensor is within the safe threshold right now. Great job keeping the tree happy!
              </p>
            )}
          </article>

          <article className="realtime-card realtime-card--chart">
            <div className="realtime-card__header">
              <h3>Live graph</h3>
              <span className="realtime-card__hint">Updated every hour</span>
            </div>
            <MultiSensorChart history={history} />
          </article>
        </div>
      </section>
    </div>
  )
}
