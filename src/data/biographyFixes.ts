// Correcciones de SuperHero API (lugar de nacimiento y familiares), sin tocar
// heroes.json: sobreviven a una nueva descarga con `npm run fetch:heroes`.
// id del héroe → lugar correcto
const PLACE_OF_BIRTH: Record<string, string> = {
  '233': 'Heidelberg, Germany', // Dr Manhattan (Jon Osterman); la API trae "-"
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
