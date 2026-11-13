// Portadas de respaldo desde Fandom (marvel.fandom.com / dc.fandom.com) para los
// héroes que Comic Vine no ha resuelto. Se guardan en src/data/covers-fandom.json
// (archivo aparte para no pisarse con fetch-covers.mjs si ambos se ejecutan a la vez).
//
// Uso:  npm run fetch:covers:fandom            (todos los que falten)
//       npm run fetch:covers:fandom -- 95 69   (solo esos ids)
//
// A partir del texto "first-appearance" de la SuperHero API ("Marvel Family #1
// (December, 1945)") busca la página del número ("The Marvel Family Vol 1 1"),
// comprueba el año si lo hay y toma la imagen de portada de su ficha.
import { readFile, writeFile } from 'node:fs/promises'
import { fixPublisher } from '../src/data/publisherFixes.ts'
import { isDuplicate } from '../src/data/duplicates.ts'

const UA = 'superhero-database-personal/1.0'
const DELAY_MS = 1000
const OUT = new URL('../src/data/covers-fandom.json', import.meta.url)
const CV = new URL('../src/data/covers.json', import.meta.url)
const HEROES = new URL('../src/data/heroes.json', import.meta.url)

const WIKI = {
  'Marvel Comics': 'marvel.fandom.com',
  'Icon Comics': 'marvel.fandom.com',
  'DC Comics': 'dc.fandom.com',
  Wildstorm: 'dc.fandom.com',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const norm = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const readJson = async (url, fallback) => {
  try {
    return JSON.parse(await readFile(url, 'utf8'))
  } catch {
    return fallback
  }
}

let lastCall = 0
async function api(host, params) {
  const wait = lastCall + DELAY_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastCall = Date.now()
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params })
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://${host}/api.php?${qs}`, { headers: { 'User-Agent': UA } })
      if (res.ok) return await res.json()
      console.warn(`  HTTP ${res.status}, reintento ${attempt}`)
    } catch (e) {
      console.warn(`  ${e.message}, reintento ${attempt}`)
    }
    await sleep(5000 * attempt)
  }
  return null
}

/** "Hulk Vol 2 #2 (April, 2008) (as A-Bomb)" → { title: 'Hulk', vol: '2', num: '2', year: 2008 } */
function parseAppearance(text) {
  if (!text || text === '-' || text === 'null') return null
  const m = text.match(/^(.+?)\s*(?:,?\s*Vol(?:ume)?\.?\s*(\d+))?\s*#\s*(\d+[A-Za-z]?)/i)
  if (!m) return null
  const title = m[1].replace(/[,:\s]+$/, '').trim()
  if (!title) return null
  const year = text.match(/\b(19[3-9]\d|20[0-2]\d)\b/)
  return { title, vol: m[2] ?? null, num: m[3], year: year ? Number(year[1]) : null }
}

const field = (wikitext, name) => wikitext.match(new RegExp(`^\\|\\s*${name}\\s*=\\s*(.+)$`, 'mi'))?.[1].trim()

async function findIssue(host, ref) {
  // 1. Candidatos: búsqueda + nombres probables
  const titles = new Set()
  const guesses = ref.vol ? [ref.vol] : ['1']
  for (const v of guesses) {
    titles.add(`${ref.title} Vol ${v} ${ref.num}`)
    if (!/^the\s/i.test(ref.title)) titles.add(`The ${ref.title} Vol ${v} ${ref.num}`)
  }
  const search = await api(host, {
    action: 'query',
    list: 'search',
    srsearch: `${ref.title} ${ref.num}`,
    srnamespace: '0',
    srlimit: '20',
  })
  const wanted = norm(ref.title)
  for (const r of search?.query?.search ?? []) {
    const m = r.title.match(/^(.+) Vol (\d+) (\d+[A-Za-z]?)$/)
    if (m && norm(m[1]) === wanted && m[3].toLowerCase() === ref.num.toLowerCase() && (!ref.vol || m[2] === ref.vol))
      titles.add(r.title)
  }

  // 2. Leer las fichas de todos los candidatos de una vez
  const data = await api(host, {
    action: 'query',
    titles: [...titles].slice(0, 20).join('|'),
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    redirects: '1',
  })
  const pages = (data?.query?.pages ?? [])
    .filter((p) => !p.missing && p.revisions)
    .map((p) => {
      const text = p.revisions[0].slots.main.content
      return {
        title: p.title,
        vol: Number(p.title.match(/ Vol (\d+) /)?.[1] ?? 99),
        year: Number(field(text, 'Year')) || null,
        image: field(text, 'Image1') ?? field(text, 'Image'),
        month: field(text, 'Month'),
      }
    })
    .filter((p) => p.image && !/^\s*$/.test(p.image))
  if (!pages.length) return null

  // 3. Si conocemos el año, exigir que cuadre (±1); si no, el volumen más bajo
  const ok = ref.year ? pages.filter((p) => p.year && Math.abs(p.year - ref.year) <= 1) : pages
  ok.sort((a, b) => a.vol - b.vol)
  return ok[0] ?? null
}

async function imageUrl(host, file) {
  const name = file.replace(/^(File|Image):/i, '').split('|')[0].trim()
  const data = await api(host, {
    action: 'query',
    titles: `File:${name}`,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '400',
  })
  const info = data?.query?.pages?.[0]?.imageinfo?.[0]
  return info?.thumburl ?? info?.url ?? null
}

const heroes = await readJson(HEROES, [])
const cv = await readJson(CV, {})
const out = await readJson(OUT, {})
const onlyIds = process.argv.slice(2)

const todo = heroes.filter((h) => {
  if (onlyIds.length) return onlyIds.includes(h.id)
  if (h.id in out || isDuplicate(h.id)) return false
  if (cv[h.id]?.image) return false // Comic Vine ya tiene portada
  return WIKI[fixPublisher(h.id, h.biography.publisher)]
})

console.log(`${todo.length} héroes por buscar en Fandom`)
let i = 0
for (const h of todo) {
  i++
  const host = WIKI[fixPublisher(h.id, h.biography.publisher)]
  const ref = parseAppearance(h.biography['first-appearance'])
  const tag = `[${i}/${todo.length}] ${h.name}`
  if (!host || !ref) {
    console.log(`${tag} → texto no interpretable: ${h.biography['first-appearance']}`)
    out[h.id] = null
    continue
  }
  const issue = await findIssue(host, ref)
  const image = issue && (await imageUrl(host, issue.image))
  if (!image) {
    console.log(`${tag} → sin coincidencia (${ref.title} #${ref.num})`)
    out[h.id] = null
  } else {
    console.log(`${tag} → ${issue.title}`)
    out[h.id] = {
      image,
      title: issue.title.replace(/ Vol (\d+) (\S+)$/, ' Vol. $1 #$2'),
      page: `https://${host}/wiki/${encodeURIComponent(issue.title.replaceAll(' ', '_'))}`,
      year: issue.year,
    }
  }
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
}

const found = Object.values(out).filter(Boolean).length
console.log(`Listo: ${found} portadas de Fandom (${Object.keys(out).length - found} sin coincidencia)`)
