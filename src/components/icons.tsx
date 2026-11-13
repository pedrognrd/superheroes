// Iconos SVG propios (sin dependencias ni atribuciones). Se pueden sustituir
// más adelante por los de Flaticon guardándolos en src/assets/icons.

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

export function SearchIcon({ size = 24 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" d="M15.5 15.5 21 21" />
    </svg>
  )
}

export function ChevronIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2.5" d="m5 9 7 7 7-7" />
    </svg>
  )
}

/** Silueta humana para el panel de apariencia */
export function Silhouette() {
  return (
    <svg viewBox="0 0 120 300" className="silhouette" aria-hidden="true">
      <defs>
        <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3aa0d8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#0b3a5c" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        fill="url(#sil)"
        d="M60 6c-11 0-18 9-18 20 0 10 6 19 18 19s18-9 18-19C78 15 71 6 60 6Zm-17 44c-14 3-22 10-24 24l-7 72c-1 7 9 9 11 2l9-62 2 2-3 56 4 6-2 132c0 8 13 9 14 1l9-120h8l9 120c1 8 14 7 14-1l-2-132 4-6-3-56 2-2 9 62c2 7 12 5 11-2l-7-72c-2-14-10-21-24-24-6 3-11 4-17 4s-11-1-17-4Z"
      />
    </svg>
  )
}
