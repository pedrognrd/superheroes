// Imagen de respaldo de cada héroe: la del personaje en Comic Vine (el mismo que ya se
// identificó para la portada de primera aparición, ver covers.json → characterId).
// Se usa cuando el retrato de superherodb no existe o no carga.
// Guarda src/data/portrait-fallbacks.json  (id del héroe → { thumb, image }).
//
// Uso:  npm run fetch:portraits
import { readFile, writeFile } from 'node:fs/promises'

const KEY = process.env.COMICVINE_API_KEY
if (!KEY) {
  console.error('Falta COMICVINE_API_KEY en .env.local')
  process.exit(1)
}

const API = 'https://comicvine.gamespot.com/api'
const UA = 'superhero-database-personal/1.0'
const OUT = new URL('../src/data/portrait-fallbacks.json', import.meta.url)
const COVERS = new URL('../src/data/covers.json', import.meta.url)
const BATCH = 40
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function characters(ids) {
  const qs = new URLSearchParams({
    api_key: KEY,
    format: 'json',
    filter: `id:${ids.join('|')}`,
    field_list: 'id,image',
    limit: '100',
  })
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API}/characters/?${qs}`, { headers: { 'User-Agent': UA } })
      const text = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = JSON.parse(text)
      if (data.status_code !== 1) throw new Error(data.error)
      return data.results
    } catch (err) {
      console.warn(`    reintento ${attempt}: ${err.message}`)
      await sleep(30_000 * attempt)
    }
  }
  throw new Error('Comic Vine no responde')
}

const covers = JSON.parse(await readFile(COVERS, 'utf8'))
const heroByChar = new Map()
for (const [heroId, c] of Object.entries(covers)) {
  if (c?.characterId) heroByChar.set(c.characterId, [...(heroByChar.get(c.characterId) ?? []), heroId])
}

// La imagen genérica de Comic Vine ("blank") no sirve de respaldo
const isBlank = (url) => !url || /\/(6373148|1-)?blank|question_mark|default/i.test(url)

// A mano: héroes sin personaje de Comic Vine cuyo retrato de superherodb no existe
const AZTAR = 'https://static.wikia.nocookie.net/marvel_dc/images/4/41/Spectre_001.jpg/revision/latest?cb=20051213085435'
const MANUAL = {
  59: { thumb: AZTAR, image: AZTAR }, // Aztar: The Spectre #1 (DC Fandom, Aztar (New Earth))
}

const out = { ...MANUAL }
const ids = [...heroByChar.keys()]
for (let i = 0; i < ids.length; i += BATCH) {
  const batch = ids.slice(i, i + BATCH)
  const results = await characters(batch)
  for (const r of results) {
    const img = r.image
    if (!img || isBlank(img.original_url)) continue
    for (const heroId of heroByChar.get(r.id) ?? []) out[heroId] = { thumb: img.thumb_url, image: img.super_url }
  }
  console.log(`${Math.min(i + BATCH, ids.length)}/${ids.length}`)
  await sleep(2000)
}

const sorted = Object.fromEntries(Object.entries(out).sort((a, b) => Number(a[0]) - Number(b[0])))
await writeFile(OUT, JSON.stringify(sorted, null, 2) + '\n')
console.log(`${Object.keys(sorted).length} imágenes de respaldo guardadas`)
