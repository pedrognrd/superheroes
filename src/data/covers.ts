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
  // Captain Atom: debutó en Charlton (Space Adventures #33, 1960), antes de pasar a DC
  '150': {
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Cover_of_Space_Adventures_no._33.jpg/500px-Cover_of_Space_Adventures_no._33.jpg',
    title: 'Space Adventures #33 (1960)',
    page: 'https://en.wikipedia.org/wiki/Captain_Atom',
    source: 'Wikipedia',
  },
}

// Números de Comic Vine que no son primeras apariciones (resúmenes o promocionales
// donde salen muchos personajes): se ignoran y se usa la siguiente fuente.
const COMIC_VINE_IGNORED = new Set([
  'History of the DC Universe #2', // Booster Gold, Captain Atom, Kilowog
  'DC Spotlight #1', // Ozymandias
])

export function getCover(heroId: string): Cover | null {
  if (MANUAL[heroId]) return MANUAL[heroId]
  for (const [source, data] of SOURCES) {
    const c = data[heroId]
    if (source === 'Comic Vine' && c?.title && COMIC_VINE_IGNORED.has(c.title)) continue
    if (c?.image) return { image: c.image, title: c.title ?? '', page: c.page ?? undefined, source }
  }
  return null
}
