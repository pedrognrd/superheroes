import type { Hero, StatKey } from '../types'
import { STAT_KEYS } from '../types'
import { Panel } from './Panel'
import { StatRing } from './StatRing'

const STAT_COLORS: Record<StatKey, string> = {
  intelligence: '#a45be0',
  strength: '#5fe0b0',
  speed: '#e0457a',
  durability: '#f0c58a',
  power: '#9fd8f2',
  combat: '#f0763a',
}

const toStat = (v: string) => (v === 'null' || v === '' ? null : Number(v))

export function PowerStatsPanel({ hero }: { hero: Hero }) {
  return (
    <Panel title="Powerstats" className="powerstats">
      <div className="powerstats__grid">
        {STAT_KEYS.map((key) => (
          <StatRing key={key} label={key} value={toStat(hero.powerstats[key])} color={STAT_COLORS[key]} />
        ))}
      </div>
    </Panel>
  )
}
