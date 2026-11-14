import { useEffect, useState } from 'react'
import './StatRing.css'

interface StatRingProps {
  label: string
  value: number | null
  color: string
}

// Anillo fino como el de circle-progress del diseño original (grosor 4 sobre 85 px)
const STROKE = 4.7
const R = 50 - STROKE / 2
const CIRCUMFERENCE = 2 * Math.PI * R
const DURATION = 1200 // ms
const DELAY = 200 // ms: tras el fundido de entrada del panel

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Cuenta de 0 a `target` al montarse; con "reducir movimiento" va directa al valor final */
function useCountUp(target: number) {
  const [current, setCurrent] = useState(() => (prefersReducedMotion() ? target : 0))
  useEffect(() => {
    if (prefersReducedMotion()) return
    let frame = 0
    let start: number | null = null
    const step = (now: number) => {
      start ??= now + DELAY
      const t = Math.min(1, Math.max(0, (now - start) / DURATION))
      setCurrent(target * easeOutCubic(t))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    // Respaldo: si el navegador no pinta fotogramas (pestaña o panel oculto), el valor final llega igual
    const done = setTimeout(() => setCurrent(target), DELAY + DURATION + 150)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(done)
    }
  }, [target])
  return current
}

/** Anillo circular con el valor (0-100) de un powerstat; crece desde 0 al aparecer */
export function StatRing({ label, value, color }: StatRingProps) {
  const pct = value == null ? 0 : Math.min(100, Math.max(0, value))
  const shown = useCountUp(pct)
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
          strokeDashoffset={CIRCUMFERENCE * (1 - shown / 100)}
          // Sin trazo mientras vale 0 (el extremo redondeado dejaría un punto)
          opacity={shown > 0.5 ? 1 : 0}
        />
        <text x="50" y="55" style={{ fill: 'var(--line)' }} aria-hidden="true">
          {value == null ? '?' : Math.round(shown)}
        </text>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  )
}
