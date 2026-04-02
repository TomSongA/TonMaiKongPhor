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

  const lightLabel =
    latest.lightLux != null ? `${Math.round(latest.lightLux)} lux` : `${latest.light.toFixed(0)}%`

  const stats = [
    { key: 'soil', label: 'Soil', value: `${latest.soil.toFixed(0)}%` },
    { key: 'temp', label: 'Temp', value: `${latest.tempC.toFixed(1)}°C` },
    { key: 'humidity', label: 'Humidity', value: `${latest.humidity.toFixed(0)}%` },
    { key: 'light', label: 'Light', value: lightLabel },
  ]

  return (
    <div className="realtime-chart">
      <div className="realtime-chart__stats">
        {stats.map((stat) => (
          <div key={stat.key} className="realtime-chip" data-tone={stat.key}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="realtime-chart__canvas">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 16 }}
              stroke="var(--chart-axis)"
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 16 }} stroke="var(--chart-axis)" />

            <Tooltip
              contentStyle={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 16,
              }}
              formatter={(value, name) => {
                const num = Number(value).toFixed(2)
                if (name === 'temp') return [`${num} °C`, 'Temp']
                if (name === 'RH') return [`${num} %`, 'Humidity']
                if (name === 'soil') return [`${num} %`, 'Soil']
                if (name === 'light') return [`${num} (chart scale)`, 'Light']
                return num
              }}
            />

            <Legend wrapperStyle={{ fontSize: '18px' }} />

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
