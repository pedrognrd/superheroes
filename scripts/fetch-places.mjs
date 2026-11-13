// Prepara los lugares de los mapas (base y lugar de nacimiento) de antemano:
//   1. Geolocaliza cada lugar con Nominatim (OpenStreetMap), a 1 petición/s.
//   2. Si no existe en el mundo real (Attilan, Kahndaq…), busca su página de lugar
//      en marvel.fandom.com / dc.fandom.com y guarda su imagen.
// Resultado: src/data/places.json  { "Attilan, Blue Area of the Moon": { image, title, page } }
// Así la web no consulta Nominatim en cada visita y puede mostrar lugares ficticios.
//
// Regla: en lugares de Marvel/DC con página en Fandom, el mapa solo se usa si
// Nominatim devuelve el mismo nombre y es un lugar importante o de la región indicada.
//
// Uso:  npm run fetch:places                 (los que falten)
//       npm run fetch:places -- "Attilan, Atlantic Ocean"   (rehacer esos lugares)
import { readFile, writeFile } from 'node:fs/promises'
import { primaryPlace } from '../src/utils/parse.ts'
import { fixPublisher } from '../src/data/publisherFixes.ts'
import { isDuplicate } from '../src/data/duplicates.ts'
import { fixPlaceOfBirth } from '../src/data/biographyFixes.ts'

