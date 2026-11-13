import './StatRing.css'

interface StatRingProps {
  label: string
  value: number | null
  color: string
}

const R = 40
const CIRCUMFERENCE = 2 * Math.PI * R

/** Anillo circular con el valor (0-100) de un powerstat */
export function StatRing({ label, value, color }: StatRingProps) {
  const pct = value == null ? 0 : Math.min(100, Math.max(0, value))
  return (
    <figure className="stat-ring">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${label}: ${value ?? 'sin dato'}`}>
        <circle className="stat-ring__track" cx="50" cy="50" r={R} />
        <circle
          className="stat-ring__value"
          cx="50"
          cy="50"
          r={R}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
        />
        <text x="50" y="52" style={{ fill: 'var(--text)' }}>
          {value ?? '?'}
        </text>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  )
}
