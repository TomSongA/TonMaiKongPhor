'use client'

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import CircleGauge from './CircleGauge'

const MAX_POINTS = 30  // จำนวนจุดที่แสดง (เลื่อนกราฟ)

function formatData(history) {
  return history.map((r) => ({
    time: new Date(r.at).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    soil: r.soil,
    temp: r.tempC,
    RH: r.humidity,
    light: r.light,
  }))
}

export default function RealtimeChart({ history }) {
  if (!history || history.length === 0) return null

  const midnightToday = new Date()
  midnightToday.setHours(0, 0, 0, 0)

  // เอาเฉพาะข้อมูลล่าสุด -> ทำให้กราฟเลื่อน
  const recent = history.filter((r) => r.at >= midnightToday.getTime())
  const latest = history[history.length - 1]
  const chartRows = formatData(recent)

  const rows = chartRows.length > 0 ? chartRows : formatData(history.slice(-MAX_POINTS))

  return (
    <div className="sensor-card">

        <div className="circle-grid">
            <CircleGauge label="Soil" value={latest.soil} max={100} color="var(--chart-soil)" />
            <CircleGauge label="Temp" value={latest.tempC} max={50} color="var(--chart-temp)" />
            <CircleGauge label="Humidity" value={latest.humidity} max={100} color="var(--chart-hum)" />
            <CircleGauge label="Light" value={latest.light} max={100} color="var(--chart-light)" />
        </div>

        <div className='stress-gauge'>
          <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={chartRows}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

              <XAxis
                  dataKey="time"
                  tick={{ fontSize: 18 }}
                  stroke="var(--chart-axis)"
                  interval="preserveStartEnd"
              />
              <YAxis
                  tick={{ fontSize: 20 }}
                  stroke="var(--chart-axis)"
              />

              <Tooltip
                  contentStyle={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  }}
                  formatter={(value, name) => {
                  if (name === 'temp') return [`${value} °C`, 'Temp']
                  if (name === 'RH') return [`${value} %`, 'Humidity']
                  if (name === 'soil') return [`${value} %`, 'Soil']
                  if (name === 'light') return [`${value} %`, 'Light']
                  return value
                  }}
              />

              <Legend wrapperStyle={{ fontSize: '26px' }}/>

                <Line type="monotone" dataKey="soil" stroke="var(--chart-soil)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="temp" stroke="var(--chart-temp)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="RH" stroke="var(--chart-hum)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="light" stroke="var(--chart-light)" dot={false} strokeWidth={2} />

              </LineChart>
          </ResponsiveContainer>
      </div>
    </div>
  )
}