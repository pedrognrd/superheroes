// Creadores de cada personaje (guionistas y dibujantes que lo crearon).
// Parte del personaje de Comic Vine ya identificado para la portada (covers.json → characterId):
//   1. Wikidata: ítem con ese ID de Comic Vine (P5905) → creadores (P170). Una sola consulta.
//   2. Comic Vine: ficha del personaje (campo creators) para los que Wikidata no tiene.
// Es incremental: lo ya guardado no se vuelve a pedir (usa --force para empezar de cero).
// Guarda src/data/creators.json  (id del héroe → [nombres]).
//
// Uso:  npm run fetch:creators
import { readFile, writeFile } from 'node:fs/promises'

const KEY = process.env.COMICVINE_API_KEY
const UA = 'superhero-database-personal/1.0'
const OUT = new URL('../src/data/creators.json', import.meta.url)
const COVERS = new URL('../src/data/covers.json', import.meta.url)
// Comic Vine permite ~200 peticiones por hora y recurso: una cada 18 s
const CV_DELAY = 18_000
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const covers = JSON.parse(await readFile(COVERS, 'utf8'))
const heroesByChar = new Map()
for (const [heroId, c] of Object.entries(covers)) {
  if (c?.characterId) heroesByChar.set(c.characterId, [...(heroesByChar.get(c.characterId) ?? []), heroId])
}

let out = {}
if (!process.argv.includes('--force')) {
  try { out = JSON.parse(await readFile(OUT, 'utf8')) } catch { /* primera vez */ }
}
const save = () => writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
const assign = (charId, names) => {
  for (const heroId of heroesByChar.get(charId) ?? []) out[heroId] = names
}
// Pendientes: personajes con algún héroe sin entrada
const pending = () => [...heroesByChar].filter(([, heroes]) => heroes.some((h) => !(h in out))).map(([c]) => c)

// 1. Wikidata
const todo = pending()
console.log(`Wikidata: ${todo.length} personajes pendientes`)
if (todo.length) {
  const values = todo.map((id) => `"4005-${id}"`).join(' ')
  const query = `SELECT ?cv ?creatorLabel WHERE {
    VALUES ?cv { ${values} }
    ?item wdt:P5905 ?cv ; wdt:P170 ?creator .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  }`
  const res = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: { Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: new URLSearchParams({ query }),
  })
  if (!res.ok) throw new Error(`Wikidata: HTTP ${res.status}`)
  const found = new Map()
  for (const b of (await res.json()).results.bindings) {
    const charId = Number(b.cv.value.replace('4005-', ''))
    const name = b.creatorLabel?.value
    // Sin etiqueta en inglés, Wikidata devuelve el Q-id: no sirve
    if (!name || /^Q\d+$/.test(name)) continue
    found.set(charId, [...new Set([...(found.get(charId) ?? []), name])])
  }
  for (const [charId, names] of found) assign(charId, names)
  await save()
  console.log(`  ${found.size} con creadores`)
}

// 2. Comic Vine, uno a uno
const rest = pending()
if (rest.length && !KEY) {
  console.warn(`Falta COMICVINE_API_KEY: quedan ${rest.length} personajes sin consultar en Comic Vine`)
} else if (rest.length) {
  console.log(`Comic Vine: ${rest.length} personajes (~${Math.ceil((rest.length * CV_DELAY) / 60_000)} min)`)
  for (const [i, charId] of rest.entries()) {
    const qs = new URLSearchParams({ api_key: KEY, format: 'json', field_list: 'creators' })
    let names = null
    for (let attempt = 1; attempt <= 4 && !names; attempt++) {
      try {
        const res = await fetch(`https://comicvine.gamespot.com/api/character/4005-${charId}/?${qs}`, { headers: { 'User-Agent': UA } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (data.status_code !== 1) throw new Error(data.error)
        names = (data.results.creators ?? []).map((c) => c.name)
      } catch (err) {
        console.warn(`    ${charId} reintento ${attempt}: ${err.message}`)
        await sleep(60_000 * attempt)
      }
    }
    // Lista vacía = consultado y sin creadores (no se vuelve a pedir)
    if (names) assign(charId, names)
    await save()
    console.log(`  [${i + 1}/${rest.length}] ${charId}: ${names?.join(', ') || '—'}`)
    if (i < rest.length - 1) await sleep(CV_DELAY)
  }
}

const withNames = Object.values(out).filter((n) => n.length).length
console.log(`Listo: ${withNames} héroes con creadores (de ${Object.keys(covers).length})`)
