import type { ReactNode } from 'react'
import type { Hero } from '../types'
import { isEmpty, parseRelatives, type RelativeStatus } from '../utils/parse'
import { HeartIcon, Silhouette, SkullIcon } from './icons'
import { Panel } from './Panel'

const show = (v: string) => (isEmpty(v) ? 'Unknown' : v)

/** Silueta + atributos físicos */
export function AppearancePanel({ hero }: { hero: Hero }) {
  const a = hero.appearance
  const height = a.height.filter((v) => !isEmpty(v) && !/^0/.test(v)).join(' / ')
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
      <div className="appearance__figure">
        <Silhouette />
        <div className="appearance__lines" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>
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

export function RelativesPanel({ hero }: { hero: Hero }) {
  const relatives = parseRelatives(hero.connections.relatives)
  return (
    <Panel title="Relatives" align="right" className="list-panel relatives">
      <ul className="rows">
        {relatives.length === 0 && <li className="rows__empty">No known relatives</li>}
        {relatives.map((r, i) => (
          <li key={i} className="rows__item rows__item--icon-left">
            <span className="rows__icon" title={r.status}>
              {STATUS_ICON[r.status]}
            </span>
            <span className="rows__text rows__text--right">
              {r.name}
              {r.relation && ` (${r.relation})`}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function OccupationBar({ hero }: { hero: Hero }) {
  return (
    <div className="occupation">
      <span className="occupation__key">Occupation</span>
      <span className="occupation__value">{show(hero.work.occupation)}</span>
    </div>
  )
}
