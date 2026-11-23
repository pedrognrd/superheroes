import { useState } from 'react'
import { HeaderDeco } from './HeaderDeco'
import { fallbackImage } from '../data/portraitFallbacks'
import { PORTRAITS } from '../data/portraits'
import type { Hero } from '../types'
import { isEmpty } from '../utils/parse'
import './HeroIdentity.css'

/** Columna izquierda: retrato + alineación + nombre + nombre real */
export function HeroIdentity({ hero }: { hero: Hero }) {
  // Urls que no han cargado: primero el retrato (akabab, Fandom…), luego el de Comic Vine
  const [failed, setFailed] = useState<string[]>([])
  const alignment = isEmpty(hero.biography.alignment) ? 'unknown' : hero.biography.alignment
  const fullName = isEmpty(hero.biography['full-name']) ? hero.name : hero.biography['full-name']
  const src = [hero.image.url, fallbackImage(hero.id)].find((u) => u && !failed.includes(u))

  return (
    <div className="identity">
      <div className="identity__frame">
        <div className="identity__portrait">
          {src ? (
            <img
              src={src}
              alt={hero.name}
              referrerPolicy="no-referrer"
              style={{ objectPosition: src === hero.image.url ? PORTRAITS[hero.id]?.position : undefined }}
              onError={() => setFailed((f) => [...f, src])}
            />
          ) : (
            <div className="identity__noimg">No image</div>
          )}
          <div className="identity__badge">
            <span className="identity__badge-key">Alignment</span>
            <span className={`identity__badge-value is-${alignment}`}>{alignment}</span>
          </div>
          {/* Escuadra inferior derecha, como la de Superhero information */}
          <span className="hero-info__corner" aria-hidden="true">
            <span />
          </span>
        </div>
      </div>

      {/* Líneas y círculos que cuelgan del retrato (el adorno de la cabecera, en vertical) */}
      <HeaderDeco className="header-deco--vertical" />

      <h1 className="identity__name">{hero.name}</h1>
      <div className="identity__fullname">
        <span className="identity__badge-key">Full-name</span>
        <span className="identity__fullname-value">{fullName}</span>
      </div>
    </div>
  )
}
