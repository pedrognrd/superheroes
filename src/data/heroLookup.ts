import type { Hero } from '../types'
import { heroes } from './heroes'
import { isEmpty } from '../utils/parse'

// Busca un personaje de la base de datos por su nombre ("Scarlet Witch") o su
// nombre real ("Wanda Maximoff"), sin distinguir mayúsculas. Lo usa la tabla
// Relatives para enlazar a los familiares que también están en la API.
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const byName = new Map<string, Hero[]>()
const byFullName = new Map<string, Hero[]>()
for (const h of heroes) {
  const add = (map: Map<string, Hero[]>, key: string) => {
    if (!key) return
    map.set(key, [...(map.get(key) ?? []), h])
  }
  add(byName, norm(h.name))
  if (!isEmpty(h.biography['full-name'])) add(byFullName, norm(h.biography['full-name']))
}

/** Entre varios candidatos, el de la misma editorial que `context`; si no, el primero */
const pick = (list: Hero[] | undefined, context: Hero) => {
  const others = list?.filter((h) => h.id !== context.id)
  if (!others?.length) return null
  return others.find((h) => h.biography.publisher === context.biography.publisher) ?? others[0]
}

/**
 * Personaje que corresponde a un familiar, o null.
 * `alias` es el texto entre paréntesis cuando nombra al personaje:
 * "Wanda Maximoff (Scarlet Witch)" → Scarlet Witch.
 */
export function findRelativeHero(name: string, alias: string, context: Hero): Hero | null {
  const n = norm(name)
  const a = norm(alias)
  // Solo nombres propios: "offspring", "unnamed son"… no se enlazan
  if (n.length < 3 || !/^[A-Z0-9"]/.test(name.trim())) return null
  return pick(byName.get(n), context) ?? pick(byName.get(a), context) ?? pick(byFullName.get(n), context)
}

// ---- Menciones de personajes en texto libre (Occupation, Connections, Aliases) ----
// Nombres (y nombres reales de dos o más palabras) tal como están escritos en la base de
// datos: se buscan respetando mayúsculas y como palabra completa ("Batman Family" → Batman,
// pero no "storm chaser" → Storm). Los más largos primero, para que "Spider-Woman" gane a "Spider".
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const mentionKeys = new Map<string, Hero[]>()
for (const h of heroes) {
  const keys = [h.name]
  const full = h.biography['full-name']
  if (!isEmpty(full) && full.trim().includes(' ')) keys.push(full.trim())
  for (const k of keys) {
    if (k.length < 3 || !/^[A-Z0-9]/.test(k)) continue
    mentionKeys.set(k, [...(mentionKeys.get(k) ?? []), h])
  }
}
const mentionRe = new RegExp(
  `(?<![\\w-])(${[...mentionKeys.keys()].sort((a, b) => b.length - a.length).map(escape).join('|')})(?![\\w-])`,
  'g',
)

// Frases hechas que contienen el nombre de otro personaje
const NOT_A_MENTION = [/Man of Steel$/, /\bas [^ ]+$/] // "(pre-Crisis as Superboy)": él mismo con otro nombre

export type MentionPart = string | { text: string; hero: Hero }

/** Trocea el texto en partes sueltas y menciones a otros personajes de la base de datos */
export function splitHeroMentions(text: string, context: Hero): MentionPart[] {
  const parts: MentionPart[] = []
  let last = 0
  for (const m of text.matchAll(mentionRe)) {
    const end = m.index + m[1].length
    // Parte de un nombre más largo ("Justice League", "Legion of Super-Heroes", "Nova Corps")
    if (/^\s+(of\b|[A-Z])/.test(text.slice(end))) continue
    if (NOT_A_MENTION.some((re) => re.test(text.slice(0, end)))) continue
    const list = mentionKeys.get(m[1])
    // El propio personaje (o uno que se llama igual) no enlaza: "Batman" en la ficha de Batman
    if (list?.some((h) => h.id === context.id) || m[1] === context.name) continue
    const hero = pick(list, context)
    if (!hero) continue
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push({ text: m[1], hero })
    last = m.index + m[1].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

// Alias que enlazan a otra ficha o no deben enlazar: "id del héroe|alias" → id de destino, o null
const ALIAS_LINKS: Record<string, string | null> = {
  '313|Goliath': '291', // Hawkeye: su etapa de Goliath es Clint Barton, no Erik Josten (#290)
  '568|Goliath': '291', // Ronin (Clint Barton)
  '30|Goliath': null, // Ant-Man: el Goliath de Hank Pym no está en la base
  '304|Vindicator': '694', // Guardian es James Hudson, no Heather (#693)
  '545|Speedy': '616', // Red Arrow es Roy Harper, no Thea Queen (#615)
  '25|Angel': null, // Angel Dust: su propio alias, no Warren Worthington
  '259|Angel': null, // Firestar: su propio alias
  '369|Guardian': null, // John Wraith
  '369|Vindicator': null,
  '540|Raven': null, // Rambo: no es Rachel Roth
  '550|John Smith': null, // Red Skull: no es Red Tornado
  '586|Ariel': null, // Shadowcat: su propio alias
  '586|Cat': null, // Shadowcat: no es Shirlee Bryant
}

/** Personaje al que enlaza un alias: solo si el alias entero es su nombre (o una corrección de ALIAS_LINKS) */
export function aliasHero(alias: string, context: Hero): Hero | null {
  const key = `${context.id}|${alias}`
  if (key in ALIAS_LINKS) {
    const id = ALIAS_LINKS[key]
    return id ? (heroes.find((h) => h.id === id) ?? null) : null
  }
  const parts = splitHeroMentions(alias, context)
  return parts.length === 1 && typeof parts[0] !== 'string' ? parts[0].hero : null
}
