import { useEffect, useState } from 'react'
import designUrl from '../assets/design/menu_closed.png'

// Maqueta original (building_theme/root/index.html: <div class="img_bg">) para comparar
// el diseño con lo construido. Tecla D: apagada → debajo → encima al 50 % → apagada.
// Se recuerda en este navegador; los visitantes no la ven si no pulsan D.
type Mode = 'off' | 'under' | 'over'
const MODES: Mode[] = ['off', 'under', 'over']
const KEY = 'design-overlay'
const LABEL: Record<Mode, string> = { off: '', under: 'Design: under', over: 'Design: over 50%' }

function readMode(): Mode {
  try {
    const saved = localStorage.getItem(KEY)
    return MODES.includes(saved as Mode) ? (saved as Mode) : 'off'
  } catch {
    return 'off'
  }
}

export function DesignOverlay() {
  const [mode, setMode] = useState<Mode>(readMode)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey || e.altKey) return
      // No interferir mientras se escribe en el buscador u otro campo
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return
      setMode((m) => {
        const next = MODES[(MODES.indexOf(m) + 1) % MODES.length]
        try {
          localStorage.setItem(KEY, next)
        } catch {
          /* sin almacenamiento: solo dura hasta recargar */
        }
        return next
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (mode === 'off') return null
  return (
    <>
      <div className={`img_bg img_bg--${mode}`} style={{ backgroundImage: `url(${designUrl})` }} aria-hidden="true" />
      <span className="img_bg__badge">{LABEL[mode]} · D</span>
    </>
  )
}
