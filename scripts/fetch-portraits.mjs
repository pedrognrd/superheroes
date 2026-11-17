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
// (Fandom, Comic Vine o TMDB). Tienen prioridad sobre lo que encuentre la búsqueda.
const AZTAR = 'https://static.wikia.nocookie.net/marvel_dc/images/4/41/Spectre_001.jpg/revision/latest?cb=20051213085435'
const one = (url) => ({ thumb: url, image: url })
const MANUAL = {
  59: { thumb: AZTAR, image: AZTAR }, // Aztar: The Spectre #1 (DC Fandom, Aztar (New Earth))
  50: one('https://static.wikia.nocookie.net/marvel_dc/images/9/98/Atom_Al_Pratt_0005.jpg/revision/latest?cb=20130326093025'), // Atom: Al Pratt (DC Fandom)
  51: one('https://static.wikia.nocookie.net/marvel_dc/images/9/98/Atom_Al_Pratt_0005.jpg/revision/latest?cb=20130326093025'), // Atom: ficha sin datos, la del Atom original (Al Pratt)
  123: one('https://static.wikia.nocookie.net/marvel_dc/images/4/47/Daniel_Garrett_Prime_Earth_0001.JPG/revision/latest?cb=20230905115934'), // Blue Beetle: Dan Garrett (DC Fandom)
  124: one('https://static.wikia.nocookie.net/marvel_dc/images/4/47/Daniel_Garrett_Prime_Earth_0001.JPG/revision/latest?cb=20230905115934'), // Blue Beetle: ficha sin datos, el Blue Beetle original (Dan Garrett)
  134: one('https://static.wikia.nocookie.net/marveldatabase/images/b/b6/Walter_Langkowski_%28Earth-616%29_from_Alpha_Flight_Vol_5_5_001.jpg/revision/latest?cb=20240210141512'), // Box III: Walter Langkowski (Marvel Fandom)
  205: one('https://comicvine.gamespot.com/a/uploads/scale_large/1/15776/10053737-darkside.jpg'), // Darkside: el de Kingdom Hearts (Comic Vine)
  244: one('https://static.wikia.nocookie.net/marvel_dc/images/2/20/Legion_Lost_Vol_2_4_Textless.jpg/revision/latest?cb=20110920020529'), // ERG-1: Drake Burroughs, Legion Lost #4 (DC Fandom)
  283: one('https://static.wikia.nocookie.net/marveldatabase/images/b/b4/William_Foster_%28Earth-616%29_from_Cable_%26_Deadpool_Vol_1_31_001.jpg/revision/latest?cb=20180131181814'), // Giant-Man II: Bill Foster (Marvel Fandom)
  290: one('https://static.wikia.nocookie.net/marveldatabase/images/7/7f/Thunderbolts_Doomstrike_Vol_1_3_Textless.jpg/revision/latest?cb=20260330192036'), // Goliath: Erik Josten (Marvel Fandom)
  291: one('https://static.wikia.nocookie.net/marveldatabase/images/6/6f/Thunderbolts_Vol_5_1_Trading_Card_Variant_Textless.jpg/revision/latest?cb=20220622131243'), // Goliath: Clint Barton (Marvel Fandom)
  343: one('https://static.wikia.nocookie.net/marveldatabase/images/d/d8/Eric_Gitter_%28Earth-616%29_from_X-Men_Gold_Vol_2_23_001.jpg/revision/latest?cb=20210524073105'), // Ink: Eric Gitter (Marvel Fandom)
  364: one('https://image.tmdb.org/t/p/w500/pAkKjbzxP6Z6Y5zAGpwmWQo1iji.jpg'), // Jim Powell: Michael Chiklis (TMDB)
  365: one('https://image.tmdb.org/t/p/w500/8ktMwTxDqgyiYKdIB5dWEuX2zG1.jpg'), // JJ Powell: Jimmy Bennett (TMDB)
  393: one('https://comicvine.gamespot.com/a/uploads/scale_large/1/15776/10072274-kool-aid_man.jpg'), // Kool-Aid Man (Comic Vine)
  406: one('https://static.wikia.nocookie.net/marvel_dc/images/c/c8/Ayla_Ranzz_Pre-Zero_Hour_005.png/revision/latest?cb=20111010151127'), // Light Lass: Ayla Ranzz (DC Fandom)
  512: one('https://static.wikia.nocookie.net/marveldatabase/images/9/96/Monet_St._Croix_%28Earth-616%29_from_Giant-Size_X-Men_Storm_Vol_1_1_002.jpg/revision/latest?cb=20200917223338'), // Penance I: Monet St. Croix (Marvel Fandom)
  515: one('https://comicvine.gamespot.com/a/uploads/scale_large/0/229/222184-163535-phantom.jpg'), // Phantom: Kit Walker (Comic Vine)
  603: one('https://static.wikia.nocookie.net/marvel_dc/images/f/f9/Siren.JPG/revision/latest?cb=20200527031806'), // Siren II (DC Fandom)
  608: one('https://static.wikia.nocookie.net/marvel_dc/images/8/83/Sobek_eating_osiris.jpg/revision/latest?cb=20140513103326'), // Sobek: Yurrd (DC Fandom)
  636: one('https://image.tmdb.org/t/p/w500/4rLq98jWRAOJIMzGZW0bB5Y6fGX.jpg'), // Stephanie Powell: Julie Benz (TMDB)
  662: one('https://static.wikia.nocookie.net/marveldatabase/images/0/05/Uncanny_X-Men_Vol_1_476_Textless.jpg/revision/latest?cb=20210517183725'), // Thunderbird II: James Proudstar (Marvel Fandom)
  683: one('https://image.tmdb.org/t/p/w500/cqpuXsZcJe6esQTitqWyhN0eXtZ.jpg'), // Valerie Hart: póster de Team Epic (TMDB; la actriz no tiene foto)
  693: one('https://static.wikia.nocookie.net/marveldatabase/images/3/3a/Heather_McNeil_%28Earth-616%29_from_Alpha_Flight_Vol_5_3_Homage_Variant_cover.jpg/revision/latest?cb=20231025184124'), // Vindicator: Heather Hudson (Marvel Fandom)
  694: one('https://static.wikia.nocookie.net/marveldatabase/images/3/39/James_Hudson_%28Earth-616%29_from_Amazing_X-Men_Vol_2_8_001.jpg/revision/latest?cb=20170610173027'), // Vindicator: James Hudson (Marvel Fandom)
  721: one('https://static.wikia.nocookie.net/marveldatabase/images/9/93/Jubilation_Lee_%28Earth-616%29_from_New_Warriors_Vol_4_1_001.jpg/revision/latest?cb=20201220175544'), // Wondra: Jubilation Lee en New Warriors #1 (Marvel Fandom)
  712: one('https://static.wikia.nocookie.net/marveldatabase/images/4/42/X-Men_United_Vol_1_1_Chew_Virgin_Variant.jpg/revision/latest?cb=20260310031410'), // White Queen: Emma Frost (Marvel Fandom)
}

const out = {}
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

Object.assign(out, MANUAL)
const sorted = Object.fromEntries(Object.entries(out).sort((a, b) => Number(a[0]) - Number(b[0])))
await writeFile(OUT, JSON.stringify(sorted, null, 2) + '\n')
console.log(`${Object.keys(sorted).length} imágenes de respaldo guardadas`)