const UA = 'superhero-database-personal/1.0'
const OUT = new URL('../src/data/places.json', import.meta.url)
const HEROES = new URL('../src/data/heroes.json', import.meta.url)
// Wikis de Fandom donde buscar lugares, por editorial (en orden).
// Marvel/DC marcan sus lugares con "Location Template"; en las wikis de franquicia
// (Alien/Predator, Star Wars, Star Trek) se acepta la página si sus categorías
// indican que es un lugar (Planets, Locations, Cities…).
const WIKI = {
  'Marvel Comics': ['marvel.fandom.com'],
  'Icon Comics': ['marvel.fandom.com'],
  'DC Comics': ['dc.fandom.com'],
  Wildstorm: ['dc.fandom.com'],
  'Dark Horse Comics': ['avp.fandom.com', 'darkhorse.fandom.com'],
  'George Lucas': ['starwars.fandom.com'],
  'Star Trek': ['memory-alpha.fandom.com'],
}
// Lugares fijados a mano con una imagen concreta de Fandom: textos que no son un
// lugar (el de Alien es "Your chest :)") o que tienen muchas variantes (la escuela
// Xavier aparece escrita de 15 formas). `match` es el texto exacto o un patrón.
// Con `file` se toma la imagen de Fandom; con `image`, esa URL directamente.
// Con `base` (mismo formato) se usa otra imagen en el panel Base, que es vertical.
const MANUAL = [
  // Krypton: el mapa de "The Krypton Chronicles" (a 900 px desde el original de 1920 px),
  // horizontal para Place of birth; en Base, la imagen vertical de Fandom
  {
    match: 'Krypton',
    base: { host: 'dc.fandom.com', file: 'Krypton 001.jpg', title: 'Krypton', page: 'Krypton' },
    image:
      'https://images.theconversation.com/files/115988/original/image-20160322-32323-6qoi9x.jpg?ixlib=rb-4.1.1&q=75&auto=format&w=900&fit=clip',
    title: 'Map of Krypton',
    page: 'https://theconversation.com/how-astronomers-could-find-the-real-planet-krypton-56646',
  },
  // Smallville: en Base, el cartel "Home of Smallville" de Cloverdale (rodaje de la serie), de Wikimedia Commons
  {
    match: /^Smallville\b/,
    host: 'dc.fandom.com',
    file: 'Smallville Kansas 0001.jpg',
    title: 'Smallville, Kansas',
    page: 'Smallville,_Kansas',
    base: {
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Smallville-sign1.jpg/500px-Smallville-sign1.jpg',
      title: 'Smallville',
      page: 'https://en.wikipedia.org/wiki/Smallville_(comics)',
    },
  },
  // Hell's Kitchen: la imagen principal de su ficha de lugar en Comic Vine (vertical)
  {
    match: /^Hell's Kitchen\b/,
    image: 'https://comicvine.gamespot.com/a/uploads/scale_medium/12/124259/7711256-rco014_1606318733.jpg',
    title: "Hell's Kitchen",
    page: 'https://comicvine.gamespot.com/hells-kitchen/4020-42295/',
  },
  // Metropolis: la de Fandom; en Base, una viñeta vertical con el Daily Planet
  {
    match: /^Metropolis\b/,
    host: 'dc.fandom.com',
    file: 'Metropolis 001.jpg',
    title: 'Metropolis',
    page: 'Metropolis',
    base: {
      image: 'https://i.pinimg.com/736x/7d/ac/d8/7dacd88ef1dd69e02449a83a49d1d6cb.jpg',
      title: 'Metropolis',
      page: 'https://dc.fandom.com/wiki/Metropolis',
    },
  },
  // Wakanda: la bandera (horizontal) en Place of birth; en Base, la vista de Wakanda
  {
    match: /^Wakanda\b/,
    host: 'marvel.fandom.com',
    file: 'Flag of Wakanda from Black Panther Vol 6 4 0001.jpg',
    title: 'Wakanda',
    page: 'Wakanda',
    base: { host: 'marvel.fandom.com', file: 'Wakanda from Black Panther Vol 6 4 0001.jpg', title: 'Wakanda', page: 'Wakanda' },
  },
  // Keystone City: en Base, una viñeta vertical
  {
    match: /^Keystone City\b/,
    host: 'dc.fandom.com',
    file: 'Keystone City 01.jpg',
    title: 'Keystone City',
    page: 'Keystone_City',
    base: { host: 'dc.fandom.com', file: 'Keystone City 004.jpg', title: 'Keystone City', page: 'Keystone_City' },
  },
  // Sauron: Arda, el mundo de Tolkien (ilustración del artículo de Dimitra Fimi)
  {
    match: 'Arda',
    image: 'https://dimitrafimi.org/wp-content/uploads/2023/09/il_1588xN.3612989696_n521-1024x710.jpg',
    title: "Tolkien's Arda",
    page: 'https://dimitrafimi.org/tolkiens-arda-an-introduction/',
  },
  // Apocalypse: la nave celestial
  {
    match: /^Celestial Ship\b/,
    host: 'marvel.fandom.com',
    file: 'Celestial Ship (Clone) (Earth-616) from Uncanny X-Force Vol 1 14 0001.jpg',
    title: 'Celestial Ship',
    page: 'Celestial_Ship_(Clone)_(Earth-616)',
  },
  // Silver Surfer: "mobile throughout the universe" → los Pilares de la Creación (JWST, dominio público)
  {
    match: /^mobile throughout the universe$/i,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Pillars_of_Creation_%28NIRCam_Image%29.jpg/500px-Pillars_of_Creation_%28NIRCam_Image%29.jpg',
    title: 'The universe · Pillars of Creation (JWST)',
    page: 'https://commons.wikimedia.org/wiki/File:Pillars_of_Creation_(NIRCam_Image).jpg',
  },
  // Goku y Vegeta: Planet Vegeta (imagen de la wiki polaca de Dragon Ball; enlace a la inglesa)
  {
    match: 'Planet Vegeta',
    image:
      'https://static.wikia.nocookie.net/pldragonball/images/9/95/Planeta_Vegeta_%285%29_%28DBS%2C_film_001%29.jpg/revision/latest/scale-to-width-down/600?cb=20190203191626',
    title: 'Planet Vegeta',
    page: 'https://dragonball.fandom.com/wiki/Planet_Vegeta',
  },
  {
    match: 'Bizarro World',
    image: 'https://static.dc.com/dc/files/default_images/1567_400x600.jpg?w=600',
    title: 'Superman: Tales of the Bizarro World',
    page: 'https://www.dc.com/graphic-novels/superman-tales-of-the-bizarro-world',
  },
  { match: 'Your chest :)', host: 'avp.fandom.com', file: 'ALIEN chestburster1280.jpg', title: 'Chestburster', page: 'Chestburster' },
  // Thanos: Sanctuary II (base) y Titan (nacimiento; Nominatim lo confundía con un lugar real)
  {
    match: /^Sanctuary II\b/,
    host: 'marvelcinematicuniverse.fandom.com',
    file: 'Avengers Endgame Special Look.png',
    title: 'Sanctuary II',
    page: 'Sanctuary_II',
  },
  { match: 'Titan', host: 'marvelcinematicuniverse.fandom.com', file: 'AW 1 Trailer pic.png', title: 'Titan', page: 'Titan' },
  // Kang: la Tierra del siglo XXXI (Earth-6311)
  {
    match: /^Other Earth\b/,
    host: 'marvel.fandom.com',
    file: 'Earth-6311 from Avengers Vol 1 23 001.png',
    title: 'Earth-6311',
    page: 'Earth-6311',
  },
  // Hulk
  {
    match: /^Hulkbuster Base\b/,
    host: 'marvelanimated.fandom.com',
    file: 'Gamma Base.jpg',
    title: 'Gamma Base',
    page: 'Gamma_Base',
  },
  // Mandarin
  {
    match: 'Prometheus Corporation',
    host: 'marvel.fandom.com',
    file: 'Prometheus Gentech, Inc. from Invincible Iron Man Vol 1 21 001.png',
    title: 'Prometheus Gentech, Inc.',
    page: 'Prometheus_Gentech,_Inc.',
  },
  {
    match: 'Faltine Dimension',
    host: 'marvelcinematicuniverse.fandom.com',
    file: 'Dormammu-doctor-strange-2016.png',
    title: 'Faltine',
    page: 'Faltine',
  },
  {
    match: /^Earth-Prime\b/,
    host: 'dc.fandom.com',
    file: 'Earth-Prime.JPG',
    title: 'Earth-Prime',
    page: 'Earth-Prime',
  },
  {
    match: /^(the |professor )?(charles )?xavier('s)? (institute|insitute|school)/i,
    host: 'marvel.fandom.com',
    file: 'Graymalkin Prison from Uncanny X-Men Vol 6 27 001.jpg',
    title: "Xavier's School for Gifted Youngsters",
    page: "Xavier's_School_for_Gifted_Youngsters",
    // En Base, la mansión X de la Wikipedia (viñeta)
    base: {
      image: 'https://upload.wikimedia.org/wikipedia/en/d/d3/Xmansion.jpg',
      title: 'X-Mansion',
      page: 'https://en.wikipedia.org/wiki/X-Mansion',
    },
  },
]
const manualFor = (q) => MANUAL.find((m) => (typeof m.match === 'string' ? m.match === q : m.match.test(q)))
// Lugares que siempre van al mapa aunque tengan página en Fandom
const ALWAYS_MAP = /^new york( city)?\b/i
const PLACE_CATEGORY = /(locations?|planets?|moons?|cities|city|places|worlds?|star systems?|countries|regions|space stations?|buildings)\b/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const readJson = async (url, fallback) => {
  try {
    return JSON.parse(await readFile(url, 'utf8'))
  } catch {
    return fallback
  }
}

async function getJson(url, minGapMs) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const started = Date.now()
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
      if (res.ok) {
        const data = await res.json()
        await sleep(Math.max(0, minGapMs - (Date.now() - started)))
        return data
      }
      console.warn(`  HTTP ${res.status}, reintento ${attempt}`)
    } catch (e) {
      console.warn(`  ${e.message}, reintento ${attempt}`)
    }
    await sleep(5000 * attempt)
  }
  throw new Error('sin respuesta')
}

