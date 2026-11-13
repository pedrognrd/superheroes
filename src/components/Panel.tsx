import type { ReactNode } from 'react'
import './Panel.css'

interface PanelProps {
  title?: string
  /** "dark": pestaña oscura con texto claro · "light": pestaña clara con texto oscuro */
  variant?: 'dark' | 'light'
  align?: 'left' | 'right' | 'center'
  className?: string
  children: ReactNode
}

/** Marco común a todo el diseño: borde azul + pestaña de título */
export function Panel({ title, variant = 'dark', align = 'left', className = '', children }: PanelProps) {
  return (
    <section className={`panel panel--${variant} ${className}`}>
      {title && <h2 className={`panel__tab panel__tab--${align}`}>{title}</h2>}
      <div className="panel__body">{children}</div>
    </section>
  )
}
