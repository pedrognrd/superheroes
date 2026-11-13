// Héroes que la API repite con otro id: id duplicado → id original.
// Se ocultan en la app (los enlaces #duplicado abren el original) y los scripts
// de portadas no los buscan. `npm run update:data` avisa de posibles duplicados nuevos.
export const DUPLICATES: Record<string, string> = {
  '732': '346', // "Ironman" = Iron Man (Tony Stark), añadido a la API después de la descarga inicial
}

export const isDuplicate = (id: string) => id in DUPLICATES
