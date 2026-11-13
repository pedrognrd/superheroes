import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeocode, type LatLng, type PlaceKind } from '../hooks/useGeocode'
import { placeLabel, primaryPlace } from '../utils/parse'
import { Panel } from './Panel'
import './MapPanel.css'

interface MapPanelProps {
  title: string
  /** Texto libre de la API ("New York, New York") */
  place: string
  /** Base (hueco vertical) o lugar de nacimiento: algunos lugares tienen imagen distinta */
  kind?: PlaceKind
  variant?: 'dark' | 'light'
  align?: 'left' | 'right'
  className?: string
}

/** Recentra el mapa cuando cambian las coordenadas */
function Recenter({ coords }: { coords: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.setView(coords, 11)
  }, [map, coords])
  return null
}

/** Nombre de la web de origen para el título del enlace: "Fandom", "dc.com"… */
const sourceName = (url: string) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host.endsWith('fandom.com') ? 'Fandom' : host
  } catch {
    return ''
  }
}

export function MapPanel({ title, place, kind = 'birth', variant, align, className = '' }: MapPanelProps) {
  const query = primaryPlace(place)
  const { status, coords, image } = useGeocode(query, kind)

  return (
    <Panel title={title} variant={variant} align={align} className={`map-panel ${className}`}>
      <div className="map-panel__map">
        {coords ? (
          <MapContainer center={coords} zoom={11} zoomControl={false} attributionControl scrollWheelZoom={false}>
            {/* Botones +/−; la rueda sigue desactivada para no atrapar el scroll de la página */}
            <ZoomControl position="topright" zoomInTitle="Zoom in" zoomOutTitle="Zoom out" />
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              className="map-tiles-dark"
            />
            <CircleMarker center={coords} radius={9} pathOptions={{ color: '#7fc4ea', fillColor: '#7fc4ea', fillOpacity: 0.5 }} />
            <Recenter coords={coords} />
          </MapContainer>
        ) : image ? (
          // Lugar ficticio: imagen de su página (Fandom casi siempre)
          <a
            className="map-panel__place"
            href={image.page}
            target="_blank"
            rel="noreferrer"
            title={`${image.title} · ${sourceName(image.page)}`}
          >
            <img src={image.image} alt={image.title} referrerPolicy="no-referrer" />
          </a>
        ) : (
          <div className={`map-panel__empty${status !== 'loading' ? ' map-panel__empty--unknown' : ''}`}>
            {status === 'loading' ? (
              'Locating…'
            ) : (
              <>
                <span className="map-panel__globe" aria-hidden="true" />
                {query ? 'Location not found' : 'No known location'}
              </>
            )}
          </div>
        )}
      </div>
      <div className="map-panel__label" title={place}>
        {query ? placeLabel(query) : '—'}
      </div>
    </Panel>
  )
}
