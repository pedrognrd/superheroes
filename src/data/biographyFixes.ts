// Correcciones del lugar de nacimiento de SuperHero API, sin tocar heroes.json
// (sobreviven a una nueva descarga con `npm run fetch:heroes`).
// id del héroe → lugar correcto
const PLACE_OF_BIRTH: Record<string, string> = {
  '233': 'Heidelberg, Germany', // Dr Manhattan (Jon Osterman); la API trae "-"
}

export function fixPlaceOfBirth(id: string, place: string): string {
  return PLACE_OF_BIRTH[id] ?? place
}
