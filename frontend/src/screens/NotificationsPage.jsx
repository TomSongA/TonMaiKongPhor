'use client'

import { useEffect, useMemo, useState } from 'react'
import { evaluateStress, generateDaySummary, randomReading } from '../lib/sensorLogic'
import { useLiveSensors } from '../hooks/useLiveSensors'
import './Page.css'

export default function NotificationsPage() {
  const sensors = useLiveSensors()
  const [historyAlerts, setHistoryAlerts] = useState([])

  // ย้ายมาไว้ใน useEffect — รันฝั่ง client อย่างเดียว
  useEffect(() => {
    const out = []
    for (let i = 0; i < 5; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const day = generateDaySummary(d.getTime())
      const reasons = evaluateStress(day.summary)
      if (reasons.length) {
        out.push({
          id: `day-${i}`,
          at: day.date,
          title: 'The trees are showing signs of stress today (average summary).',
          reasons,
        })
      }
    }
    const spot = randomReading()
    const spotReasons = evaluateStress(spot)
    if (spotReasons.length) {
      out.unshift({
        id: 'spot-1',
        at: spot.at - 3600000,
        title: 'Measurement taken 1 hour prior (example).',
        reasons: spotReasons,
      })
    }
    setHistoryAlerts(out)
  }, [])

  // guard หลัง hooks ทั้งหมด
  if (!sensors) return null

  const { reading, stressReasons, lastUpdated } = sensors
  const liveStr = new Date(lastUpdated).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })

  return (
    // ... JSX เดิมทุกอย่าง ไม่ต้องแก้
    <div className="page">
      <header className="page-head">
        <h1>Notification</h1>
        <p className="page-desc">
          Notify when the value is outside the specified range. Indicating which factor is causing it. &quot;stressed&quot;
        </p>
      </header>

      <section className="card-block alert-hero">
        <h2 className="section-title">Latest status</h2>
        <p className="page-meta">
          Time reference: <time dateTime={new Date(lastUpdated).toISOString()}>{liveStr}</time>
        </p>
        {stressReasons.length === 0 ? (
          <p className="alert-ok">The current values are within the appropriate range: no signs of stress were found within this set of criteria.</p>
        ) : (
          <div className="alert-list">
            <p className="alert-bad-title">Trees experience stress from the following values:</p>
            <ul>
              {stressReasons.map((r) => (
                <li key={r.key}>
                  <strong>{r.label}</strong>
                  <span>{r.detail}</span>
                </li>
              ))}
            </ul>
            <p className="page-foot">
              Current value: Soil {reading.soil.toFixed(0)}% · {reading.tempC.toFixed(1)}°C · RH{' '}
              {reading.humidity.toFixed(0)}% · light {reading.light.toFixed(0)}%
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">Notification history (example)</h2>
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
          <p className="page-foot">There are no items listed in the preview.</p>
        )}
      </section>
    </div>
  )
}