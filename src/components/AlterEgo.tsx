import { useEffect, useRef, useState, type ReactNode } from 'react'
import { fixHeight } from '../data/biographyFixes'
import { findRelativeHero } from '../data/heroLookup'
import type { Hero } from '../types'
import { isEmpty, parseRelatives, type RelativeStatus } from '../utils/parse'
import { HeartIcon, Silhouette, silhouetteOf, SkullIcon } from './icons'
import { Panel } from './Panel'

const show = (v: string) => (isEmpty(v) ? 'Unknown' : v)

// Figura de Alter-ego: alto de la silueta y líneas discontinuas a su derecha
const FIGURE_H = 280
const FIGURE_W = 180 // ancho fijo de figura + líneas (igual para las dos siluetas)
const LINE_TOP = 3 // la primera línea, a la altura de la cabeza
const LINE_COUNT = 16
const LINE_BOTTOM = FIGURE_H - 12 // la última, a la altura del pie que queda más arriba
const LINE_STEP = (LINE_BOTTOM - LINE_TOP) / (LINE_COUNT - 1)
const LINE_GAP = 8 // separación entre el contorno y el inicio de cada línea
const lineY = (i: number) => Math.round(LINE_TOP + i * LINE_STEP)

/**
 * Borde derecho de la figura a la altura de cada línea (en px desde su izquierda).
 * Dibuja el SVG en un canvas y busca el último píxel opaco en una franja de ±5 px,
 * para que las líneas arranquen pegadas al contorno (hombros, brazos, piernas…).
 */
