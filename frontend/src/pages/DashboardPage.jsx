import PsiBar from '../components/PsiBar'
import SensorCard from '../components/SensorCard'
import { useLiveSensors } from '../hooks/useLiveSensors'
import './Page.css'

export default function DashboardPage() {
  const { reading, history, lastUpdated, psi } = useLiveSensors()

  const lastStr = new Date(lastUpdated).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })

  return (
    <div className="page">
      <header className="page-head">
        <h1>แดชบอร์ด</h1>
        <p className="page-meta">
          <span className="live-dot" aria-hidden />
          อัปเดตล่าสุด: <time dateTime={new Date(lastUpdated).toISOString()}>{lastStr}</time>
        </p>
      </header>

      <PsiBar value={psi} />

      <section aria-labelledby="sensors-heading">
        <h2 id="sensors-heading" className="section-title">
          เซ็นเซอร์แบบเรียลไทม์
        </h2>
        <div className="sensor-grid">
          <SensorCard
            title="ความชื้นดิน"
            unit="%"
            history={history}
            dataKey="soil"
            color="var(--chart-soil)"
            formatValue={(v) => v.toFixed(0)}
          />
          <SensorCard
            title="อุณหภูมิ"
            unit="°C"
            history={history}
            dataKey="tempC"
            color="var(--chart-temp)"
            formatValue={(v) => v.toFixed(1)}
          />
          <SensorCard
            title="ความชื้นอากาศ"
            unit="% RH"
            history={history}
            dataKey="humidity"
            color="var(--chart-hum)"
            formatValue={(v) => v.toFixed(0)}
          />
          <SensorCard
            title="ความเข้มแสง"
            unit="%"
            history={history}
            dataKey="light"
            color="var(--chart-light)"
            formatValue={(v) => v.toFixed(0)}
          />
        </div>
      </section>

      <p className="page-foot">
        ค่าปัจจุบัน (ดิบ): ดิน {reading.soil.toFixed(0)}% · {reading.tempC.toFixed(1)}°C · RH{' '}
        {reading.humidity.toFixed(0)}% · แสง {reading.light.toFixed(0)}%
      </p>
    </div>
  )
}
