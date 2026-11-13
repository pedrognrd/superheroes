import raw from './heroes.json'
import type { Hero } from '../types'
import { DUPLICATES, isDuplicate } from './duplicates'
import { fixPublisher } from './publisherFixes'

/** Todos los héroes de la API (sin duplicados), con la editorial corregida */
export const heroes: Hero[] = (raw as Hero[])
  .filter((h) => !isDuplicate(h.id))
  .map((h) => ({
    ...h,
    biography: { ...h.biography, publisher: fixPublisher(h.id, h.biography.publisher) },
  }))

/** Editoriales ordenadas por número de héroes */
export const PUBLISHERS: { name: string; count: number }[] = (() => {
  const counts = new Map<string, number>()
  heroes.forEach((h) => counts.set(h.biography.publisher, (counts.get(h.biography.publisher) ?? 0) + 1))
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})()

export const heroById = (id: string) => {
  const target = DUPLICATES[id] ?? id
  return heroes.find((h) => h.id === target)
}
