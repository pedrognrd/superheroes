// Descarga todos los héroes de superheroapi.com a src/data/heroes.json
// Uso: npm run fetch:heroes   (lee SUPERHERO_TOKEN de .env.local)
// Es incremental: si ya existe heroes.json, solo pide los IDs que faltan y luego
// sigue probando IDs por encima del último hasta encontrar varios seguidos que
// no existen ("invalid id"): así detecta héroes nuevos añadidos a la API.
// La API limita peticiones ("access denied"), por eso va despacio y reintenta.
import { readFile, writeFile } from 'node:fs/promises'

const TOKEN = process.env.SUPERHERO_TOKEN
if (!TOKEN) {
  console.error('Falta SUPERHERO_TOKEN en .env.local')
  process.exit(1)
}

const BASE = `https://www.superheroapi.com/api.php/${TOKEN}`
const OUT = new URL('../src/data/heroes.json', import.meta.url)
const KNOWN_MAX = 731 // último id de la descarga original
const STOP_AFTER_MISSING = 5 // ids inexistentes seguidos para dar por terminado
const CONCURRENCY = 2
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const INVALID = Symbol('invalid id')

async function fetchHero(id, attempt = 1) {
  try {
    const res = await fetch(`${BASE}/${id}`)
    const data = await res.json()
    if (data.error === 'invalid id') return INVALID
    if (data.response !== 'success') throw new Error(data.error ?? 'error')
    delete data.response
    return data
  } catch (err) {
    if (attempt < 5) {
      await sleep(2000 * attempt)
      return fetchHero(id, attempt + 1)
    }
    console.warn(`  ✗ id ${id}: ${err.message}`)
    return null
  }
}

let heroes = []
try {
  heroes = JSON.parse(await readFile(OUT, 'utf8'))
} catch {
  /* primera descarga */
}
const have = new Set(heroes.map((h) => Number(h.id)))
const lastKnown = Math.max(KNOWN_MAX, ...have)
const added = []

// 1. Huecos dentro del rango conocido
const ids = Array.from({ length: lastKnown }, (_, i) => i + 1).filter((id) => !have.has(id))
console.log(`Ya hay ${have.size}. Faltan ${ids.length} hasta el id ${lastKnown}…`)

let done = 0
async function worker() {
  while (ids.length) {
    const hero = await fetchHero(ids.shift())
    if (hero && hero !== INVALID) {
      heroes.push(hero)
      added.push(hero)
    }
    if (++done % 25 === 0) console.log(`  ${done} procesados`)
    await sleep(250)
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

// 2. Héroes nuevos por encima del último id
console.log(`Buscando héroes nuevos a partir del id ${lastKnown + 1}…`)
let missingInRow = 0
for (let id = lastKnown + 1; missingInRow < STOP_AFTER_MISSING; id++) {
  const hero = await fetchHero(id)
  if (hero === INVALID || hero === null) {
    missingInRow++
  } else {
    missingInRow = 0
    heroes.push(hero)
    added.push(hero)
    console.log(`  + ${hero.id} ${hero.name}`)
  }
  await sleep(250)
}

heroes.sort((a, b) => Number(a.id) - Number(b.id))
await writeFile(OUT, JSON.stringify(heroes))
console.log(`✓ ${heroes.length} héroes en src/data/heroes.json (${added.length} nuevos)`)
if (added.length) console.log(`  Nuevos: ${added.map((h) => `${h.id} ${h.name}`).join(', ')}`)
