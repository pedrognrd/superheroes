import comicVine from './covers.json'
import fandom from './covers-fandom.json'
import tmdb from './covers-tmdb.json'
import wikipedia from './covers-wikipedia.json'

export interface Cover {
  image: string
  title: string
}

type Generated = Record<string, { image?: string | null; title?: string } | null>

// covers-tmdb.json   → `npm run fetch:covers:tmdb` (cine y TV, ver screenWorks.ts)
// covers-wikipedia.json → `npm run fetch:covers:wikipedia` (cine/TV/libros, ver wikipediaWorks.ts)
// covers.json        → `npm run fetch:covers` (Comic Vine)
// covers-fandom.json → `npm run fetch:covers:fandom` (marvel/dc.fandom.com), respaldo
// null = se buscó y no hay coincidencia fiable.
// Orden de prioridad: TMDB y Wikipedia solo tienen personajes de cine/TV/libros,
// que así no toman la portada de una adaptación al cómic posterior.
const SOURCES = [tmdb as Generated, wikipedia as Generated, comicVine as Generated, fandom as Generated]

// Correcciones manuales: id del héroe → portada. Tienen prioridad sobre todo lo demás.
// Para una imagen local, guárdala en /public/covers y usa '/covers/archivo.jpg'.
const MANUAL: Record<string, Cover> = {}

export function getCover(heroId: string): Cover | null {
  if (MANUAL[heroId]) return MANUAL[heroId]
  for (const source of SOURCES) {
    const c = source[heroId]
    if (c?.image) return { image: c.image, title: c.title ?? '' }
  }
  return null
}
