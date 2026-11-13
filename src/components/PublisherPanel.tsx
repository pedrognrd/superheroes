import { useState } from 'react'
import { getCover } from '../data/covers'
import type { Hero } from '../types'
import { isEmpty } from '../utils/parse'
import { Panel } from './Panel'

// Logos provisionales hechos con CSS. Cuando tengas los de Fandom, guárdalos en
// src/assets/publishers/ y sustituye este componente por un <img>.
function PublisherLogo({ publisher }: { publisher: string }) {
  if (publisher === 'Marvel Comics') return <span className="logo logo--marvel">MARVEL</span>
  if (publisher === 'DC Comics') return <span className="logo logo--dc">DC</span>
  if (publisher === 'Dark Horse Comics')
    return (
      <span className="logo logo--darkhorse">
        DARK
        <br />
        HORSE
      </span>
    )
  return <span className="logo">{publisher}</span>
}

export function PublisherPanel({ hero }: { hero: Hero }) {
  return (
    <Panel title="Publisher" align="center" className="publisher">
      <div className="center-box">
        <PublisherLogo publisher={hero.biography.publisher} />
      </div>
    </Panel>
  )
}

export function FirstAppearancePanel({ hero }: { hero: Hero }) {
  const text = hero.biography['first-appearance']
  const cover = getCover(hero.id)
  const [failed, setFailed] = useState<string | null>(null)
  const showCover = cover && failed !== cover.image
  return (
    <Panel title="First appearance" align="center" className="first-appearance">
      <div className="center-box">
        {showCover ? (
          <img
            className="cover"
            src={cover.image}
            alt={cover.title}
            title={cover.title}
            // Fandom sirve una imagen genérica si la petición trae Referer de otra web
            referrerPolicy="no-referrer"
            onError={() => setFailed(cover.image)}
          />
        ) : (
          <div className="cover cover--placeholder">
            <span>{isEmpty(text) ? 'Unknown' : text}</span>
          </div>
        )}
      </div>
    </Panel>
  )
}
