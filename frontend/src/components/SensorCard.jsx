'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './SensorCard.css'

function chartData(history, key) {
  return history.map((r, i) => ({
    i,
    t: new Date(r.at).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    v: Number(r[key].toFixed(key === 'tempC' ? 1 : 0)),
  }))
}

export default function SensorCard({
  title,
  unit,
  history,
  dataKey,
  color,
  formatValue,
}) {
  const latest = history[history.length - 1]
  const display = latest ? formatValue(latest[dataKey]) : '—'
  const data = chartData(history, dataKey)

  return (
    <article className="sensor-card">
      <header className="sensor-card__head">
        <h3>{title}</h3>
        <p className="sensor-card__value">
          {display}
          <span className="sensor-card__unit">{unit}</span>
        </p>
      </header>
      <div className="sensor-card__chart">
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="var(--chart-axis)" interval="preserveStartEnd" />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(_, p) => (p?.[0]?.payload?.t ? String(p[0].payload.t) : '')}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              fill={`url(#g-${dataKey})`}
              strokeWidth={2}
              isAnimationActive
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
