'use client'

import { useEffect, useState } from 'react'
import { fetchReadingsRange } from '../lib/sensorApi'
import './Page.css'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const timeOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}

function formatTime(at) {
  return new Date(at).toLocaleTimeString('en-GB', timeOptions)
}

function exportCSV(rows, dateStr) {
  const headers = ['#','time','soil (%)','temp (°C)','RH (%)','light (lux)','outdoor temp','outdoor RH','rain %','PSI score','PSI level']
  const csvRows = [
    headers.join(','),
    ...rows.map(r =>
      [r.id, r.time, r.soil, r.temp, r.humidity, r.light, r.outdoorTemp, r.outdoorHumidity, r.rainProb, r.psiScore, r.psiLevel].join(',')
    ),
  ]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tonmai-${dateStr}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportAll(dateStr) {
  const earliest = '2026-03-28'
  const today = new Date().toISOString().slice(0, 10)
  const data = await fetchReadingsRange(earliest, today)
  const rows = data.map((r, idx) => ({
    id: r.id ?? idx + 1,
    time: new Date(r.at).toLocaleString('en-GB'),
    soil: ((r.soil / 4095) * 100).toFixed(1),
    temp: r.tempC.toFixed(1),
    humidity: r.humidity.toFixed(0),
    light: r.lightLux != null ? String(Math.round(r.lightLux)) : r.light?.toFixed(0) ?? '-',
    outdoorTemp: r.outdoor_temp ?? '-',
    outdoorHumidity: r.outdoor_humidity ?? '-',
    rainProb: r.rain_probability ?? '-',
    psiScore: r.psiScore ?? '-',
    psiLevel: r.psiLevel ?? '-',
  }))
  exportCSV(rows, `all-${today}`)
}

export default function DataTablePage() {
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportingAll, setExportingAll] = useState(false)


  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchReadingsRange(dateStr, dateStr)
        if (cancelled) return
        setRows(
          data.map((r, idx) => {
            const hasLux = r.lightLux != null
            const lightReading = hasLux
              ? String(Math.round(r.lightLux))
              : r.light != null
                ? r.light.toFixed(0)
                : '-'

            return {
              id: r.id ?? idx + 1,
              time: formatTime(r.at),
              soil: ((r.soil / 4095) * 100).toFixed(1),
              temp: r.tempC.toFixed(1),
              humidity: r.humidity.toFixed(0),
              light: lightReading,
              outdoorTemp: r.outdoor_temp != null ? r.outdoor_temp : '-',
              outdoorHumidity: r.outdoor_humidity != null ? r.outdoor_humidity : '-',
              rainProb: r.rain_probability != null ? r.rain_probability : '-',
              psiScore: r.psiScore ?? '-',
              psiLevel: r.psiLevel ?? '-',
            }
          }),
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
  console.log('dateStr:', dateStr)
  return (
    <div className="page">
      <header className="page-head">
        <h1>Data table</h1>
        <p className="page-desc">See every sensor reading captured on the date you pick.</p>
      </header>

      <div className="table-toolbar">
        <DatePicker
          selected={(() => {
            const [y, m, d] = dateStr.split('-').map(Number)
            return new Date(y, m - 1, d)
          })()}
          onChange={(date) => {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            setDateStr(`${y}-${m}-${d}`)
          }}
          dateFormat="dd/MM/yyyy"
          calendarClassName="tonmai-calendar"
          showPopperArrow={false}
          popperPlacement="bottom-start"
        />
        <button
          type="button"
          className="btn-ghost"
          onClick={() => exportCSV(rows, dateStr)}
          disabled={rows.length === 0}
        >
          Export CSV
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            setExportingAll(true)
            await exportAll()
            setExportingAll(false)
          }}
          disabled={exportingAll}
        >
          {exportingAll ? 'Exporting…' : 'Export all'}
        </button>
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
              <th>light (lux)</th>
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
                <td>{r.light}</td>
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
