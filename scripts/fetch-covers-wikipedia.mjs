// Imagen de la obra de primera aparición (póster, carátula, portada) para los
// personajes de cine/TV/libros, desde la Wikipedia en inglés.
// La tabla héroe → artículos está en src/data/wikipediaWorks.ts.
// Resultado: src/data/covers-wikipedia.json
//
// Uso:  npm run fetch:covers:wikipedia            (los que falten)
//       npm run fetch:covers:wikipedia -- 418 7   (solo esos ids, se rehacen)
import { readFile, writeFile } from 'node:fs/promises'
import { WIKIPEDIA_WORKS } from '../src/data/wikipediaWorks.ts'

const UA = 'superhero-database-personal/1.0'
const API = 'https://en.wikipedia.org/w/api.php'
const OUT = new URL('../src/data/covers-wikipedia.json', import.meta.url)
const DELAY_MS = 1500

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastCall = 0
async function api(params) {
  const wait = lastCall + DELAY_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastCall = Date.now()
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params })
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': UA } })
      if (res.ok) return await res.json()
      console.warn(`  HTTP ${res.status}, reintento ${attempt}`)
      if (res.status === 429) await sleep((Number(res.headers.get('retry-after')) || 30) * 1000)
    } catch (e) {
      console.warn(`  ${e.message}, reintento ${attempt}`)
    }
    await sleep(3000 * attempt)
  }
  throw new Error('Wikipedia no responde')
}

/** Nombre del archivo de imagen del infobox del artículo (o null) */
async function infoboxImage(title) {
  const data = await api({ action: 'parse', page: title, prop: 'wikitext', section: '0', redirects: '1' })
  const text = data?.parse?.wikitext
  if (!text) return null
  const m = text.match(/\|\s*(?:image|cover|poster|image_file)\s*=\s*(?:\[\[)?(?:File:|Image:)?([^|\]\n{}<]+\.(?:jpe?g|png|gif|svg|webp))/i)
  return m ? { file: m[1].trim(), page: data.parse.title } : null
}

async function imageUrl(file) {
  const data = await api({ action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '400' })
  const info = data?.query?.pages?.[0]?.imageinfo?.[0]
  const url = info?.thumburl ?? info?.url
  return url ? url.replace(/\?utm_.*$/, '') : null
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
const todo = Object.entries(WIKIPEDIA_WORKS).filter(([id]) => (onlyIds.length ? onlyIds.includes(id) : !(id in out)))
console.log(`${todo.length} personajes por buscar en Wikipedia`)

const cache = new Map() // artículo → resultado (muchos héroes comparten obra)
for (const [id, titles] of todo) {
  let result = null
  try {
  for (const title of titles) {
    if (!cache.has(title)) {
      const img = await infoboxImage(title)
      const url = img && (await imageUrl(img.file))
      cache.set(title, url ? { image: url, title: img.page, page: `https://en.wikipedia.org/wiki/${encodeURIComponent(img.page.replaceAll(' ', '_'))}` } : null)
    }
    result = cache.get(title)
    if (result) break
  }
  } catch (e) {
    console.log(`  ${id} → ${e.message}; se reintentará en la próxima ejecución`)
    continue
  }
  out[id] = result
  console.log(`  ${id} → ${result ? result.title : `sin imagen (${titles.join(' / ')})`}`)
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
}

const found = Object.values(out).filter(Boolean).length
console.log(`Listo: ${found} imágenes de Wikipedia (${Object.keys(out).length - found} sin imagen)`)
