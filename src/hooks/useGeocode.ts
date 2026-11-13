import { useEffect, useState } from 'react'
import precomputed from '../data/places.json'

export type LatLng = [number, number]
export interface PlaceImage {
  image: string
  title: string
  page: string
}
type State = {
  status: 'idle' | 'loading' | 'done' | 'error'
  coords: LatLng | null
  /** Imagen de Fandom para lugares ficticios (Attilan, Kahndaq…) */
  image?: PlaceImage | null
}

// places.json lo genera `npm run fetch:places`: coordenadas de cada lugar, o la
// imagen de Fandom si es ficticio. Solo los lugares que no estén ahí (héroes
// nuevos) se consultan en vivo a Nominatim.
type ImageEntry = { image?: string; title?: string; page?: string }
// `base`: imagen alternativa (vertical) para el panel Base
type Entry = ({ coords?: LatLng; base?: ImageEntry | null } & ImageEntry) | null
const PLACES = precomputed as unknown as Record<string, Entry>

// Nominatim (OpenStreetMap) pide como máximo 1 petición/segundo, así que
// cacheamos en memoria y en localStorage.
const CACHE_KEY = 'geocode-cache-v1'
const memory: Record<string, LatLng | null> = (() => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
})()

function save() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(memory))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

let queue = Promise.resolve()

function geocode(place: string): Promise<LatLng | null> {
  if (place in memory) return Promise.resolve(memory[place])
  const job = queue.then(async () => {
    if (place in memory) return memory[place]
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(place)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = (await res.json()) as { lat: string; lon: string }[]
    const coords: LatLng | null = data[0] ? [Number(data[0].lat), Number(data[0].lon)] : null
    memory[place] = coords
    save()
    await new Promise((r) => setTimeout(r, 1000))
    return coords
  })
  queue = job.then(
    () => undefined,
    () => undefined,
  )
  return job
}

export type PlaceKind = 'base' | 'birth'

function fromPrecomputed(place: string, kind: PlaceKind): State | null {
  if (!(place in PLACES)) return null
  const e = PLACES[place]
  if (e?.coords) return { status: 'done', coords: e.coords }
  const img = (kind === 'base' && e?.base?.image ? e.base : e) ?? null
  if (img?.image) return { status: 'done', coords: null, image: { image: img.image, title: img.title ?? '', page: img.page ?? '' } }
  return { status: 'done', coords: null }
}

export function useGeocode(place: string | null, kind: PlaceKind = 'birth'): State {
  const known = place ? fromPrecomputed(place, kind) : null
  const isKnown = known !== null
  const [state, setState] = useState<State & { place: string | null }>({ status: 'idle', coords: null, place: null })

  useEffect(() => {
    if (!place || isKnown) return
    let cancelled = false
    geocode(place)
      .then((coords) => !cancelled && setState({ status: 'done', coords, place }))
      .catch(() => !cancelled && setState({ status: 'error', coords: null, place }))
    return () => {
      cancelled = true
    }
  }, [place, isKnown])

  if (!place) return { status: 'idle', coords: null }
  if (known) return known
  if (state.place !== place) return { status: 'loading', coords: null }
  return state
}
