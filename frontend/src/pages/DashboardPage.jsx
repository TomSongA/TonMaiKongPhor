import PsiBar from '../components/PsiBar'
import SensorCard from '../components/SensorCard'
import { useLiveSensors } from '../hooks/useLiveSensors'
import './Page.css'

export default function DashboardPage() {
  const { reading, history, lastUpdated, psi } = useLiveSensors()

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
        <div className="sensor-grid">
          <SensorCard
            title="Soil moisture"
            unit="%"
            history={history}
            dataKey="soil"
            color="var(--chart-soil)"
            formatValue={(v) => v.toFixed(0)}
          />
          <SensorCard
            title="temperature"
            unit="°C"
            history={history}
            dataKey="tempC"
            color="var(--chart-temp)"
            formatValue={(v) => v.toFixed(1)}
          />
          <SensorCard
            title="Air humidity"
            unit="% RH"
            history={history}
            dataKey="humidity"
            color="var(--chart-hum)"
            formatValue={(v) => v.toFixed(0)}
          />
          <SensorCard
            title="Light intensity"
            unit="%"
            history={history}
            dataKey="light"
            color="var(--chart-light)"
            formatValue={(v) => v.toFixed(0)}
          />
        </div>
      </section>

      <p className="page-foot">
        Current (raw) value: Soil {reading.soil.toFixed(0)}% · {reading.tempC.toFixed(1)}°C · RH{' '}
        {reading.humidity.toFixed(0)}% · light {reading.light.toFixed(0)}%
      </p>
    </div>
  )
}
