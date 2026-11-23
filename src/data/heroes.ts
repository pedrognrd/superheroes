import raw from './heroes.json'
import type { Hero } from '../types'
import { DUPLICATES, isDuplicate } from './duplicates'
import { fixPublisher } from './publisherFixes'
import { fixAliases, fixPlaceOfBirth, fixRelatives } from './biographyFixes'
import { PORTRAITS } from './portraits'
import akabab from './akabab-images.json'
import { fallbackImage } from './portraitFallbacks'

// superherodb.com bloquea ahora las imágenes enlazadas desde otras webs (Cloudflare, 403).
// Las mismas, con el mismo id, están en el repositorio akabab/superhero-api servido por jsDelivr.
const AKABAB = 'https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images'
const SLUGS = akabab as Record<string, string>
/** Retrato de akabab en tamaño md (miniaturas) o lg (ficha) */
export const akababImage = (id: string, size: 'md' | 'lg') => (SLUGS[id] ? `${AKABAB}/${size}/${SLUGS[id]}.jpg` : undefined)

/** Todos los héroes de la API (sin duplicados), con la editorial, el lugar de nacimiento y los familiares corregidos */
export const heroes: Hero[] = (raw as Hero[])
  .filter((h) => !isDuplicate(h.id))
  .map((h) => ({
    ...h,
    biography: {
      ...h.biography,
      publisher: fixPublisher(h.id, h.biography.publisher),
      'place-of-birth': fixPlaceOfBirth(h.id, h.biography['place-of-birth']),
      aliases: fixAliases(h.id, h.biography.aliases),
    },
    connections: { ...h.connections, relatives: fixRelatives(h.id, h.connections.relatives) },
    image: { ...h.image, url: PORTRAITS[h.id]?.url ?? akababImage(h.id, 'lg') ?? fallbackImage(h.id) ?? h.image.url },
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
