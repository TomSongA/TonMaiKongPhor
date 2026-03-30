import { useMemo, useState } from 'react'
import { generateDaySummary } from '../lib/sensorLogic'
import './Page.css'

function padRows(samples) {
  return samples.map((r, idx) => ({
    id: idx + 1,
    time: new Date(r.at).toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }),
    soil: r.soil.toFixed(1),
    temp: r.tempC.toFixed(1),
    humidity: r.humidity.toFixed(0),
    light: r.light.toFixed(0),
  }))
}

export default function DataTablePage() {
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })

  const rows = useMemo(() => {
    const ts = new Date(dateStr + 'T12:00:00').getTime()
    const day = generateDaySummary(ts)
    return padRows(day.samples)
  }, [dateStr])

  return (
    <div className="page">
      <header className="page-head">
        <h1>ตารางข้อมูล</h1>
        <p className="page-desc">เลือกวันที่เพื่อดึงชุดตัวอย่าง (ชุดเดียวกับโหมดปฏิทิน)</p>
      </header>

      <div className="table-toolbar">
        <label className="field-inline">
          วันที่
          <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
        </label>
      </div>

      <div className="table-scroll card-block">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>เวลา</th>
              <th>ดิน (%)</th>
              <th>อุณหภูมิ (°C)</th>
              <th>RH (%)</th>
              <th>แสง (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.time}</td>
                <td>{r.soil}</td>
                <td>{r.temp}</td>
                <td>{r.humidity}</td>
                <td>{r.light}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