const norm = (t) =>
  (t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Primer resultado de Nominatim: coordenadas + datos para juzgar si es fiable */
async function geocode(place) {
  const data = await getJson(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(place)}`,
    1100,
  )
  const r = data[0]
  if (!r) return null
  return {
    coords: [Number(Number(r.lat).toFixed(5)), Number(Number(r.lon).toFixed(5))],
    importance: r.importance ?? 0,
    display: r.display_name ?? '',
  }
}

/**
 * ¿El resultado del mapa es de verdad ese lugar? Muchas ciudades de cómic coinciden
 * con sitios reales sin relación (Gotham City → una roca en California, Coast City →
 * Gold Coast). Exigimos el mismo nombre y, además, que sea un lugar importante
 * (New York, London) o que coincida la región indicada ("Hell's Kitchen, New York").
 */
function trustworthy(place, geo) {
  const [name, ...region] = place.split(',').map((x) => norm(x))
  const parts = geo.display.split(',').map((x) => norm(x))
  const words = (t) => ` ${t} `
  if (!words(parts[0]).includes(words(name)) && !words(name).includes(words(parts[0]))) return false
  if (geo.importance >= 0.6) return true
  const rest = parts.slice(1).join(' ')
  return region.some((r) => r && rest.includes(r))
}

const fandom = (host, params) =>
  getJson(`https://${host}/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`, 1000)

/** Página de lugar en Fandom con imagen, o null */
async function fandomPlace(host, place) {
  const names = [...new Set([place.split(',')[0].trim(), place])]
  for (let n = 0; n < names.length && n < 4; n++) {
    const name = names[n]
    const data = await fandom(host, { action: 'parse', page: name, prop: 'wikitext', section: '0', redirects: '1' })
    const text = data?.parse?.wikitext
    if (!text) continue
    // Desambiguación ("Asgard" → "Asgard (Realm)"): probar su primer enlace
    if (/\{\{\s*Disambig/i.test(text)) {
      const link = text.match(/\[\[([^\]|#]+)/)?.[1]?.trim()
      if (link && !names.includes(link)) names.push(link)
      continue
    }
    const title = data.parse.title
    const page = `https://${host}/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`
    if (!/Location Template/i.test(text)) {
      // Wikis de franquicia: lugar si lo dicen sus categorías; imagen principal de la página
      const info = await fandom(host, {
        action: 'query',
        titles: title,
        prop: 'categories|pageimages',
        cllimit: '50',
        piprop: 'thumbnail',
        pithumbsize: '600',
      })
      const pg = info?.query?.pages?.[0]
      const isPlace = (pg?.categories ?? []).some((c) => PLACE_CATEGORY.test(c.title))
      if (isPlace && pg?.thumbnail?.source) return { image: pg.thumbnail.source, title, page }
      continue
    }
    const file = text.match(/^\|\s*Image\s*=\s*(.+\.(?:jpe?g|png|gif|webp))/im)?.[1].trim()
    if (!file) continue
    const info = await fandom(host, { action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '600' })
    const url = info?.query?.pages?.[0]?.imageinfo?.[0]?.thumburl
    if (url) return { image: url, title, page }
  }
  return null
}

// Lugares de todos los héroes, con la wiki de su editorial
const heroes = (await readJson(HEROES, [])).filter((h) => !isDuplicate(h.id))
const places = new Map() // lugar → wikis donde buscarlo (si su editorial tiene)
for (const h of heroes) {
  const host = WIKI[fixPublisher(h.id, h.biography.publisher)] ?? null
  for (const text of [h.work.base, fixPlaceOfBirth(h.id, h.biography['place-of-birth'])]) {
    const q = primaryPlace(text)
    if (q && (!places.has(q) || (!places.get(q) && host))) places.set(q, host ?? null)
  }
}

const out = await readJson(OUT, {})
/** Imagen de una entrada manual: archivo de Fandom (`file`) o URL directa (`image`) */
async function resolveManual(m) {
  if (!m.file) return { image: m.image, title: m.title, page: m.page }
  const info = await fandom(m.host, { action: 'query', titles: `File:${m.file}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '600' })
  const image = info?.query?.pages?.[0]?.imageinfo?.[0]?.thumburl
  if (!image) console.log(`Manual: no se encontró ${m.file} en ${m.host}`)
  return image ? { image, title: m.title, page: `https://${m.host}/wiki/${encodeURI(m.page)}` } : null
}

for (const m of MANUAL) {
  const entry = await resolveManual(m)
  if (!entry) continue
  // `base`: imagen alternativa para el panel Base (vertical), si la principal es horizontal
  if (m.base) entry.base = await resolveManual(m.base)
  for (const q of places.keys()) {
    if (manualFor(q) === m) out[q] = entry
  }
}
await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
const only = process.argv.slice(2)
const todo = [...places].filter(([q]) => !manualFor(q) && (only.length ? only.includes(q) : !(q in out)))
console.log(`${places.size} lugares; ${todo.length} por procesar`)

let i = 0
for (const [q, host] of todo) {
  i++
  try {
    // New York / New York City: se busca solo ese nombre ("New York, formerly China…" no lo encuentra)
    const geo = await geocode(ALWAYS_MAP.test(q) ? q.match(ALWAYS_MAP)[0] : q)
    // Marvel/DC: si el lugar tiene página en Fandom y el mapa no es fiable, imagen de Fandom
    let comic = null
    for (const wiki of host ?? []) {
      comic = await fandomPlace(wiki, q)
      if (comic) break
    }
    let entry = null
    if (geo && (!comic || ALWAYS_MAP.test(q) || trustworthy(q, geo))) entry = { coords: geo.coords }
    else if (comic) entry = comic
    out[q] = entry
    console.log(`[${i}/${todo.length}] ${q} → ${entry?.coords ? 'mapa' : entry ? `Fandom: ${entry.title}` : 'nada'}`)
    await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  } catch (e) {
    console.log(`[${i}/${todo.length}] ${q} → ${e.message}; se reintentará`)
  }
}

const values = Object.values(out)
console.log(
  `Listo: ${values.filter((v) => v?.coords).length} en el mapa, ${values.filter((v) => v?.image).length} con imagen de Fandom, ${values.filter((v) => !v).length} sin nada`,
)
