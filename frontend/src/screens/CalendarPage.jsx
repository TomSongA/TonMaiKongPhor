'use client'

import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { filterSamplesByTimeRange, generateMonthDays } from '../lib/sensorLogic'
import './Page.css'

function sameDay(a, b) {
  const x = new Date(a), y = new Date(b)
  return x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
}
function isToday(ts) { return sameDay(ts, Date.now()) }

export default function CalendarPage() {
  const [cursor, setCursor] = useState(null)
  const [pickedDayNum, setPickedDayNum] = useState(null)
  const [startHour, setStartHour] = useState(6)
  const [endHour, setEndHour] = useState(20)

  useEffect(() => { setCursor(new Date()) }, [])

  const monthData = useMemo(() => cursor ? generateMonthDays(cursor) : null, [cursor])

  const defaultDayNum = useMemo(() => {
    if (!monthData) return 1
    const today = new Date()
    if (today.getFullYear() === monthData.year && today.getMonth() === monthData.month) {
      return today.getDate()
    }
    return 1
  }, [monthData])

  const activeDayNum = pickedDayNum ?? defaultDayNum
  const selected = monthData ? (monthData.days[activeDayNum - 1] ?? monthData.days[0]) : null

  const chartSamples = useMemo(() => {
    if (!selected) return []
    return isToday(selected.date)
      ? filterSamplesByTimeRange(selected.samples, startHour, endHour)
      : selected.samples
  }, [selected, startHour, endHour])

  const chartRows = chartSamples.map((r) => ({
    time: new Date(r.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    soil: Math.round(r.soil),
    temp: Number(r.tempC.toFixed(1)),
    RH: Math.round(r.humidity),
    light: Math.round(r.light),
  }))

  if (!monthData) return null

  const { days, year, month } = monthData
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const firstWeekday = new Date(year, month, 1).getDay()
  const blanks = Array.from({ length: firstWeekday }, (_, i) => (
    <div key={`b-${i}`} className="cal-cell cal-cell--empty" />
  ))

  function prevMonth() { setPickedDayNum(null); setCursor(new Date(year, month - 1, 1)) }
  function nextMonth() { setPickedDayNum(null); setCursor(new Date(year, month + 1, 1)) }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Data calendar</h1>
        <p className="page-desc">
          Select a date to view a summary. If today is selected, you can specify a time period within the day to view the graph.
        </p>
      </header>

      {/* layout 2 คอลัมน์ */}
      <div className="cal-layout">

        {/* ซ้าย — ปฏิทิน */}
        <div className="cal-left">
          <div className="cal-toolbar">
            <button type="button" className="btn-ghost" onClick={prevMonth}>‹ previous month</button>
            <strong className="cal-month">{monthLabel}</strong>
            <button type="button" className="btn-ghost" onClick={nextMonth}>Next month ›</button>
          </div>

          <div className="cal-grid">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="cal-dow">{d}</div>
            ))}
            {blanks}
            {days.map((d) => {
              const n = new Date(d.date).getDate()
              const active = n === activeDayNum
              return (
                <button key={d.date} type="button"
                  className={'cal-cell' + (d.stressed ? ' cal-cell--stress' : '') + (active ? ' cal-cell--active' : '') + (isToday(d.date) ? ' cal-cell--today' : '')}
                  onClick={() => setPickedDayNum(n)}
                >
                  <span className="cal-day-num">{n}</span>
                  <span className="cal-day-psi" title="PSI">{Math.round(d.psi)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ขวา — ข้อมูล */}
        <div className="cal-right">
          {selected ? (
            <section className="cal-detail card-block">
              <h2 className="section-title">
                {new Date(selected.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <p className="detail-summary">
                PSI average today: <strong>{Math.round(selected.psi)}</strong>
                {selected.stressed
                  ? <span className="badge badge--warn">There were stressful times.</span>
                  : <span className="badge badge--ok">Overall normal.</span>}
              </p>

              {isToday(selected.date) && (
                <div className="time-range">
                  <label>Start (hours)<input type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} /></label>
                  <label>Until (hours)<input type="number" min={1} max={24} value={endHour} onChange={(e) => setEndHour(Number(e.target.value))} /></label>
                </div>
              )}

              <div className="chart-wrap chart-wrap--tall">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartRows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="soil" stroke="var(--chart-soil)" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="temp" stroke="var(--chart-temp)" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="RH" stroke="var(--chart-hum)" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="light" stroke="var(--chart-light)" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : (
            <div className="cal-empty">
              <p>Select a date to view data.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}