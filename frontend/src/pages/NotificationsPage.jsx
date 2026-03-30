import { useMemo } from 'react'
import { evaluateStress, generateDaySummary, randomReading } from '../lib/sensorLogic'
import { useLiveSensors } from '../hooks/useLiveSensors'
import './Page.css'

export default function NotificationsPage() {
  const { reading, stressReasons, lastUpdated } = useLiveSensors()

  const historyAlerts = useMemo(() => {
    const out = []
    for (let i = 0; i < 5; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const day = generateDaySummary(d.getTime())
      const reasons = evaluateStress(day.summary)
      if (reasons.length) {
        out.push({
          id: `day-${i}`,
          at: day.date,
          title: 'ต้นไม้มีสัญญาณเครียดในวันนี้ (สรุปเฉลี่ย)',
          reasons,
        })
      }
    }
    const spot = randomReading()
    const spotReasons = evaluateStress(spot)
    if (spotReasons.length) {
      out.unshift({
        id: 'spot-1',
        at: spot.at - 3600000,
        title: 'การวัดย้อนหลัง 1 ชม. (ตัวอย่าง)',
        reasons: spotReasons,
      })
    }
    return out
  }, [])

  const liveStr = new Date(lastUpdated).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })

  return (
    <div className="page">
      <header className="page-head">
        <h1>แจ้งเตือน</h1>
        <p className="page-desc">
          แจ้งเมื่อค่าอยู่นอกช่วงที่กำหนด — บอกได้ว่าปัจจัยไหนที่ทำให้ &quot;เครียด&quot;
        </p>
      </header>

      <section className="card-block alert-hero">
        <h2 className="section-title">สถานะล่าสุด</h2>
        <p className="page-meta">
          อ้างอิงเวลา: <time dateTime={new Date(lastUpdated).toISOString()}>{liveStr}</time>
        </p>
        {stressReasons.length === 0 ? (
          <p className="alert-ok">ตอนนี้ค่าอยู่ในช่วงที่เหมาะสม — ไม่พบสัญญาณเครียดจากเกณฑ์ชุดนี้</p>
        ) : (
          <div className="alert-list">
            <p className="alert-bad-title">ต้นไม้มีความเครียดจากค่าต่อไปนี้:</p>
            <ul>
              {stressReasons.map((r) => (
                <li key={r.key}>
                  <strong>{r.label}</strong>
                  <span>{r.detail}</span>
                </li>
              ))}
            </ul>
            <p className="page-foot">
              ค่าปัจจุบัน: ดิน {reading.soil.toFixed(0)}% · {reading.tempC.toFixed(1)}°C · RH{' '}
              {reading.humidity.toFixed(0)}% · แสง {reading.light.toFixed(0)}%
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">ประวัติแจ้งเตือน (ตัวอย่าง)</h2>
        <ul className="notif-history">
          {historyAlerts.map((item) => (
            <li key={item.id} className="notif-card">
              <div className="notif-card__head">
                <strong>{item.title}</strong>
                <time dateTime={new Date(item.at).toISOString()}>
                  {new Date(item.at).toLocaleString('th-TH', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </div>
              <ul className="notif-reasons">
                {item.reasons.map((r) => (
                  <li key={r.key}>
                    <span>{r.label}</span> — {r.detail}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {historyAlerts.length === 0 && (
          <p className="page-foot">ยังไม่มีรายการในช่วงตัวอย่าง</p>
        )}
      </section>
    </div>
  )
}
