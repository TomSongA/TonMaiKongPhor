import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  filterSamplesByTimeRange,
  generateMonthDays,
} from '../lib/sensorLogic'
import './Page.css'

function sameDay(a, b) {
  const x = new Date(a)
  const y = new Date(b)
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  )
}

function isToday(ts) {
  return sameDay(ts, Date.now())
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date())
  const { days, year, month } = useMemo(() => generateMonthDays(cursor), [cursor])

  /** null = ใช้ค่าเริ่มต้นตามเดือน (วันนี้ถ้าเป็นเดือนปัจจุบัน ไม่เช่นนั้นวันที่ 1) */
  const [pickedDayNum, setPickedDayNum] = useState(null)
  const [startHour, setStartHour] = useState(6)
  const [endHour, setEndHour] = useState(20)

  const defaultDayNum = useMemo(() => {
    const today = new Date()
    if (today.getFullYear() === year && today.getMonth() === month) {
      return today.getDate()
    }
    return 1
  }, [year, month])

  const activeDayNum = pickedDayNum ?? defaultDayNum
  const selected = days[activeDayNum - 1] ?? days[0]

  const monthLabel = new Date(year, month, 1).toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric',
  })

  const firstWeekday = new Date(year, month, 1).getDay()
  const blanks = Array.from({ length: firstWeekday }, (_, i) => (
    <div key={`b-${i}`} className="cal-cell cal-cell--empty" />
  ))

  const chartSamples = useMemo(() => {
    if (!selected) return []
    if (isToday(selected.date)) {
      return filterSamplesByTimeRange(selected.samples, startHour, endHour)
    }
    return selected.samples
  }, [selected, startHour, endHour])

  const chartRows = chartSamples.map((r) => ({
    time: new Date(r.at).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    ดิน: Math.round(r.soil),
    อุณหภูมิ: Number(r.tempC.toFixed(1)),
    RH: Math.round(r.humidity),
    แสง: Math.round(r.light),
  }))

  function pickDay(dayNumber) {
    setPickedDayNum(dayNumber)
  }

  function prevMonth() {
    setPickedDayNum(null)
    setCursor(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setPickedDayNum(null)
    setCursor(new Date(year, month + 1, 1))
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>ปฏิทินข้อมูล</h1>
        <p className="page-desc">
          เลือกวันเพื่อดูสรุป — ถ้าเป็นวันนี้สามารถกำหนดช่วงเวลาในวันเพื่อดูกราฟได้
        </p>
      </header>

      <div className="cal-toolbar">
        <button type="button" className="btn-ghost" onClick={prevMonth}>
          ‹ เดือนก่อน
        </button>
        <strong className="cal-month">{monthLabel}</strong>
        <button type="button" className="btn-ghost" onClick={nextMonth}>
          เดือนถัด ›
        </button>
      </div>

      <div className="cal-grid">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {blanks}
        {days.map((d) => {
          const n = new Date(d.date).getDate()
          const active = n === activeDayNum
          return (
            <button
              key={d.date}
              type="button"
              className={
                'cal-cell' +
                (d.stressed ? ' cal-cell--stress' : '') +
                (active ? ' cal-cell--active' : '') +
                (isToday(d.date) ? ' cal-cell--today' : '')
              }
              onClick={() => pickDay(n)}
            >
              <span className="cal-day-num">{n}</span>
              <span className="cal-day-psi" title="PSI">
                {Math.round(d.psi)}
              </span>
            </button>
          )
        })}
      </div>

      {selected && (
        <section className="cal-detail card-block">
          <h2 className="section-title">
            {new Date(selected.date).toLocaleDateString('th-TH', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <p className="detail-summary">
            PSI เฉลี่ยวันนี้: <strong>{Math.round(selected.psi)}</strong>
            {selected.stressed ? (
              <span className="badge badge--warn">มีช่วงเครียด</span>
            ) : (
              <span className="badge badge--ok">โดยรวมปกติ</span>
            )}
          </p>

          {isToday(selected.date) && (
            <div className="time-range">
              <label>
                เริ่ม (ชั่วโมง)
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                />
              </label>
              <label>
                ถึง (ชั่วโมง)
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                />
              </label>
            </div>
          )}

          <div className="chart-wrap chart-wrap--tall">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartRows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--chart-axis)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="ดิน" stroke="var(--chart-soil)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="อุณหภูมิ" stroke="var(--chart-temp)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="RH" stroke="var(--chart-hum)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="แสง" stroke="var(--chart-light)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  )
}
