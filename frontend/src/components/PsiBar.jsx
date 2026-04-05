import './PsiBar.css'

export default function PsiBar({
  value,
  label = 'Plant wellness score (0–100)',
  hint = 'Higher numbers mean healthier plants. We will flag it if the score drops.',
}) {
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
      <p className="psi-hint">{hint}</p>
    </section>
  )
}
