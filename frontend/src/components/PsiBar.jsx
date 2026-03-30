import './PsiBar.css'

export default function PsiBar({ value, label = 'ดัชนีสุขภาพต้นไม้ (PSI 0–100)' }) {
  const v = Math.round(Math.max(0, Math.min(100, value)))
  let tone = 'psi--good'
  if (v < 40) tone = 'psi--bad'
  else if (v < 65) tone = 'psi--mid'

  return (
    <section className="psi-card" aria-labelledby="psi-heading">
      <div className="psi-head">
        <h2 id="psi-heading">{label}</h2>
        <span className={'psi-value ' + tone}>{v}</span>
      </div>
      <div className="psi-track" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={'psi-fill ' + tone} style={{ width: `${v}%` }} />
      </div>
      <p className="psi-hint">
        คำนวณจากดิน อุณหภูมิ ความชื้น และแสง — สูงขึ้นแปลว่าสภาพแวดล้อมเหมาะสมกว่า
      </p>
    </section>
  )
}
