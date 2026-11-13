// Utilidades para convertir los textos libres de la API en datos útiles

/** "-", "null" o vacío significan "sin dato" en la API */
export const isEmpty = (v?: string | null) => !v || v === '-' || v === 'null'

/** Divide por ; o , ignorando los separadores que están dentro de paréntesis */
export function splitList(text: string): string[] {
  if (isEmpty(text)) return []
  const out: string[] = []
  let depth = 0
  let current = ''
  for (const ch of text) {
    if (ch === '(') depth++
    if (ch === ')') depth = Math.max(0, depth - 1)
    if ((ch === ';' || ch === ',') && depth === 0) {
      out.push(current)
      current = ''
    } else current += ch
  }
  out.push(current)
  return out.map((s) => s.trim().replace(/^and\s+/i, '')).filter(Boolean)
}

// ---------- Connections ----------
export interface Connection {
  name: string
  formerly: boolean
}

const NEW_PHRASE = /^(member|leader|ally|agent|partner|alternate|current|founder|co-founder)\b/i

export function parseGroups(text: string): Connection[] {
  if (isEmpty(text)) return []
  // "formerly X, Y" afecta a X e Y, pero se corta en el siguiente ";"
  // o cuando empieza otra frase ("alternate Fantastic Four", "member of…")
  return text.split(';').flatMap((segment) => {
    let formerly = false
    return splitList(segment).map((item) => {
      if (/^former(ly)?\b/i.test(item)) formerly = true
      else if (NEW_PHRASE.test(item)) formerly = false
      return { name: item, formerly }
    })
  })
}

/** Nombre de grupo limpio, para agrupar en filtros: "formerly member of Outlaws" → "Outlaws" */
export function groupKey(name: string) {
  return name
    .replace(/^(formerly|former)\s+/i, '')
    .replace(/^(member|leader|ally|agent|partner|founder) of\s+(the\s+)?/i, '')
    .replace(/\s*\(.*\)$/, '')
    .trim()
}

// ---------- Relatives ----------
export type RelativeStatus = 'alive' | 'deceased' | 'alleged'

export interface Relative {
  name: string
  relation: string
  status: RelativeStatus
}

export function parseRelatives(text: string): Relative[] {
  return splitList(text).map((item) => {
    const match = item.match(/^(.*?)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/)
    const name = (match ? match[1] : item).trim()
    const inside = match ? match[2] : ''
    const lower = inside.toLowerCase()
    const status: RelativeStatus = /alleged|presumed|unconfirmed/.test(lower) && lower.includes('deceased')
      ? 'alleged'
      : lower.includes('deceased')
        ? 'deceased'
        : 'alive'
    const relation = inside.split(',')[0].trim()
    return { name, relation, status }
  })
}

// ---------- Lugares ----------
/** Lugares descritos con una frase → lugar que se muestra (y se busca en el mapa) */
const PLACE_ALIASES: Record<string, string> = {
  'a castle on the Hudson River in upstate New York that is owned by the High Evolutionary': 'New York', // Quicksilver
}

/** Primer lugar utilizable de un texto como "Mobile; formerly Manhattan, Hellcarrier" */
export function primaryPlace(text: string): string | null {
  if (isEmpty(text)) return null
  let first = text
    .split(';')[0]
    .replace(/\(.*?\)/g, '')
    // "Formerly Krypton" → "Krypton"; "Formerly the Savage Land, now mobile" → "Savage Land";
    // "Mobile. Formerly Avengers Mansion" → "Avengers Mansion"
    .replace(/^\s*((currently\s+)?mobile[.,]\s*)?formerly,?\s+(the\s+)?/i, '')
    .replace(/,?\s*now mobile\s*$/i, '')
    // "Island of Attilan, Atlantic Ocean" → "Attilan, Atlantic Ocean"
    .replace(/^\s*island of attilan\b/i, 'Attilan')
    .trim()
  // "currently a recreation of Earth-Prime, formerly Qward" → "Earth-Prime";
  // "currently New York City, formerly Asgard" → "New York City"
  if (/^currently\s+/i.test(first)) {
    first = first
      .replace(/^currently\s+/i, '')
      .replace(/^(a\s+)?recreation of\s+/i, '')
      .replace(/,?\s*formerly\b.*$/i, '')
      .trim()
  }
  // "Mobile", "unrevealed, formerly Asteroid M"… no es un lugar
  if (!first || /^(mobile|unrevealed|unknown)$/i.test(first.split(',')[0].trim())) return null
  return PLACE_ALIASES[first] ?? first
}

/** Ciudad corta para la etiqueta del mapa: "New York, New York" → "New York" */
export const placeLabel = (place: string) => place.split(',')[0].trim()
