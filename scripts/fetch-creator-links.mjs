// Enlace de cada creador (los nombres de creators.json):
//   - marvel / dc: su página de autor en marvel.fandom.com o dc.fandom.com (solo si está en la
//     categoría de autores de esa wiki: "Creators" o "DC Comics Staff").
//   - wikipedia: su artículo en la Wikipedia en inglés (sin páginas de desambiguación).
// La ficha elige según la editorial del personaje: Fandom de Marvel o DC primero y si no, Wikipedia.
// Guarda src/data/creator-links.json  (nombre → { marvel?, dc?, wikipedia? }).
//
// Uso:  npm run fetch:creator-links
import { readFile, writeFile } from 'node:fs/promises'

const UA = 'superhero-database-personal/1.0'
const OUT = new URL('../src/data/creator-links.json', import.meta.url)
const CREATORS = new URL('../src/data/creators.json', import.meta.url)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Nombres que en Wikipedia llevan a otra persona o necesitan el título exacto
const WIKIPEDIA_TITLE = {
  'Man of Action': 'Man of Action Studios',
  'Charles Nicholas': 'Charles Nicholas Wojtkoski',
  'John Thomas': 'Jim and John Thomas',
  'Jim Thomas': 'Jim and John Thomas',
  'Michael Carroll': 'Michael Carroll (Irish writer)',
  // Su descripción no dice "autor", pero el artículo es el correcto
  'John Knoll': 'John Knoll',
  'Kevin James': 'Kevin James',
  'Lew Schwartz': 'Lew Schwartz',
}
// Nombres sin enlace en Wikipedia (el artículo con ese título es de otra cosa)
// Steve Gordon: el de Spyke es el animador de X-Men: Evolution, no el director de cine
const NO_WIKIPEDIA = new Set(['Stuart Little', 'Steve Gordon'])

const names = [...new Set(Object.values(JSON.parse(await readFile(CREATORS, 'utf8'))).flat())].sort()
console.log(`${names.length} creadores`)

async function api(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } })
      if (res.status === 429) {
        const wait = Number(res.headers.get('retry-after')) || 30 * attempt
        console.warn(`  429: espera ${wait} s`)
        await sleep(wait * 1000)
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.warn(`  reintento ${attempt}: ${err.message}`)
      await sleep(10_000 * attempt)
    }
  }
  throw new Error(`${base} no responde`)
}

// Título de la página tras normalizar y seguir redirecciones → título pedido
function resolver(query) {
  const back = new Map()
  for (const n of query.normalized ?? []) back.set(n.to, n.from)
  for (const r of query.redirects ?? []) back.set(r.to, back.get(r.from) ?? r.from)
  return (title) => back.get(title) ?? title
}

const pageUrl = (host, title) => `https://${host}/wiki/${encodeURIComponent(title.replaceAll(' ', '_')).replace(/%2F/g, '/')}`
const out = Object.fromEntries(names.map((n) => [n, {}]))

// 1. Fandom: página en la categoría de autores
const FANDOM = [
  ['marvel', 'marvel.fandom.com', 'Category:Creators'],
  ['dc', 'dc.fandom.com', 'Category:DC Comics Staff'],
]
for (const [key, host, category] of FANDOM) {
  for (let i = 0; i < names.length; i += 50) {
    const batch = names.slice(i, i + 50)
    const { query } = await api(`https://${host}/api.php`, {
      action: 'query', prop: 'categories', clcategories: category, cllimit: 'max', redirects: '1', titles: batch.join('|'),
    })
    const original = resolver(query)
    for (const p of query.pages) {
      if (p.missing || !p.categories?.length) continue
      const name = original(p.title)
      if (out[name]) out[name][key] = pageUrl(host, p.title)
    }
    await sleep(500)
  }
  console.log(`${key}: ${Object.values(out).filter((l) => l[key]).length}`)
}

// 2. Wikipedia: artículo con ese título, si no es una desambiguación y su descripción
//    es la de un autor (no la de otra persona con el mismo nombre)
const CREATIVE =
  /comic|cartoon|artist|writer|author|novelist|illustrat|screen|film|director|producer|animator|manga|designer|developer|company|studio|creator|penciller|inker|editor|mogul|dramatist|aviator/i
const WP = 'https://en.wikipedia.org/w/api.php'
// Consulta con continuación: con muchos títulos la API reparte las descripciones en varias páginas
async function wikiPages(titles) {
  const pages = new Map()
  const back = new Map()
  let cont = {}
  do {
    const data = await api(WP, {
      action: 'query', prop: 'pageprops|description', ppprop: 'disambiguation', redirects: '1', titles: titles.join('|'), ...cont,
    })
    const original = resolver(data.query)
    for (const p of data.query.pages) {
      back.set(p.title, original(p.title))
      pages.set(p.title, { ...pages.get(p.title), ...p })
    }
    cont = data.continue ?? null
    await sleep(3000)
  } while (cont)
  return [...pages.values()].map((p) => ({ ...p, asked: back.get(p.title) }))
}
const goodPage = (p) => !p.missing && !p.invalid && p.pageprops?.disambiguation === undefined && CREATIVE.test(p.description ?? '')

const titleOf = (n) => WIKIPEDIA_TITLE[n] ?? n
const wikiNames = names.filter((n) => !NO_WIKIPEDIA.has(n))
for (let i = 0; i < wikiNames.length; i += 50) {
  const batch = wikiNames.slice(i, i + 50)
  for (const p of await wikiPages(batch.map(titleOf))) {
    const forced = Object.values(WIKIPEDIA_TITLE).includes(p.asked)
    if (forced ? p.missing || p.invalid : !goodPage(p)) continue
    for (const name of batch.filter((n) => titleOf(n) === p.asked)) {
      out[name].wikipedia = pageUrl('en.wikipedia.org', p.title)
      out[name].description = p.description
    }
  }
}
// 3. Wikipedia, búsqueda: para los que no tienen artículo directo ("John Broome (writer)"…)
for (const name of wikiNames.filter((n) => !out[n].wikipedia && !WIKIPEDIA_TITLE[n])) {
  const { query } = await api(WP, { action: 'query', list: 'search', srsearch: name, srlimit: '6' })
  const base = name.toLowerCase()
  const titles = query.search.map((h) => h.title).filter((t) => t.toLowerCase() === base || t.toLowerCase().startsWith(base + ' ('))
  if (titles.length) {
    const hit = (await wikiPages(titles)).find(goodPage)
    if (hit) {
      out[name].wikipedia = pageUrl('en.wikipedia.org', hit.title)
      out[name].description = `${hit.title}: ${hit.description}`
    }
  }
  await sleep(2000)
}
console.log(`wikipedia: ${Object.values(out).filter((l) => l.wikipedia).length}`)

// La descripción solo sirve para revisar a mano; no se guarda
const saved = Object.fromEntries(
  Object.entries(out)
    .map(([n, { description, ...links }]) => [n, links])
    .filter(([, links]) => Object.keys(links).length),
)
await writeFile(OUT, JSON.stringify(saved, null, 2) + '\n')
const missing = names.filter((n) => !saved[n])
console.log(`Listo: ${Object.keys(saved).length} con enlace; sin enlace (${missing.length}): ${missing.join(', ')}`)
if (process.argv.includes('--review'))
  for (const [n, l] of Object.entries(out)) if (l.wikipedia && !l.marvel && !l.dc) console.log(`  ${n} → ${l.description ?? '(sin descripción)'}`)
