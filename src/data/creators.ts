import raw from './creators.json'
import links from './creator-links.json'

// Creadores de cada personaje (scripts/fetch-creators.mjs: Wikidata, Comic Vine y a mano)
const CREATORS = raw as Record<string, string[]>
// Enlace de cada creador (scripts/fetch-creator-links.mjs: Fandom de Marvel y DC, Wikipedia)
type Links = { marvel?: string; dc?: string; wikipedia?: string }
const LINKS = links as Record<string, Links>

// Editoriales cuyos personajes se enlazan a la wiki de Fandom correspondiente
const FANDOM: Record<string, keyof Links> = {
  'Marvel Comics': 'marvel',
  'Icon Comics': 'marvel',
  'DC Comics': 'dc',
  Wildstorm: 'dc',
}

export type Creator = { name: string; href?: string; source?: string }

/**
 * Creadores con su enlace: la página de autor de la wiki de Fandom de la editorial del
 * personaje (Marvel o DC) y si no la tiene, Wikipedia (o la otra wiki de Fandom).
 */
export function creatorsOf(id: string, publisher: string): Creator[] {
  const first = FANDOM[publisher]
  const order: (keyof Links)[] = first
    ? [first, 'wikipedia', first === 'marvel' ? 'dc' : 'marvel']
    : ['wikipedia', 'marvel', 'dc']
  return (CREATORS[id] ?? []).map((name) => {
    const l = LINKS[name] ?? {}
    const key = order.find((k) => l[k])
    return key ? { name, href: l[key], source: key === 'wikipedia' ? 'Wikipedia' : `${key === 'dc' ? 'DC' : 'Marvel'} Fandom` } : { name }
  })
}
