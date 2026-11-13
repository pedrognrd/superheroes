import { useState } from 'react'
import { PORTRAITS } from '../data/portraits'
import type { Hero } from '../types'
import { isEmpty } from '../utils/parse'
import './HeroIdentity.css'

/** Columna izquierda: retrato + alineación + nombre + nombre real */
export function HeroIdentity({ hero }: { hero: Hero }) {
  const [failed, setFailed] = useState<string | null>(null)
  const alignment = isEmpty(hero.biography.alignment) ? 'unknown' : hero.biography.alignment
  const fullName = isEmpty(hero.biography['full-name']) ? hero.name : hero.biography['full-name']
  const showImage = failed !== hero.image.url

  return (
    <div className="identity">
      <div className="identity__frame">
        <div className="identity__portrait">
          {showImage ? (
            <img
              src={hero.image.url}
              alt={hero.name}
              style={{ objectPosition: PORTRAITS[hero.id]?.position }}
              onError={() => setFailed(hero.image.url)}
            />
          ) : (
            <div className="identity__noimg">No image</div>
          )}
          <div className="identity__badge">
            <span className="identity__badge-key">Alignment</span>
            <span className={`identity__badge-value is-${alignment}`}>{alignment}</span>
          </div>
        </div>
      </div>

      <div className="identity__deco" aria-hidden="true" />

      <h1 className="identity__name">{hero.name}</h1>
      <div className="identity__fullname">
        <span className="identity__badge-key">Full-name</span>
        <span className="identity__fullname-value">{fullName}</span>
      </div>
    </div>
  )
}
