'use client'

import { useEffect, useState } from 'react'
import { fetchReadingsRange } from '../lib/sensorApi'
import './Page.css'

export default function DataTablePage() {
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchReadingsRange(dateStr, dateStr)
        if (cancelled) return
        setRows(
          data.map((r, idx) => ({
            id: r.id ?? idx + 1,
            time: new Date(r.at).toLocaleString('en-GB', {
              dateStyle: 'short',
              timeStyle: 'medium',
            }),
            soil: r.soil.toFixed(1),
            temp: r.tempC.toFixed(1),
            humidity: r.humidity.toFixed(0),
            light: r.lightLux != null ? String(Math.round(r.lightLux)) : r.light.toFixed(0),
            lightUnit: r.lightLux != null ? 'lux' : 'scaled',
            outdoorTemp: r.outdoor_temp != null ? r.outdoor_temp : '-',
            outdoorHumidity: r.outdoor_humidity != null ? r.outdoor_humidity : '-',
            rainProb: r.rain_probability != null ? r.rain_probability : '-',
            psiScore: r.psiScore ?? '-',
            psiLevel: r.psiLevel ?? '-', 
          })),
        )
      } catch (e) {
        if (cancelled) return
        setError(e?.message || 'Failed to load')
        setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [dateStr])

  return (
    <div className="page">
      <header className="page-head">
        <h1>Data table</h1>
        <p className="page-desc">Rows from <code>/api/readings</code> for the selected date.</p>
      </header>

      <div className="table-toolbar">
        <label className="field-inline">
          Date
          <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
        </label>
      </div>

      {error && <p className="alert-bad-title">{error}</p>}
      {loading && <p className="page-foot">Loading…</p>}

      <div className="table-scroll card-block">
        <table className="data-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>#</th>
              <th>time</th>
              <th>soil (%)</th>
              <th>temp (°C)</th>
              <th>RH (%)</th>
              <th>light</th>
              <th>outdoor temp</th>
              <th>outdoor RH</th>
              <th>rain %</th>
              <th>PSI score</th>
              <th>PSI level</th>
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
                <td>
                  {r.light} {r.lightUnit}
                </td>
                <td>{r.outdoorTemp}</td>
                <td>{r.outdoorHumidity}</td>
                <td>{r.rainProb}</td>
                <td>{r.psiScore}</td>
                <td>{r.psiLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !error && (
          <p className="page-foot">No readings for this date.</p>
        )}
      </div>
    </div>
  )
}
