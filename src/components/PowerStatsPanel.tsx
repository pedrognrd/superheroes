import type { Hero } from '../types'
import { STAT_KEYS } from '../types'
import { Panel } from './Panel'
import { StatRing } from './StatRing'

const toStat = (v: string) => (v === 'null' || v === '' ? null : Number(v))

export function PowerStatsPanel({ hero }: { hero: Hero }) {
  return (
    <Panel title="Powerstats" className="powerstats">
      <div className="powerstats__grid">
        {STAT_KEYS.map((key) => (
          <StatRing key={key} label={key} value={toStat(hero.powerstats[key])} color="var(--ring)" />
        ))}
      </div>
    </Panel>
  )
}
