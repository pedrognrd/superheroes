// Descarga la portada del cómic de primera aparición de cada héroe desde Comic Vine
// y la guarda en src/data/covers.json  (id del héroe → portada).
//
// Uso:  npm run fetch:covers            (todos los que falten)
//       npm run fetch:covers -- 620 69  (solo esos ids, para probar)
//
// Comic Vine permite ~200 peticiones/hora por recurso, así que va despacio
// (una búsqueda cada 18 s) y guarda tras cada héroe: se puede cortar y reanudar.
import { readFile, writeFile } from 'node:fs/promises'
import { fixPublisher } from '../src/data/publisherFixes.ts'
import { isDuplicate } from '../src/data/duplicates.ts'

const KEY = process.env.COMICVINE_API_KEY
if (!KEY) {
  console.error('Falta COMICVINE_API_KEY en .env.local')
  process.exit(1)
}

const API = 'https://comicvine.gamespot.com/api'
const UA = 'superhero-database-personal/1.0'
const DELAY_MS = 18_000
const OUT = new URL('../src/data/covers.json', import.meta.url)
const HEROES = new URL('../src/data/heroes.json', import.meta.url)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const norm = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const isEmpty = (v) => !v || v === '-' || v === 'null'

let lastCall = 0
async function cv(resource, params) {
  const wait = lastCall + DELAY_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastCall = Date.now()
  const qs = new URLSearchParams({ api_key: KEY, format: 'json', ...params })
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(`${API}/${resource}/?${qs}`, { headers: { 'User-Agent': UA } })
      if (res.status === 420 || res.status === 429) throw new Error(`límite (${res.status})`)
      const data = await res.json()
      if (data.status_code !== 1) throw new Error(data.error)
      return data.results
    } catch (err) {
      console.warn(`    reintento ${attempt}: ${err.message}`)
      await sleep(60_000 * attempt)
    }
  }
  throw new Error('Comic Vine no responde')
}

const CHAR_FIELDS = 'id,name,real_name,aliases,publisher,first_appeared_in_issue'
const searchCharacters = (name) =>
  cv('characters', { filter: `name:${name.replace(/[,|:]/g, ' ')}`, field_list: CHAR_FIELDS, limit: '50' })

/** Puntúa lo bien que un personaje de Comic Vine encaja con el héroe */
function score(hero, publisher, c) {
  if (!c.first_appeared_in_issue) return -1
  const name = norm(hero.name)
  const full = norm(hero.biography['full-name'])
  const cvName = norm(c.name)
  const cvReal = norm(c.real_name)
  const aliases = (c.aliases ?? '').split(/\r?\n/).map(norm)
  // Obligatorio: misma editorial o mismo número que el texto de SuperHero API
  // (evita, p. ej., que Godzilla salga con una parodia de la revista Cracked)
  const cvPub = norm(c.publisher?.name).replace(/ comics$/, '')
  const pub = norm(publisher).replace(/ comics$/, '')
  const samePublisher = Boolean(cvPub && pub && cvPub === pub)
  const fa = hero.biography['first-appearance']
  const num = c.first_appeared_in_issue.issue_number
  const sameIssue = Boolean(!isEmpty(fa) && num && new RegExp(`#\\s*${num}\\b`).test(fa))
  if (!samePublisher && !sameIssue) return -1

  // Obligatorio: que sea la misma persona (mismo nombre, mismo nombre real,
  // o alias + mismo apellido). Evita "Batman" → "Batman Who Laughs".
  const nameHit = cvName === name
  const fullHit = Boolean(full && (cvReal === full || cvName === full))
  const aliasHit = aliases.includes(name)
  const lastHit = Boolean(full && cvReal && full.split(' ').pop() === cvReal.split(' ').pop())
  if (!nameHit && !fullHit && !(aliasHit && lastHit)) return -1

  let s = 0
  if (nameHit) s += 3
  else if (aliasHit) s += 2
  if (fullHit) s += 3
  else if (lastHit) s += 1
  if (samePublisher) s += 2
  if (sameIssue) s += 2
  return s
}

async function findCharacter(hero, publisher) {
  const full = hero.biography['full-name']
  let candidates = await searchCharacters(hero.name)
  let best = pickBest(hero, publisher, candidates)
  if ((!best || best.score < 6) && !isEmpty(full) && norm(full) !== norm(hero.name)) {
    candidates = candidates.concat(await searchCharacters(full))
    best = pickBest(hero, publisher, candidates)
  }
  return best && best.score >= 5 ? best : null
}

function pickBest(hero, publisher, candidates) {
  return candidates
    .map((c) => ({ c, score: score(hero, publisher, c) }))
    .sort((a, b) => b.score - a.score)[0]
}

// ---------------------------------------------------------------------------
const heroes = JSON.parse(await readFile(HEROES, 'utf8'))
let covers = {}
try {
  covers = JSON.parse(await readFile(OUT, 'utf8'))
} catch {
  /* primera ejecución */
}
const save = () => writeFile(OUT, JSON.stringify(covers, null, 1))

const onlyIds = process.argv.slice(2)
const todo = heroes.filter((h) => (onlyIds.length ? onlyIds.includes(h.id) : !(h.id in covers) && !isDuplicate(h.id)))
console.log(`Portadas guardadas: ${Object.keys(covers).length}. Por buscar: ${todo.length} (≈${Math.ceil((todo.length * 1.3 * DELAY_MS) / 60_000)} min)`)

// Fase 1: personaje → número de primera aparición
for (const [i, hero] of todo.entries()) {
  const publisher = fixPublisher(hero.id, hero.biography.publisher)
  try {
    const best = await findCharacter(hero, publisher)
    covers[hero.id] = best
      ? {
          character: best.c.name,
          characterId: best.c.id,
          score: best.score,
          issueId: best.c.first_appeared_in_issue.id,
          issueNumber: best.c.first_appeared_in_issue.issue_number,
        }
      : null
    console.log(`[${i + 1}/${todo.length}] ${hero.name} → ${best ? `${best.c.name} (#${best.c.first_appeared_in_issue.issue_number}, ${best.score} pts)` : 'sin coincidencia'}`)
  } catch (err) {
    console.error(`[${i + 1}/${todo.length}] ${hero.name}: ${err.message}`)
    break
  }
  await save()
}

// Fase 2: número → portada y página del número en Comic Vine (lotes de 100)
const pending = Object.values(covers).filter((c) => c && (!c.image || !c.page))
for (let i = 0; i < pending.length; i += 100) {
  const batch = pending.slice(i, i + 100)
  const ids = [...new Set(batch.map((c) => c.issueId))]
  const issues = await cv('issues', {
    filter: `id:${ids.join('|')}`,
    field_list: 'id,name,issue_number,volume,image,cover_date,site_detail_url',
    limit: '100',
  })
  const byId = new Map(issues.map((it) => [it.id, it]))
  for (const c of batch) {
    const it = byId.get(c.issueId)
    if (!it) continue
    c.image = it.image?.medium_url ?? it.image?.original_url ?? null
    c.title = `${it.volume?.name ?? ''} #${it.issue_number}`.trim()
    c.coverDate = it.cover_date
    c.page = it.site_detail_url ?? null
  }
  await save()
  console.log(`Portadas: ${Math.min(i + 100, pending.length)}/${pending.length}`)
}

const found = Object.values(covers).filter((c) => c?.image).length
console.log(`✓ ${found} portadas de ${heroes.length} héroes en src/data/covers.json`)
