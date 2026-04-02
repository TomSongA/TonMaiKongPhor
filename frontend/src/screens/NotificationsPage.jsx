'use client'

import { useEffect, useState } from 'react'
import { fetchStressHistory } from '../lib/sensorApi'
import { useLiveSensors } from '../hooks/useLiveSensors'
import './Page.css'

export default function NotificationsPage() {
  const sensors = useLiveSensors()
  const [historyAlerts, setHistoryAlerts] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const hist = await fetchStressHistory()
        if (cancelled) return
        const items = hist
          .filter((h) => h.psi_level !== 'Healthy')
          .map((h) => ({
            id: h.date,
            at: new Date(`${h.date}T12:00:00`).getTime(),
            title: `Daily summary: ${h.psi_level}`,
            reasons: [
              {
                key: 'avg',
                label: h.psi_level,
                detail: `Average stress index: ${h.avg_psi} (backend scale: lower is healthier)`,
              },
            ],
          }))
        setHistoryAlerts(items)
      } catch {
        if (!cancelled) setHistoryAlerts([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!sensors) return null

  const { reading, stressReasons, lastUpdated, error } = sensors
  const liveStr = new Date(lastUpdated).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })

  if (error && !reading) {
    return (
      <div className="page">
        <header className="page-head">
          <h1>Notification</h1>
        </header>
        <p className="alert-bad-title">{error}</p>
        <p className="page-foot">Ensure FastAPI is running and has at least one row in the database.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Notification</h1>
        <p className="page-desc">
          Latest status from <code>/api/sensor/latest</code>. History from <code>/api/stress-history</code> (last 7 days).
        </p>
      </header>

      <section className="card-block alert-hero">
        <h2 className="section-title">Latest status</h2>
        <p className="page-meta">
          Time reference: <time dateTime={new Date(lastUpdated).toISOString()}>{liveStr}</time>
        </p>
        {stressReasons.length === 0 ? (
          <p className="alert-ok">
            Latest reading is in the Healthy range (backend PSI classification).
          </p>
        ) : (
          <div className="alert-list">
            <p className="alert-bad-title">Attention:</p>
            <ul>
              {stressReasons.map((r) => (
                <li key={r.key}>
                  <strong>{r.label}</strong>
                  <span>{r.detail}</span>
                </li>
              ))}
            </ul>
            <p className="page-foot">
              Current: Soil {reading.soil.toFixed(0)}% · {reading.tempC.toFixed(1)}°C · RH {reading.humidity.toFixed(0)}% · light{' '}
              {reading.lightLux != null ? `${Math.round(reading.lightLux)} lux` : `${reading.light.toFixed(0)} scaled`}
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">Recent daily alerts (7-day history)</h2>
        <ul className="notif-history">
          {historyAlerts.map((item) => (
            <li key={item.id} className="notif-card">
              <div className="notif-card__head">
                <strong>{item.title}</strong>
                <time dateTime={new Date(item.at).toISOString()}>
                  {new Date(item.at).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </div>
              <ul className="notif-reasons">
                {item.reasons.map((r) => (
                  <li key={r.key}>
                    <span>{r.label}</span> — {r.detail}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {historyAlerts.length === 0 && (
          <p className="page-foot">No non-healthy days in the last week, or no history yet.</p>
        )}
      </section>
    </div>
  )
}
