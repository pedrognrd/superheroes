// Iconos de la interfaz. Calavera, corazón y prohibido son SVG propios; el resto
// son los SVG de src/assets/icons (proyecto anterior de Pasajero Gráfico).
import closeSvg from '../assets/icons/close.svg'
import dropdownSvg from '../assets/icons/dropdown.svg'
import manSvg from '../assets/icons/man.svg'
import searchSvg from '../assets/icons/search.svg'
import womanSvg from '../assets/icons/woman.svg'

type IconProps = { color?: string; size?: number }

export function SkullIcon({ color = '#f0a070', size = 30 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path
        fill={color}
        d="M16 3c-6 0-10 4-10 9.5 0 3 1.3 5.3 3 6.7V22a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.8c1.7-1.4 3-3.7 3-6.7C26 7 22 3 16 3Zm-4.5 12.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Zm9 0a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6ZM16 18.5l-1.5-2.3h3L16 18.5Z"
      />
      <path stroke={color} strokeWidth="2.6" strokeLinecap="round" d="M5 25l22 4M27 25 5 29" />
    </svg>
  )
}

export function HeartIcon({ color = '#ff5a8a', size = 30 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path
        fill={color}
        d="M16 28s-11-7-11-15a6 6 0 0 1 11-3.3A6 6 0 0 1 27 13c0 8-11 15-11 15Z"
      />
    </svg>
  )
}

export function BanIcon({ color = '#4ee08a', size = 30 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="16" r="11" fill="none" stroke={color} strokeWidth="3" />
      <path stroke={color} strokeWidth="3" d="M8.5 23.5l15-15" />
    </svg>
  )
}

/**
 * Icono SVG monocromo pintado con máscara CSS: toma el color del texto (currentColor)
 * o el que se le pase. Lo usan los logos de editoriales y grupos y los iconos de
 * interfaz de src/assets (del proyecto anterior de Pasajero Gráfico).
 */
export function MaskIcon({
  src,
  width = 24,
  height = width,
  color,
  className = '',
  label,
}: {
  src: string
  width?: number | string
  height?: number | string
  color?: string
  className?: string
  /** Texto alternativo; sin él el icono es decorativo */
  label?: string
}) {
  const mask = `url("${src}")`
  return (
    <span
      className={`mask-icon ${className}`.trim()}
      style={{ width, height, color, maskImage: mask, WebkitMaskImage: mask }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}

export const SearchIcon = ({ size = 22 }: IconProps) => <MaskIcon src={searchSvg} width={size} />
export const ChevronIcon = ({ size = 14 }: IconProps) => <MaskIcon src={dropdownSvg} width={size} height={size * 0.6} />
export const CloseIcon = ({ size = 16 }: IconProps) => <MaskIcon src={closeSvg} width={size} />

/** Silueta para el panel de apariencia: mujer o hombre según el género */
export function Silhouette({ gender }: { gender: string }) {
  const female = /^female$/i.test(gender)
  return (
    <span className="silhouette" aria-hidden="true">
      <MaskIcon src={female ? womanSvg : manSvg} width="100%" height="100%" className="silhouette__shape" />
    </span>
  )
}
