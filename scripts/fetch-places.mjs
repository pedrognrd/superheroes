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
const MANUAL = [
  {
    match: 'Bizarro World',
    image: 'https://static.dc.com/dc/files/default_images/1567_400x600.jpg?w=600',
    title: 'Superman: Tales of the Bizarro World',
    page: 'https://www.dc.com/graphic-novels/superman-tales-of-the-bizarro-world',
  },
  { match: 'Your chest :)', host: 'avp.fandom.com', file: 'ALIEN chestburster1280.jpg', title: 'Chestburster', page: 'Chestburster' },
  {
    match: /^(the |professor )?(charles )?xavier('s)? (institute|insitute|school)/i,
    host: 'marvel.fandom.com',
    file: 'Graymalkin Prison from Uncanny X-Men Vol 6 27 001.jpg',
    title: "Xavier's School for Gifted Youngsters",
    page: "Xavier's_School_for_Gifted_Youngsters",
  },
]
const manualFor = (q) => MANUAL.find((m) => (typeof m.match === 'string' ? m.match === q : m.match.test(q)))
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
for (const m of MANUAL) {
  let url = m.image
  let page = m.page
  if (m.file) {
    const info = await fandom(m.host, { action: 'query', titles: `File:${m.file}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '600' })
    url = info?.query?.pages?.[0]?.imageinfo?.[0]?.thumburl
    page = `https://${m.host}/wiki/${encodeURI(m.page)}`
  }
  if (!url) {
    console.log(`Manual: no se encontró ${m.file} en ${m.host}`)
    continue
  }
  for (const q of places.keys()) {
    if (manualFor(q) === m) out[q] = { image: url, title: m.title, page }
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
    const geo = await geocode(q)
    // Marvel/DC: si el lugar tiene página en Fandom y el mapa no es fiable, imagen de Fandom
    let comic = null
    for (const wiki of host ?? []) {
      comic = await fandomPlace(wiki, q)
      if (comic) break
    }
    let entry = null
    if (geo && (!comic || trustworthy(q, geo))) entry = { coords: geo.coords }
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
