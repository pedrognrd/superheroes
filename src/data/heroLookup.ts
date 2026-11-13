import type { Hero } from '../types'
import { heroes } from './heroes'
import { isEmpty } from '../utils/parse'

// Busca un personaje de la base de datos por su nombre ("Scarlet Witch") o su
// nombre real ("Wanda Maximoff"), sin distinguir mayúsculas. Lo usa la tabla
// Relatives para enlazar a los familiares que también están en la API.
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const byName = new Map<string, Hero[]>()
const byFullName = new Map<string, Hero[]>()
for (const h of heroes) {
  const add = (map: Map<string, Hero[]>, key: string) => {
    if (!key) return
    map.set(key, [...(map.get(key) ?? []), h])
  }
  add(byName, norm(h.name))
  if (!isEmpty(h.biography['full-name'])) add(byFullName, norm(h.biography['full-name']))
}

/** Entre varios candidatos, el de la misma editorial que `context`; si no, el primero */
const pick = (list: Hero[] | undefined, context: Hero) => {
  const others = list?.filter((h) => h.id !== context.id)
  if (!others?.length) return null
  return others.find((h) => h.biography.publisher === context.biography.publisher) ?? others[0]
}

/**
 * Personaje que corresponde a un familiar, o null.
 * `alias` es el texto entre paréntesis cuando nombra al personaje:
 * "Wanda Maximoff (Scarlet Witch)" → Scarlet Witch.
 */
export function findRelativeHero(name: string, alias: string, context: Hero): Hero | null {
  const n = norm(name)
  const a = norm(alias)
  // Solo nombres propios: "offspring", "unnamed son"… no se enlazan
  if (n.length < 3 || !/^[A-Z0-9"]/.test(name.trim())) return null
  return pick(byName.get(n), context) ?? pick(byName.get(a), context) ?? pick(byFullName.get(n), context)
}
