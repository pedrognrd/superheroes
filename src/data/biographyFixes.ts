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
  // The Comedian: su hija Laurie es Silk Spectre II (#597); "Silk Spectre" es su madre Sally
  '657': 'Silk Spectre II (Laurel "Laurie" Juspeczyk) (daughter)',
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

// id del héroe → altura correcta (mismo formato que la API: [pies, cm])
const HEIGHT: Record<string, string[]> = {
  '198': ["5'5", '165 cm'], // Dagger: la API trae su lugar de nacimiento ("Shaker Heights, Ohio")
}

export function fixHeight(id: string, height: string[]): string[] {
  return HEIGHT[id] ?? height
}
