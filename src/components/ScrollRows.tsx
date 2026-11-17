import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

/**
 * Lista de filas con barra de scroll propia: el tirador mide lo mismo que una fila
 * (la barra nativa lo calcula según el contenido y no se puede fijar). Se arrastra,
 * y al pulsar en el carril avanza o retrocede una fila.
 */
export function ScrollRows({ scroll, children }: { scroll: boolean; children: ReactNode }) {
  const listRef = useRef<HTMLUListElement>(null)
  const [thumb, setThumb] = useState({ top: 0, height: 0 })

  // Alto de fila, recorrido del scroll y del tirador
  const metrics = useCallback(() => {
    const list = listRef.current
    if (!list) return null
    // Alto de una fila normal: la más baja (un nombre largo puede ocupar dos líneas)
    const heights = [...list.children].map((li) => li.getBoundingClientRect().height).filter(Boolean)
    const row = heights.length ? Math.min(...heights) : 0
    const track = list.clientHeight
    const height = Math.min(row, track)
    return { list, row, maxScroll: list.scrollHeight - list.clientHeight, maxTop: track - height, height }
  }, [])

  const update = useCallback(() => {
    const m = metrics()
    if (!m) return
    const top = m.maxScroll > 0 ? (m.list.scrollTop / m.maxScroll) * m.maxTop : 0
    setThumb((t) => (t.top === top && t.height === m.height ? t : { top, height: m.height }))
  }, [metrics])

  useEffect(() => {
    const list = listRef.current
    if (!scroll || !list) return
    list.scrollTop = 0
    update()
    const ro = new ResizeObserver(update)
    ro.observe(list)
    return () => ro.disconnect()
  }, [scroll, children, update])

  const drag = (e: PointerEvent<HTMLSpanElement>) => {
    const m = metrics()
    if (!m || m.maxTop <= 0) return
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startY = e.clientY
    const startScroll = m.list.scrollTop
    const move = (ev: globalThis.PointerEvent) => {
      m.list.scrollTop = startScroll + ((ev.clientY - startY) * m.maxScroll) / m.maxTop
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  // Clic en el carril: una fila hacia donde se ha pulsado
  const page = (e: PointerEvent<HTMLDivElement>) => {
    const m = metrics()
    if (!m) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    m.list.scrollBy({ top: y < thumb.top ? -m.row : m.row, behavior: 'smooth' })
  }

  return (
    <div className="rows-wrap">
      <ul ref={listRef} className={`rows${scroll ? ' rows--scroll' : ''}`} onScroll={scroll ? update : undefined}>
        {children}
      </ul>
      {scroll && (
        <div className="rows__track" onPointerDown={page} aria-hidden="true">
          <span className="rows__thumb" style={{ top: thumb.top, height: thumb.height }} onPointerDown={drag} />
        </div>
      )}
    </div>
  )
}
