// Actualiza todos los datos de una vez, solo con lo nuevo o pendiente:
//   1. héroes nuevos en superheroapi.com      (fetch-heroes.mjs)
//   2. portadas de Comic Vine que falten       (fetch-covers.mjs)
//   3. portadas de Fandom para lo que quede    (fetch-covers-fandom.mjs)
//   4. informe: héroes sin portada
//
// Uso: npm run update:data
//      npm run update:data -- --skip-covers   (solo héroes + informe)
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { fixPublisher } from '../src/data/publisherFixes.ts'
import { isDuplicate } from '../src/data/duplicates.ts'

const ENV = fileURLToPath(new URL('../.env.local', import.meta.url))
const script = (name) => fileURLToPath(new URL(`./${name}`, import.meta.url))
const skipCovers = process.argv.includes('--skip-covers')

function run(title, file) {
  console.log(`\n━━ ${title} ━━`)
  const r = spawnSync(process.execPath, [`--env-file=${ENV}`, script(file)], { stdio: 'inherit' })
  if (r.status !== 0) {
    console.error(`✗ ${file} terminó con error (${r.status}). Se detiene la actualización.`)
    process.exit(r.status ?? 1)
  }
}

const readJson = async (rel, fallback) => {
  try {
    return JSON.parse(await readFile(new URL(rel, import.meta.url), 'utf8'))
  } catch {
    return fallback
  }
}

const before = new Set((await readJson('../src/data/heroes.json', [])).map((h) => h.id))

run('1/3 Héroes', 'fetch-heroes.mjs')
if (!skipCovers) {
  run('2/3 Portadas · Comic Vine', 'fetch-covers.mjs')
  run('3/3 Portadas · Fandom', 'fetch-covers-fandom.mjs')
}

// ── Informe ──────────────────────────────────────────────
const allHeroes = await readJson('../src/data/heroes.json', [])
const heroes = allHeroes.filter((h) => !isDuplicate(h.id))
const cv = await readJson('../src/data/covers.json', {})
const fandom = await readJson('../src/data/covers-fandom.json', {})
const coversTs = await readFile(new URL('../src/data/covers.ts', import.meta.url), 'utf8')
const manualIds = new Set([...coversTs.matchAll(/^\s*'?(\d+)'?\s*:\s*\{/gm)].map((m) => m[1]))

const hasCover = (id) => manualIds.has(id) || cv[id]?.image || fandom[id]?.image
const fresh = allHeroes.filter((h) => !before.has(h.id))
const without = heroes.filter((h) => !hasCover(h.id))

console.log('\n━━ Informe ━━')
console.log(`Héroes: ${heroes.length} (${fresh.length} nuevos)`)
for (const h of fresh) console.log(`  + ${h.id} ${h.name}${isDuplicate(h.id) ? '  · duplicado (oculto)' : hasCover(h.id) ? '' : '  · sin portada'}`)

// Posibles duplicados: mismo nombre real e imagen que otro héroe visible
const seen = new Map()
for (const h of heroes) {
  const key = `${h.biography['full-name']}|${h.image.url}`.toLowerCase()
  if (seen.has(key) && h.biography['full-name'] && h.biography['full-name'] !== '-') {
    const o = seen.get(key)
    console.log(`  ⚠ ¿Duplicado? ${h.id} ${h.name} = ${o.id} ${o.name}. Si lo es, añádelo a src/data/duplicates.ts`)
  } else seen.set(key, h)
}

const count = (src) => heroes.filter((h) => src[h.id]?.image).length
console.log(`Portadas: Comic Vine ${count(cv)} · Fandom ${count(fandom)} · manuales ${manualIds.size}`)
console.log(`Sin portada: ${without.length}`)

const byPublisher = {}
for (const h of without) (byPublisher[fixPublisher(h.id, h.biography.publisher)] ??= []).push(h)
for (const [pub, list] of Object.entries(byPublisher).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n  ${pub} (${list.length})`)
  for (const h of list) console.log(`    ${h.id.padStart(4)} ${h.name} — ${h.biography['first-appearance']}`)
}
console.log('\nPara corregir una a mano, añádela a MANUAL en src/data/covers.ts.')
