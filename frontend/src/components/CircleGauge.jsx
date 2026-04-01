'use client'

export default function CircleGauge({ label, value, max, color }) {
  const radius = 80
  const stroke = 20
  const normalized = Math.min(value / max, 1)

  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - normalized)

  return (
    <div className="circle-gauge">
      <svg width="200" height="200">
        {/* พื้นหลัง */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="var(--border)"
          strokeWidth={stroke}
          fill="none"
        />

        {/* progress */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
        />
      </svg>

      <div className="circle-center">
        <strong>{Math.round(normalized * 100)}</strong>
      </div>

      <p>{label}</p>
    </div>
  )
}