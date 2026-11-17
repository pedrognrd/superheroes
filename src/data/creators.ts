import raw from './creators.json'

// Creadores de cada personaje (scripts/fetch-creators.mjs: Wikidata y Comic Vine)
const CREATORS = raw as Record<string, string[]>

/** "Stan Lee & Jack Kirby", "Bob Kane, Bill Finger & Jerry Robinson"; undefined si no hay datos */
export function creatorsText(id: string): string | undefined {
  const names = CREATORS[id]
  if (!names?.length) return undefined
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}
