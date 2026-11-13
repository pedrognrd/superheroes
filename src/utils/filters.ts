import { heroes, PUBLISHERS } from '../data/heroes'
import type { Hero, StatKey } from '../types'
import { groupKey, parseGroups, placeLabel, primaryPlace } from './parse'

export interface Filters {
  query: string
  sortBy: StatKey | ''
  group: string
  base: string
  publisher: string
}

export const EMPTY_FILTERS: Filters = { query: '', sortBy: '', group: '', base: '', publisher: '' }

const heroGroups = (h: Hero) =>
  parseGroups(h.connections['group-affiliation'])
    .filter((g) => !g.formerly)
    .map((g) => groupKey(g.name))

const heroBase = (h: Hero) => {
  const p = primaryPlace(h.work.base)
  return p ? placeLabel(p) : null
}

/** Los N valores más frecuentes, para rellenar los desplegables */
function topValues(values: (string | null)[], n: number) {
  const counts = new Map<string, number>()
  values.forEach((v) => v && counts.set(v, (counts.get(v) ?? 0) + 1))
  return [...counts.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([v]) => v)
    .sort((a, b) => a.localeCompare(b))
}

export const GROUP_OPTIONS = topValues(heroes.flatMap(heroGroups), 40)
export const BASE_OPTIONS = topValues(heroes.map(heroBase), 30)
export const PUBLISHER_OPTIONS = PUBLISHERS.map((p) => ({
  value: p.name,
  label: `${p.name.replace(' Comics', '')} (${p.count})`,
}))

export function applyFilters(f: Filters): Hero[] {
  const q = f.query.trim().toLowerCase()
  const list = heroes.filter(
    (h) =>
      (!q || h.name.toLowerCase().includes(q) || h.biography['full-name'].toLowerCase().includes(q)) &&
      (!f.publisher || h.biography.publisher === f.publisher) &&
      (!f.group || heroGroups(h).includes(f.group)) &&
      (!f.base || heroBase(h) === f.base),
  )
  if (f.sortBy) {
    const key = f.sortBy
    const val = (h: Hero) => Number(h.powerstats[key]) || -1
    return list.sort((a, b) => val(b) - val(a))
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}