function useRightContour(src: string, width: number) {
  const [edges, setEdges] = useState<{ src: string; xs: number[] } | null>(null)
  useEffect(() => {
    let alive = true
    const img = new Image()
    img.src = src
    img
      .decode()
      .then(() => {
        const w = Math.round(width)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = FIGURE_H
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, w, FIGURE_H)
        const { data } = ctx.getImageData(0, 0, w, FIGURE_H)
        const xs = Array.from({ length: LINE_COUNT }, (_, i) => {
          let right = -1
          const y0 = Math.max(0, lineY(i) - 5)
          const y1 = Math.min(FIGURE_H - 1, lineY(i) + 5)
          for (let y = y0; y <= y1; y++)
            for (let x = w - 1; x > right; x--)
              if (data[(y * w + x) * 4 + 3] > 40) {
                right = x
                break
              }
          return right < 0 ? w / 2 : right
        })
        if (alive) setEdges({ src, xs })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [src, width])
  return edges?.src === src ? edges.xs : null
}

function AppearanceFigure({ gender }: { gender: string }) {
  const { src, ratio } = silhouetteOf(gender)
  const figW = FIGURE_H * ratio
  const edges = useRightContour(src, figW)
  return (
    <div className="appearance__figure" style={{ width: FIGURE_W, height: FIGURE_H }}>
      <Silhouette gender={gender} height={FIGURE_H} />
      <div className="appearance__lines" aria-hidden="true">
        {edges?.map((x, i) => (
          <span key={i} className={i === 0 ? 'is-head' : undefined} style={{ top: lineY(i), left: x + LINE_GAP }} />
        ))}
        <span className="appearance__circles" style={{ top: lineY(0) - 8 }}>
          <span className="header-deco__out">
            <span className="header-deco__in" />
          </span>
        </span>
      </div>
    </div>
  )
}

/** Silueta + atributos físicos */
export function AppearancePanel({ hero }: { hero: Hero }) {
  const a = hero.appearance
  // Solo medidas: un texto sin cifras (p. ej. un lugar) no es una altura
  const height = fixHeight(hero.id, a.height).filter((v) => !isEmpty(v) && !/^0/.test(v) && /\d/.test(v)).join(' / ')
  const weight = a.weight.filter((v) => !isEmpty(v) && !/^0/.test(v)).join(' / ')
  const rows: [string, string][] = [
    ['Gender', show(a.gender)],
    ['Race', show(a.race)],
    ['Height', height || 'Unknown'],
    ['Weight', weight || 'Unknown'],
    ['Eye-color', show(a['eye-color'])],
    ['Hair-color', show(a['hair-color'])],
  ]
  return (
    <div className="appearance">
      <AppearanceFigure gender={a.gender} />
      <dl className="appearance__data">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}:</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const STATUS_ICON: Record<RelativeStatus, ReactNode> = {
  deceased: <SkullIcon />,
  alleged: <SkullIcon color="#b06ae8" />,
  alive: <HeartIcon />,
}

/** Nombre del familiar; si también está en la base de datos, enlaza a su ficha */
interface RelativeNameProps {
  name: string
  relation: string
  hero: Hero
  onSelect: (id: string) => void
}

function RelativeName({ name, relation, hero, onSelect }: RelativeNameProps) {
  const match = findRelativeHero(name, relation, hero)
  const text = (
    <>
      {name}
      {relation && ` (${relation})`}
    </>
  )
  const full = relation ? `${name} (${relation})` : name
  if (!match) return (
    <span className="rows__text rows__text--right" title={full}>
      {text}
    </span>
  )
  return (
    <a
      className="rows__text rows__text--right rows__link"
      href={window.location.pathname}
      title={`${full} · Go to ${match.name}`}
      onClick={(e) => {
        e.preventDefault()
        onSelect(match.id)
      }}
    >
      {text}
    </a>
  )
}

const RELATIVES_ROWS = 6

export function RelativesPanel({ hero, onSelect }: { hero: Hero; onSelect: (id: string) => void }) {
  const relatives = parseRelatives(hero.connections.relatives)
  return (
    <Panel title="Relatives" align="right" className="list-panel relatives">
      <ul className={`rows${relatives.length > RELATIVES_ROWS ? ' rows--scroll' : ''}`}>
        {relatives.map((r, i) => (
          <li key={i} className="rows__item rows__item--icon-left">
            <span className="rows__icon" title={r.status}>
              {STATUS_ICON[r.status]}
            </span>
            <RelativeName name={r.name} relation={r.relation} hero={hero} onSelect={onSelect} />
          </li>
        ))}
        {/* Siempre 6 filas: se completan con filas vacías (la primera avisa si no hay ninguno) */}
        {Array.from({ length: Math.max(0, RELATIVES_ROWS - relatives.length) }, (_, i) => (
          <li
            key={`empty-${i}`}
            className="rows__item rows__item--icon-left rows__item--empty"
            aria-hidden={relatives.length > 0 || i > 0}
          >
            <span className="rows__icon" />
            <span className="rows__text rows__text--right">
              {relatives.length === 0 && i === 0 ? 'No known relatives' : '\u00a0'}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

// Desplazamiento del texto largo de Occupation: px por segundo y pausa en cada extremo
const MARQUEE_SPEED = 25
const MARQUEE_PAUSE = 2

/** Texto en una línea; si no cabe, se desplaza despacio de derecha a izquierda y vuelve a empezar */
function Marquee({ text }: { text: string }) {
  const boxRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)
  useEffect(() => {
    const box = boxRef.current
    const inner = textRef.current
    if (!box || !inner) return
    const measure = () => setOverflow(Math.max(0, Math.ceil(inner.scrollWidth - box.clientWidth)))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    // La fuente puede cargar después: vuelve a medir
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [text])
  useEffect(() => {
    const inner = textRef.current
    if (!inner || !overflow || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Pausa al principio, recorrido a velocidad constante, pausa al final y vuelta a empezar
    const move = overflow / MARQUEE_SPEED
    const total = move + MARQUEE_PAUSE * 2
    const start = MARQUEE_PAUSE / total
    const end = (MARQUEE_PAUSE + move) / total
    const anim = inner.animate(
      [
        { transform: 'translateX(0)', offset: 0 },
        { transform: 'translateX(0)', offset: start },
        { transform: `translateX(-${overflow}px)`, offset: end },
        { transform: `translateX(-${overflow}px)`, offset: 1 },
      ],
      { duration: total * 1000, iterations: Infinity },
    )
    return () => anim.cancel()
  }, [overflow, text])
  return (
    <span ref={boxRef} className={`marquee${overflow ? ' is-long' : ''}`} title={overflow ? text : undefined}>
      <span ref={textRef} className="marquee__text">
        {text}
      </span>
    </span>
  )
}

export function OccupationBar({ hero }: { hero: Hero }) {
  return (
    <div className="occupation">
      <span className="occupation__key">Occupation</span>
      <span className="occupation__value">
        <Marquee text={show(hero.work.occupation)} />
      </span>
    </div>
  )
}
