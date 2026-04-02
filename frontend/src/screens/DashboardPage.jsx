'use client'

import PsiBar from '../components/PsiBar'
import SensorCard from '../components/SensorCard'
import MultiSensorChart from '../components/MultiSensorChart'
import { useLiveSensors } from '../hooks/useLiveSensors'
import './Page.css'

export default function DashboardPage() {
  const sensors = useLiveSensors()
  if (!sensors) return null

  const { reading, history, lastUpdated, psi } = sensors

  const lastStr = new Date(lastUpdated).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })

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
        <p className="page-foot">
          Current (raw) value: Soil {reading.soil.toFixed(0)}% · {reading.tempC.toFixed(1)}°C · RH{' '}
          {reading.humidity.toFixed(0)}% · light {reading.light.toFixed(0)}%
        </p>
        <MultiSensorChart history={history} />
      </section>
    </div>
  )
}
