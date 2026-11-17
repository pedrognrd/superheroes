import raw from './portrait-fallbacks.json'

// Imagen de Comic Vine de cada héroe (scripts/fetch-portraits.mjs), para cuando
// el retrato de superherodb no existe o no carga
const FALLBACKS = raw as Record<string, { thumb: string; image: string }>

export const fallbackThumb = (id: string): string | undefined => FALLBACKS[id]?.thumb
export const fallbackImage = (id: string): string | undefined => FALLBACKS[id]?.image
