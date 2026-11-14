import type { Hero } from '../types'
import { parseGroups } from '../utils/parse'
import unknownIcon from '../assets/icons/unknown.png'
import { BADGE_SIZE, GroupBadge } from './GroupBadge'
import { MaskIcon } from './icons'
import { Panel } from './Panel'

// Filas fijas de cada lista: con más elementos, la lista se desplaza
const CONNECTIONS_VISIBLE = 4
const ALIASES_ROWS = 4

export function ConnectionsPanel({ hero }: { hero: Hero }) {
  const groups = parseGroups(hero.connections['group-affiliation'])
  // Siempre 4 filas: se completan con filas vacías (la primera avisa si no hay ninguna)
  const fillers = Math.max(0, CONNECTIONS_VISIBLE - groups.length)
  return (
    <Panel title="Connections" className="list-panel connections">
      <ul className={`rows${groups.length > CONNECTIONS_VISIBLE ? ' rows--scroll' : ''}`}>
        {groups.map((g, i) => (
          <li key={i} className="rows__item">
            <span className="rows__text" title={g.name}>
              {g.name}
            </span>
            <span className="rows__icon">
              <GroupBadge name={g.name} formerly={g.formerly} />
            </span>
          </li>
        ))}
        {Array.from({ length: fillers }, (_, i) => (
          <li key={`empty-${i}`} className="rows__item rows__item--empty" aria-hidden={groups.length > 0 || i > 0}>
            <span className="rows__text">{groups.length === 0 && i === 0 ? 'No known groups' : '\u00a0'}</span>
            <span className="rows__icon">
              {groups.length === 0 && i === 0 && <MaskIcon src={unknownIcon} width={BADGE_SIZE} color="var(--line)" />}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function AliasesPanel({ hero }: { hero: Hero }) {
  const aliases = hero.biography.aliases.filter((a) => a && a !== '-')
  // Siempre 4 filas: se completan con filas vacías (la primera avisa si no hay ninguno)
  const fillers = Math.max(0, ALIASES_ROWS - aliases.length)
  return (
    <Panel title="Aliases" className="list-panel aliases">
      <ul className={`rows${aliases.length > ALIASES_ROWS ? ' rows--scroll' : ''}`}>
        {aliases.map((a) => (
          <li key={a} className="rows__item">
            <span className="rows__text" title={a}>
              "{a}"
            </span>
          </li>
        ))}
        {Array.from({ length: fillers }, (_, i) => (
          <li key={`empty-${i}`} className="rows__item rows__item--empty" aria-hidden={aliases.length > 0 || i > 0}>
            <span className="rows__text">{aliases.length === 0 && i === 0 ? 'No known aliases' : '\u00a0'}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
