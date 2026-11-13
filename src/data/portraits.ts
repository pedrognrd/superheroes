// Retratos sustituidos: id del héroe → imagen principal (la de SuperHero API no
// convence o no existe). `position` es el object-position del recorte vertical.
interface Portrait {
  url: string
  position?: string
}

export const PORTRAITS: Record<string, Portrait> = {
  // Minna Murray: Winona Ryder como Mina en Bram Stoker's Dracula (1992), fotograma de TMDB
  '453': { url: 'https://image.tmdb.org/t/p/w1280/uvQHQZqJmkbuBEgrM2wiDKfHwl8.jpg', position: '46% center' },
}
