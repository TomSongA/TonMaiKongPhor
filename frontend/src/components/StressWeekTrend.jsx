'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { fetchStressHistory, fetchStressHistorySummary } from '../lib/sensorApi'

const LEVEL_COLOR = {
  Healthy: 'var(--ok-text, #52c41a)',
  'Mild Stress': 'var(--warn-text, #faad14)',
  Critical: 'var(--danger, #ff4d4f)',
}

const TREND_STYLE = {
  improving: { bg: 'var(--ok-soft)', color: 'var(--ok-text)', label: 'Improving' },
  worsening: { bg: 'var(--danger-soft, rgba(255,77,79,0.12))', color: 'var(--danger, #ff4d4f)', label: 'Worsening' },
  stable: { bg: 'var(--border)', color: 'var(--text-muted)', label: 'Stable' },
}

export default function StressWeekTrend() {
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchStressHistory(), fetchStressHistorySummary()])
      .then(([hist, sum]) => {
        if (cancelled) return
        setHistory(hist)
        setSummary(sum)
      })
      .catch(() => {
        if (!cancelled) { setHistory([]); setSummary(null) }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <p className="page-foot">Loading weekly trend…</p>
  if (!history.length) return <p className="page-foot">No data for the past week yet.</p>

  const chartData = history.map((h) => ({
    date: new Date(h.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
    psi: h.avg_psi,
    level: h.psi_level,
  }))

  const trendStyle = summary ? (TREND_STYLE[summary.trend] ?? TREND_STYLE.stable) : null

  return (
    <div className="realtime-card" style={{ maxWidth: '100%' }}>
      <div className="realtime-card__header">
        <h3>Stress trend — past 7 days</h3>
        {summary && trendStyle && (
          <span
            style={{
              background: trendStyle.bg,
              color: trendStyle.color,
              borderRadius: 999,
              padding: '4px 14px',
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            {summary.icon} {trendStyle.label}
          </span>
        )}
      </div>

      {summary && (
        <p className="realtime-card__hint">{summary.message}</p>
      )}

      <div className="realtime-chart__canvas">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 14 }} stroke="var(--chart-axis)" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 14 }} stroke="var(--chart-axis)" />
            <Tooltip
              contentStyle={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 15,
              }}
              formatter={(value, _name, props) => [
                `${value} (${props.payload.level})`,
                'Avg PSI',
              ]}
            />
            <Bar dataKey="psi" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={LEVEL_COLOR[entry.level] ?? 'var(--accent)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="realtime-card__hint" style={{ marginTop: 4 }}>
        Bar color: green = Healthy · yellow = Mild Stress · red = Critical
      </p>
    </div>
  )
}
