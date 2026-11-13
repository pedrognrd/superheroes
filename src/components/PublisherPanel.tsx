import { useState, type ReactNode } from 'react'
import { getCover } from '../data/covers'
import { publisherLink } from '../data/publisherLinks'
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

/** Enlace externo a la fuente, o el contenido tal cual si no hay enlace */
function SourceLink({ href, title, children }: { href?: string | null; title: string; children: ReactNode }) {
  if (!href) return <>{children}</>
  return (
    <a className="source-link" href={href} target="_blank" rel="noopener noreferrer" title={title}>
      {children}
    </a>
  )
}

export function PublisherPanel({ hero }: { hero: Hero }) {
  const publisher = hero.biography.publisher
  return (
    <Panel title="Publisher" align="center" className="publisher">
      <div className="center-box">
        <SourceLink href={publisherLink(publisher)} title={`${publisher} · Wikipedia`}>
          <PublisherLogo publisher={publisher} />
        </SourceLink>
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
          <SourceLink href={cover.page} title={`${cover.title} · ${cover.source ?? ''}`}>
            <img
              className="cover"
              src={cover.image}
              alt={cover.title}
              // Fandom sirve una imagen genérica si la petición trae Referer de otra web
              referrerPolicy="no-referrer"
              onError={() => setFailed(cover.image)}
            />
          </SourceLink>
        ) : (
          <div className="cover cover--placeholder">
            <span>{isEmpty(text) ? 'Unknown' : text}</span>
          </div>
        )}
      </div>
    </Panel>
  )
}
