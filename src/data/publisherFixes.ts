// Correcciones del campo "publisher" de SuperHero API.
//
// En unos 80 héroes la API guarda en "publisher" otro nombre del personaje
// (p. ej. Hawkeye → "Goliath", Nightwing → "Batman II") en lugar de la editorial.
// Y en 15 viene vacío o "null". Aquí se corrigen sin tocar heroes.json, así que
// las correcciones sobreviven a una nueva descarga con `npm run fetch:heroes`.

const MARVEL = 'Marvel Comics'
const DC = 'DC Comics'

/** Etiqueta incorrecta → editorial real */
export const ALIAS_TO_PUBLISHER: Record<string, string> = {
  // Marvel
  'Angel': MARVEL,
  'Angel Salvadore': MARVEL,
  'Ant-Man': MARVEL,
  'Anti-Venom': MARVEL,
  'Anti-Vision': MARVEL,
  'Archangel': MARVEL,
  'Atlas': MARVEL,
  'Binary': MARVEL,
  'Blaquesmith': MARVEL,
  'Boom-Boom': MARVEL,
  'Captain Marvel': MARVEL,
  'Deadpool': MARVEL,
  'Evil Deadpool': MARVEL,
  'Gemini V': MARVEL,
  'Giant-Man': MARVEL,
  'Goliath': MARVEL,
  'Hawkeye': MARVEL,
  'Iron Lad': MARVEL,
  'Jean Grey': MARVEL,
  'Luke Cage': MARVEL,
  'Meltdown': MARVEL,
  'Ms Marvel II': MARVEL,
  'Penance II': MARVEL,
  'Phoenix': MARVEL,
  'Power Man': MARVEL,
  'Power Woman': MARVEL,
  'Rune King Thor': MARVEL,
  'Scarlet Spider': MARVEL,
  'Scorpion': MARVEL,
  'Sharon Carter': MARVEL,
  'She-Thing': MARVEL,
  'Speedball': MARVEL,
  'Spider-Carnage': MARVEL,
  'Tempest': MARVEL,
  'Thunderbird II': MARVEL,
  'Toxin': MARVEL,
  'Venom III': MARVEL,
  'Vertigo II': MARVEL,
  'Vindicator II': MARVEL,
  'Warpath': MARVEL,
  // DC
  'Arsenal': DC,
  'Aztar': DC,
  'Batgirl': DC,
  'Batgirl III': DC,
  'Batgirl V': DC,
  'Batman II': DC,
  'Black Racer': DC,
  'Flash IV': DC,
  'Hawkfire': DC,
  'Huntress': DC,
  'Impulse': DC,
  'Liberty Belle II': DC,
  'Misfit': DC,
  'Nightwing': DC,
  'Oracle': DC,
  'Red Hood': DC,
  'Red Robin': DC,
  'Robin II': DC,
  'Robin III': DC,
  'Spectre': DC,
  'Speed Demon': DC,
  'Speedy': DC,
  'Spoiler': DC,
  'Superman Prime One-Million': DC,
}

/** Héroes sin editorial (vacío o "null"): id → editorial / estudio de origen */
export const PUBLISHER_BY_ID: Record<string, string> = {
  '47': 'Tezuka Productions', // Astro Boy
  '87': 'Universal Studios', // Bionic Woman
  '139': '20th Century Fox', // Brundlefly (The Fly, 1986)
  '245': 'Paramount Pictures', // Ethan Hunt
  '264': 'King Features Syndicate', // Flash Gordon
  '287': 'Toho', // Godzilla
  '349': '20th Century Fox', // Jack Bauer (24)
  '355': 'Universal Studios', // Jason Bourne
  '381': 'Scholastic', // Katniss Everdeen
  '389': 'RKO Pictures', // King Kong
  '393': 'Kraft Foods', // Kool-Aid Man
  '540': 'Carolco Pictures', // Rambo
  '656': 'NBC', // The Cape
}

export const UNKNOWN_PUBLISHER = 'Unknown'

export function fixPublisher(id: string, publisher: string): string {
  if (PUBLISHER_BY_ID[id]) return PUBLISHER_BY_ID[id]
  if (ALIAS_TO_PUBLISHER[publisher]) return ALIAS_TO_PUBLISHER[publisher]
  if (!publisher || publisher === 'null') return UNKNOWN_PUBLISHER
  return publisher
}
