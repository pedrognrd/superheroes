import type { Hero } from '../types'
import { parseGroups } from '../utils/parse'
import unknownIcon from '../assets/icons/unknown.png'
import { BADGE_SIZE, GroupBadge } from './GroupBadge'
import { MaskIcon } from './icons'
import { aliasHero } from '../data/heroLookup'
import { HeroLink, HeroText } from './HeroText'
import { Panel } from './Panel'
import { ScrollRows } from './ScrollRows'

// Filas fijas de cada lista: con más elementos, la lista se desplaza
const CONNECTIONS_VISIBLE = 4
const ALIASES_ROWS = 4

export function ConnectionsPanel({ hero, onSelect }: { hero: Hero; onSelect: (id: string) => void }) {
  const groups = parseGroups(hero.connections['group-affiliation'])
  // Siempre 4 filas: se completan con filas vacías (la primera avisa si no hay ninguna)
  const fillers = Math.max(0, CONNECTIONS_VISIBLE - groups.length)
  return (
    <Panel title="Connections" className="list-panel connections">
      <ScrollRows scroll={groups.length > CONNECTIONS_VISIBLE}>
        {groups.map((g, i) => (
          <li key={i} className="rows__item">
            <span className="rows__text" title={g.name}>
              <HeroText text={g.name} hero={hero} onSelect={onSelect} />
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
      </ScrollRows>
    </Panel>
  )
}

/** Alias que enlaza a la ficha del personaje solo si el alias entero es ese personaje */
function AliasText({ alias, hero, onSelect }: { alias: string; hero: Hero; onSelect: (id: string) => void }) {
  const target = aliasHero(alias, hero)
  return target ? <HeroLink hero={target} onSelect={onSelect}>{alias}</HeroLink> : <>{alias}</>
}

export function AliasesPanel({ hero, onSelect }: { hero: Hero; onSelect: (id: string) => void }) {
  // Sin comillas: algunos alias de la API vienen entrecomillados ("Frankie")
  const aliases = hero.biography.aliases
    .map((a) => a.replace(/["“”]/g, '').trim())
    .filter((a) => a && a !== '-')
  // Siempre 4 filas: se completan con filas vacías (la primera avisa si no hay ninguno)
  const fillers = Math.max(0, ALIASES_ROWS - aliases.length)
  return (
    <Panel title="Aliases" className="list-panel aliases">
      <ScrollRows scroll={aliases.length > ALIASES_ROWS}>
        {aliases.map((a) => (
          <li key={a} className="rows__item">
            <span className="rows__text" title={a}>
              <AliasText alias={a} hero={hero} onSelect={onSelect} />
            </span>
          </li>
        ))}
        {Array.from({ length: fillers }, (_, i) => (
          <li key={`empty-${i}`} className="rows__item rows__item--empty" aria-hidden={aliases.length > 0 || i > 0}>
            <span className="rows__text">{aliases.length === 0 && i === 0 ? 'No known aliases' : '\u00a0'}</span>
          </li>
        ))}
      </ScrollRows>
    </Panel>
  )
}
