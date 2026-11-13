import type { Hero } from '../types'
import { parseGroups } from '../utils/parse'
import { GroupBadge } from './GroupBadge'
import { Panel } from './Panel'

export function ConnectionsPanel({ hero }: { hero: Hero }) {
  const groups = parseGroups(hero.connections['group-affiliation'])
  return (
    <Panel title="Connections" className="list-panel connections">
      <ul className="rows">
        {groups.length === 0 && <li className="rows__empty">No known groups</li>}
        {groups.map((g, i) => (
          <li key={i} className="rows__item">
            <span className="rows__text">{g.name}</span>
            <span className="rows__icon">
              <GroupBadge name={g.name} formerly={g.formerly} />
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function AliasesPanel({ hero }: { hero: Hero }) {
  const aliases = hero.biography.aliases.filter((a) => a && a !== '-')
  return (
    <Panel title="Aliases" className="list-panel aliases">
      <ul className="rows">
        {aliases.length === 0 && <li className="rows__empty">No known aliases</li>}
        {aliases.map((a) => (
          <li key={a} className="rows__item">
            <span className="rows__text">"{a}"</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
