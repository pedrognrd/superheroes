import { useEffect } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeocode, type LatLng } from '../hooks/useGeocode'
import { placeLabel, primaryPlace } from '../utils/parse'
import { Panel } from './Panel'
import './MapPanel.css'

interface MapPanelProps {
  title: string
  /** Texto libre de la API ("New York, New York") */
  place: string
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

export function MapPanel({ title, place, variant, align, className = '' }: MapPanelProps) {
  const query = primaryPlace(place)
  const { status, coords } = useGeocode(query)

  return (
    <Panel title={title} variant={variant} align={align} className={`map-panel ${className}`}>
      <div className="map-panel__map">
        {coords ? (
          <MapContainer center={coords} zoom={11} zoomControl={false} attributionControl scrollWheelZoom={false}>
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              className="map-tiles-dark"
            />
            <CircleMarker center={coords} radius={9} pathOptions={{ color: '#7fc4ea', fillColor: '#7fc4ea', fillOpacity: 0.5 }} />
            <Recenter coords={coords} />
          </MapContainer>
        ) : (
          <div className="map-panel__empty">
            {status === 'loading' ? 'Locating…' : query ? 'Location not found' : 'No known location'}
          </div>
        )}
      </div>
      <div className="map-panel__label" title={place}>
        {query ? placeLabel(query) : '—'}
      </div>
    </Panel>
  )
}
