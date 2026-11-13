// Pósters de cine y televisión desde TMDB (themoviedb.org) para los personajes de
// src/data/screenWorks.ts. Resultado: src/data/covers-tmdb.json
//
// Uso:  npm run fetch:covers:tmdb            (los que falten)
//       npm run fetch:covers:tmdb -- 418 87  (rehacer esos ids)
//
// Necesita TMDB_API_KEY en .env.local: vale la "API Key" (v3) o el
// "API Read Access Token" (v4, empieza por eyJ).
import { readFile, writeFile } from 'node:fs/promises'
import { SCREEN_WORKS } from '../src/data/screenWorks.ts'

const KEY = process.env.TMDB_API_KEY
if (!KEY) {
  console.error('Falta TMDB_API_KEY en .env.local (themoviedb.org → Settings → API)')
  process.exit(1)
}

const API = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p/w500'
const OUT = new URL('../src/data/covers-tmdb.json', import.meta.url)
const DELAY_MS = 250
const isBearer = KEY.startsWith('eyJ')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastCall = 0
async function tmdb(path, params = {}) {
  const wait = lastCall + DELAY_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastCall = Date.now()
  const qs = new URLSearchParams({ language: 'en-US', ...params, ...(isBearer ? {} : { api_key: KEY }) })
  const headers = { Accept: 'application/json', ...(isBearer ? { Authorization: `Bearer ${KEY}` } : {}) }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${API}${path}?${qs}`, { headers })
    if (res.ok) return res.json()
    if (res.status === 401) throw new Error('TMDB rechaza la clave (401). Revisa TMDB_API_KEY.')
    if (res.status === 404) return null
    console.warn(`  HTTP ${res.status}, reintento ${attempt}`)
    await sleep((Number(res.headers.get('retry-after')) || 3 * attempt) * 1000)
  }
  throw new Error('TMDB no responde')
}

const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

async function findWork(w) {
  const isMovie = w.type === 'movie'
  const search = await tmdb(`/search/${w.type}`, {
    query: w.query,
    ...(isMovie ? { primary_release_year: String(w.year) } : { first_air_date_year: String(w.year) }),
  })
  const results = search?.results ?? []
  const name = (r) => (isMovie ? r.title : r.name)
  // Preferir coincidencia exacta de título; si no, el primer resultado de ese año
  return results.find((r) => norm(name(r)) === norm(w.query)) ?? results[0] ?? null
}

async function poster(w) {
  const work = await findWork(w)
  if (!work) return null
  const isMovie = w.type === 'movie'
  const name = isMovie ? work.title : work.name
  const year = (isMovie ? work.release_date : work.first_air_date)?.slice(0, 4)
  let path = work.poster_path
  let title = `${name} (${year})`
  if (w.season) {
    const season = await tmdb(`/tv/${work.id}/season/${w.season}`)
    if (season?.poster_path) {
      path = season.poster_path
      title = `${name} · Season ${w.season}`
    }
  }
  // TMDB a veces asigna un póster en otro idioma (o mal etiquetado como "sin idioma"):
  // usar uno marcado en inglés; si la temporada no tiene, el de la serie.
  const englishPoster = async (p) => {
    const images = await tmdb(`${p}/images`, { include_image_language: 'en', language: '' })
    const posters = (images?.posters ?? []).sort((a, b) => b.vote_average - a.vote_average)
    return posters.some((x) => x.file_path === path) ? path : posters[0]?.file_path
  }
  const main = `/${w.type}/${work.id}`
  const seasonEnglish = w.season ? await englishPoster(`${main}/season/${w.season}`) : null
  if (seasonEnglish) {
    path = seasonEnglish
  } else {
    const english = await englishPoster(main)
    if (english && english !== path) {
      path = english
      title = `${name} (${year})` // póster de la serie, no de la temporada
    }
  }
  if (!path) return null
  return {
    image: `${IMG}${path}`,
    title,
    page: `https://www.themoviedb.org/${w.type}/${work.id}${w.season ? `/season/${w.season}` : ''}`,
  }
}

const readJson = async (url, fallback) => {
  try {
    return JSON.parse(await readFile(url, 'utf8'))
  } catch {
    return fallback
  }
}

const out = await readJson(OUT, {})
const onlyIds = process.argv.slice(2)
const todo = Object.entries(SCREEN_WORKS).filter(([id]) => (onlyIds.length ? onlyIds.includes(id) : !(id in out)))
console.log(`${todo.length} personajes por buscar en TMDB`)

const cache = new Map() // muchos héroes comparten obra
for (const [id, w] of todo) {
  const key = JSON.stringify(w)
  if (!cache.has(key)) cache.set(key, await poster(w))
  out[id] = cache.get(key)
  console.log(`  ${id} → ${out[id] ? out[id].title : `sin póster (${w.query} ${w.year})`}`)
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
}

const found = Object.values(out).filter(Boolean).length
console.log(`Listo: ${found} pósters de TMDB (${Object.keys(out).length - found} sin póster)`)
