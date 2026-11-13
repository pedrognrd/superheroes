import { useState, type ReactNode } from 'react'
import { getCover } from '../data/covers'
import { publisherLink } from '../data/publisherLinks'
import { publisherColor, publisherLogo } from '../data/publisherLogos'
import type { Hero } from '../types'
import { isEmpty } from '../utils/parse'
import { MaskIcon } from './icons'
import { Panel } from './Panel'

/** Logo de la editorial (src/assets/publishers), o su nombre si no hay logo */
function PublisherLogo({ publisher, heroId }: { publisher: string; heroId: string }) {
  const logo = publisherLogo(publisher, heroId)
  if (!logo) return <span className="logo">{publisher}</span>
  return (
    <MaskIcon
      src={logo}
      width={190}
      height={120}
      className="logo logo--image"
      color={publisherColor(publisher)}
      label={publisher}
    />
  )
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
          <PublisherLogo publisher={publisher} heroId={hero.id} />
        </SourceLink>
      </div>
    </Panel>
  )
}

/** Año del texto de primera aparición de la API ("Casino Royale, 1953 novel" → 1953) */
const yearInText = (text: string) => text.match(/\b(1[89]\d\d|20\d\d)\b/)?.[1]

export function FirstAppearancePanel({ hero }: { hero: Hero }) {
  const text = hero.biography['first-appearance']
  const cover = getCover(hero.id)
  const [failed, setFailed] = useState<string | null>(null)
  const showCover = cover && failed !== cover.image
  const year = cover?.year ?? (isEmpty(text) ? undefined : yearInText(text))
  return (
    <Panel title="First appearance" align="center" className="first-appearance">
      <div className="center-box">
        {showCover ? (
          <figure className="cover-figure">
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
            <figcaption className="cover-caption">
              {year && <span className="cover-caption__year">{year}</span>}
              <span className="cover-caption__title">{cover.title}</span>
            </figcaption>
          </figure>
        ) : (
          <div className="cover cover--placeholder">
            <span>{isEmpty(text) ? 'Unknown' : text}</span>
          </div>
        )}
      </div>
    </Panel>
  )
}
