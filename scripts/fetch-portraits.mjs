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
  // Sin retrato en akabab/superhero-api ni Comic Vine: imagen principal de su página de Fandom
  16: one('https://static.wikia.nocookie.net/heroes/images/b/b4/Alex_Woolsley.jpg/revision/latest?cb=20090312231858'), // Alex Woolsley (heroes.fandom.com)
  22: one('https://static.wikia.nocookie.net/heroes/images/f/fc/AndoMasahashi.jpg/revision/latest?cb=20110531070605'), // Ando Masahashi (heroes.fandom.com)
  27: one('https://static.wikia.nocookie.net/marveldatabase/images/b/ba/Doctor_Strange_Vol_8_1_Fanyang_Virgin_Variant.jpg/revision/latest?cb=20251213181545'), // Aldrif Odinsdottir (Earth-616) (marvel.fandom.com)
  64: one('https://static.wikia.nocookie.net/marvel_dc/images/b/b1/Flamebird_002.jpg/revision/latest?cb=20191207050030'), // Mary Elizabeth Kane (New Earth) (dc.fandom.com)
  65: one('https://static.wikia.nocookie.net/marvel_dc/images/8/87/Huntress_0007.jpg/revision/latest?cb=20130725162642'), // Helena Bertinelli (New Earth) (dc.fandom.com)
  67: one('https://static.wikia.nocookie.net/marvel_dc/images/1/12/Misfit_01.jpg/revision/latest?cb=20071031144845'), // Charlotte Gage-Radcliffe (New Earth) (dc.fandom.com)
  77: one('https://static.wikia.nocookie.net/marveldatabase/images/0/07/Abner_Jenkins_%28Earth-616%29_from_Thunderbolts_Vol_4_4_001.png/revision/latest?cb=20160901025546'), // Abner Jenkins (Earth-616) (marvel.fandom.com)
  90: one('https://static.wikia.nocookie.net/marveldatabase/images/5/5b/Achille_DiBacco_%28Earth-616%29_from_Daredevil_Vol_1_158_0001.jpg/revision/latest?cb=20180505171539'), // Achille DiBacco (Earth-616) (marvel.fandom.com)
  91: one('https://static.wikia.nocookie.net/hanna-barbera/images/3/3f/Birdman.jpg/revision/latest?cb=20191009211941'), // Birdman (hanna-barbera.fandom.com)
  125: one('https://static.wikia.nocookie.net/marvel_dc/images/2/28/Blue_Beetle_Ted_Kord_0001.jpg/revision/latest?cb=20060117032048'), // Theodore Kord (New Earth) (dc.fandom.com)
  138: one('https://static.wikia.nocookie.net/marveldatabase/images/b/b6/Jericho_Drumm_%28Earth-616%29_from_Storm_Earth%27s_Mightiest_Mutant_Vol_1_3_001.jpg/revision/latest?cb=20260423111055'), // Jericho Drumm (Earth-616) (marvel.fandom.com)
  155: one('https://static.wikia.nocookie.net/marveldatabase/images/8/80/Secret_Avengers_Vol_1_27_Textless.jpg/revision/latest?cb=20120314011719'), // Mar-Vell (Earth-616) (marvel.fandom.com)
  164: one('https://static.wikia.nocookie.net/marveldatabase/images/a/ab/Shirlee_Bryant_%28Earth-616%29_from_The_Cat_Vol_1_2_001.jpg/revision/latest?cb=20201018201924'), // Shirlee Bryant (Earth-616) (marvel.fandom.com)
  272: one('https://static.wikia.nocookie.net/marveldatabase/images/6/61/Freyja_Freyrdottir_%28Earth-616%29_from_Thor_Vol_6_16_001.jpg/revision/latest?cb=20241227002530'), // Freyja Freyrdottir (Earth-616) (marvel.fandom.com)
  281: one('https://static.wikia.nocookie.net/marveldatabase/images/6/66/Daniel_Ketch_%28Earth-616%29_from_Midnight_Sons_Blood_Hunt_Vol_1_1_0001.jpg/revision/latest?cb=20240914235209'), // Daniel Ketch (Earth-616) (marvel.fandom.com)
  293: one('https://static.wikia.nocookie.net/marveldatabase/images/b/b4/William_Foster_%28Earth-616%29_from_Cable_%26_Deadpool_Vol_1_31_001.jpg/revision/latest?cb=20180131181814'), // William Foster (Earth-616) (marvel.fandom.com)
  301: one('https://static.wikia.nocookie.net/marveldatabase/images/1/16/Barton_Hamilton_%28Earth-616%29_From_Clone_Conspiracy_Vol_1_2_001.png.png/revision/latest?cb=20211022174228'), // Barton Hamilton (Earth-616) (marvel.fandom.com)
  302: one('https://static.wikia.nocookie.net/marveldatabase/images/0/00/Phillip_Urich_%28Earth-616%29_from_Red_Goblin_Vol_1_1.jpg/revision/latest?cb=20230610112349'), // Phillip Urich (Earth-616) (marvel.fandom.com)
  318: one('https://static.wikia.nocookie.net/marvel_dc/images/f/ff/Hawkwoman.jpg/revision/latest?cb=20101004141632'), // Sharon Parker (New Earth) (dc.fandom.com)
  319: one('https://static.wikia.nocookie.net/marvel_dc/images/2/2c/Shayera_Thal_001.jpg/revision/latest?cb=20091029050228'), // Shayera Thal (New Earth) (dc.fandom.com)
  326: one('https://static.wikia.nocookie.net/heroes/images/7/7a/R106Hiro.png/revision/latest?cb=20171210213933'), // Hiro Nakamura (heroes.fandom.com)
  349: one('https://static.wikia.nocookie.net/24wikia/images/9/91/Jack_Bauer_%28Day_9%29.jpg/revision/latest?cb=20140502045236'), // Jack Bauer (24.fandom.com)
  362: one('https://static.wikia.nocookie.net/heroes/images/1/1b/Jessica.jpg/revision/latest?cb=20210531210822'), // Jessica Sanders (heroes.fandom.com)
  366: one('https://static.wikia.nocookie.net/hellboy/images/5/5e/Johann_Kraus_002.jpg/revision/latest?cb=20140103030020'), // Johann Kraus (hellboy.fandom.com)
  377: one('https://static.wikia.nocookie.net/starwars/images/b/b3/JynErsoPromo.png/revision/latest?cb=20180211063950'), // Jyn Erso (starwars.fandom.com)
  378: one('https://static.wikia.nocookie.net/starwars/images/2/23/K2SO-SWBC35cvr.png/revision/latest?cb=20241112052810'), // K-2SO (starwars.fandom.com)
  385: one('https://static.wikia.nocookie.net/marvel_dc/images/f/f4/Kid_Flash_Bart_Allen_0012.jpg/revision/latest?cb=20101014175832'), // Bart Allen (New Earth) (dc.fandom.com)
  411: one('https://static.wikia.nocookie.net/hellboy/images/6/68/Liz_cover.jpg/revision/latest?cb=20191102205627'), // Elizabeth Sherman (hellboy.fandom.com)
  417: one('https://static.wikia.nocookie.net/heroes/images/e/e9/Luke_Campbell.jpg/revision/latest?cb=20090318070502'), // Luke Campbell (heroes.fandom.com)
  465: one('https://static.wikia.nocookie.net/heroes/images/5/54/Mohinder_Suresh.png/revision/latest?cb=20171213192323'), // Mohinder Suresh (heroes.fandom.com)
  486: one('https://static.wikia.nocookie.net/heroes/images/4/48/NathanPetrelli_%28promo%29.jpg/revision/latest?cb=20150921194834'), // Nathan Petrelli (heroes.fandom.com)
  494: one('https://static.wikia.nocookie.net/marvel_dc/images/8/89/Daniel_Dreiberg_Watchmen_002.png/revision/latest?cb=20201211132026'), // Daniel Dreiberg (Watchmen) (dc.fandom.com)
  513: one('https://static.wikia.nocookie.net/marveldatabase/images/8/81/Robert_Baldwin_%28Earth-616%29_from_New_Warriors_Vol_5_10.jpg/revision/latest?cb=20210924003338'), // Robert Baldwin (Earth-616) (marvel.fandom.com)
  519: one('https://static.wikia.nocookie.net/marvel_dc/images/6/6f/Offspring_01.jpg/revision/latest?cb=20100729010716'), // Luke O'Brian (New Earth) (dc.fandom.com)
  544: one('https://static.wikia.nocookie.net/marveldatabase/images/5/5a/Douglas_Scott_%28Earth-616%29_from_Deadpool_Assassin_Vol_1_2_001.jpg/revision/latest?cb=20180717230618'), // Douglas Scott (Earth-616) (marvel.fandom.com)
  597: one('https://static.wikia.nocookie.net/marvel_dc/images/3/3b/Laurel_Juspeczyk_Watchmen_001.png/revision/latest?cb=20210107133701'), // Laurel Juspeczyk (Watchmen) (dc.fandom.com)
  624: one('https://static.wikia.nocookie.net/marveldatabase/images/7/74/Julia_Carpenter_%28Earth-616%29_from_Prowler_Vol_2_2_001.jpg/revision/latest?cb=20191006044458'), // Julia Carpenter (Earth-616) (marvel.fandom.com)
  663: one('https://static.wikia.nocookie.net/marveldatabase/images/c/c1/Neal_Shaara_%28Earth-616%29_from_X-Men_Battle_of_the_Atom_%28video_game%29_001.jpg/revision/latest?cb=20171120002046'), // Neal Shaara (Earth-616) (marvel.fandom.com)
  673: one('https://static.wikia.nocookie.net/heroes/images/c/c4/TracyStrauss.png/revision/latest?cb=20150921183440'), // Tracy Strauss (heroes.fandom.com)
  710: one('https://static.wikia.nocookie.net/marveldatabase/images/2/28/Weapon_XI_from_Weapon_X_Vol_2_23_001.png/revision/latest?cb=20230613025415'), // Weapon XI (Earth-616) (marvel.fandom.com)
  715: one('https://static.wikia.nocookie.net/marveldatabase/images/6/67/S.W.O.R.D._Vol_2_10_Lee_Variant_Textless.jpg/revision/latest?cb=20240515213428'), // Takeshi Matsuya (Earth-616) (marvel.fandom.com)
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
