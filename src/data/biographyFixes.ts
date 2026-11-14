// Correcciones de SuperHero API (lugar de nacimiento, familiares y aliases), sin tocar
// heroes.json: sobreviven a una nueva descarga con `npm run fetch:heroes`.
// id del héroe → lugar correcto
const PLACE_OF_BIRTH: Record<string, string> = {
  '233': 'Heidelberg, Germany', // Dr Manhattan (Jon Osterman); la API trae "-"
  '574': 'Arda', // Sauron (Tolkien); la API trae "-"
  '289': 'Planet Vegeta', // Goku; la API trae "-"
  '686': 'Planet Vegeta', // Vegeta; la API trae "-"
}

export function fixPlaceOfBirth(id: string, place: string): string {
  return PLACE_OF_BIRTH[id] ?? place
}

// id del héroe → familiares correctos (mismo formato que la API: "Nombre (relación); …")
const RELATIVES: Record<string, string> = {
  // Thanos: la API trae "(father):" y "(mother, deceased" sin cerrar
  '655':
    'A\'Lars (father); Sui-San (mother, deceased); Eros (brother); Kronos (paternal grandfather, deceased); ' +
    'Daina (paternal grandmother, deceased); Zuras (uncle, deceased); Thena (cousin); Gamora (foster daughter); ' +
    'Nebula (alleged granddaughter); Rot ("child" by Death)',
}

export function fixRelatives(id: string, relatives: string): string {
  return RELATIVES[id] ?? relatives
}

// id del héroe → aliases correctos
const ALIASES: Record<string, string[]> = {
  // Martian Manhunter: la API los junta en un solo texto y le falta la J de "John Jones"
  '432': [
    'John Jones',
    "J'Onn J'Onzz (alternate spelling)",
    'Big Green Buddy',
    'J.J.',
    'Jolly Green Giant',
    'Light to the Light',
    'Manhunter',
    'Manhunter from Mars',
    'Son of Mars',
    'Bronze Wraith',
  ],
}

export function fixAliases(id: string, aliases: string[]): string[] {
  return ALIASES[id] ?? aliases
}
