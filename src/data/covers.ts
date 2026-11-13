import comicVine from './covers.json'
import fandom from './covers-fandom.json'
import tmdb from './covers-tmdb.json'
import wikipedia from './covers-wikipedia.json'

export interface Cover {
  image: string
  title: string
  /** Página de la fuente donde leer más (número en Comic Vine, película en TMDB…) */
  page?: string
  /** Nombre de la fuente, para el título del enlace */
  source?: string
}

type Generated = Record<string, { image?: string | null; title?: string; page?: string | null } | null>

// covers-tmdb.json   → `npm run fetch:covers:tmdb` (cine y TV, ver screenWorks.ts)
// covers-wikipedia.json → `npm run fetch:covers:wikipedia` (cine/TV/libros, ver wikipediaWorks.ts)
// covers.json        → `npm run fetch:covers` (Comic Vine)
// covers-fandom.json → `npm run fetch:covers:fandom` (marvel/dc.fandom.com), respaldo
// null = se buscó y no hay coincidencia fiable.
// Orden de prioridad: TMDB y Wikipedia solo tienen personajes de cine/TV/libros,
// que así no toman la portada de una adaptación al cómic posterior.
const SOURCES: [string, Generated][] = [
  ['TMDB', tmdb as Generated],
  ['Wikipedia', wikipedia as Generated],
  ['Comic Vine', comicVine as Generated],
  ['Fandom', fandom as Generated],
]

// Correcciones manuales: id del héroe → portada. Tienen prioridad sobre todo lo demás.
// Para una imagen local, guárdala en /public/covers y usa '/covers/archivo.jpg'.
const MANUAL: Record<string, Cover> = {
  // Ozymandias: Comic Vine da DC Spotlight #1 (1985, número promocional)
  '508': {
    image: 'https://static.wikia.nocookie.net/marvel_dc/images/c/ca/Watchmen_1.jpg/revision/latest?cb=20080618074453',
    title: 'Watchmen Vol. 1 #1',
    page: 'https://dc.fandom.com/wiki/Watchmen_Vol_1_1',
    source: 'Fandom',
  },
}

export function getCover(heroId: string): Cover | null {
  if (MANUAL[heroId]) return MANUAL[heroId]
  for (const [source, data] of SOURCES) {
    const c = data[heroId]
    if (c?.image) return { image: c.image, title: c.title ?? '', page: c.page ?? undefined, source }
  }
  return null
}
