// Forma de los datos tal como los devuelve superheroapi.com
export interface Hero {
  id: string
  name: string
  powerstats: Record<StatKey, string>
  biography: {
    'full-name': string
    'alter-egos': string
    aliases: string[]
    'place-of-birth': string
    'first-appearance': string
    publisher: string
    alignment: string
  }
  appearance: {
    gender: string
    race: string
    height: [string, string]
    weight: [string, string]
    'eye-color': string
    'hair-color': string
  }
  work: { occupation: string; base: string }
  connections: { 'group-affiliation': string; relatives: string }
  image: { url: string }
}

export type StatKey = 'intelligence' | 'strength' | 'speed' | 'durability' | 'power' | 'combat'

export const STAT_KEYS: StatKey[] = ['intelligence', 'strength', 'speed', 'durability', 'power', 'combat']
