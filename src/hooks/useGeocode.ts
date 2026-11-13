import { useEffect, useState } from 'react'

export type LatLng = [number, number]
type State = { status: 'idle' | 'loading' | 'done' | 'error'; coords: LatLng | null }

// Geocodificación gratuita con Nominatim (OpenStreetMap). Su política pide
// como máximo 1 petición/segundo, así que cacheamos en memoria y en localStorage.
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
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`
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

export function useGeocode(place: string | null): State {
  const [state, setState] = useState<State & { place: string | null }>({ status: 'idle', coords: null, place: null })

  useEffect(() => {
    if (!place) return
    let cancelled = false
    geocode(place)
      .then((coords) => !cancelled && setState({ status: 'done', coords, place }))
      .catch(() => !cancelled && setState({ status: 'error', coords: null, place }))
    return () => {
      cancelled = true
    }
  }, [place])

  if (!place) return { status: 'idle', coords: null }
  if (state.place !== place) return { status: 'loading', coords: null }
  return state
}
