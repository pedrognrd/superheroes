import comicVine from './covers.json'
import fandom from './covers-fandom.json'

export interface Cover {
  image: string
  title: string
}

type Generated = Record<string, { image?: string | null; title?: string } | null>

// covers.json        → `npm run fetch:covers` (Comic Vine)
// covers-fandom.json → `npm run fetch:covers:fandom` (marvel/dc.fandom.com), respaldo
// null = se buscó y no hay coincidencia fiable.
const SOURCES = [comicVine as Generated, fandom as Generated]

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
