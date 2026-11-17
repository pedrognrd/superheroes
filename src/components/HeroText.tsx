import { splitHeroMentions } from '../data/heroLookup'
import type { Hero } from '../types'

/** Enlace a la ficha de otro personaje (sin recargar la página) */
export function HeroLink({ hero, onSelect, children, className = 'rows__link', title }: {
  hero: Hero
  onSelect: (id: string) => void
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <a
      className={className}
      href={window.location.pathname}
      title={title ?? `Go to ${hero.name}`}
      onClick={(e) => {
        e.preventDefault()
        onSelect(hero.id)
      }}
    >
      {children}
    </a>
  )
}

/** Texto en el que cada personaje de la base de datos que se nombra enlaza a su ficha */
export function HeroText({ text, hero, onSelect }: { text: string; hero: Hero; onSelect: (id: string) => void }) {
  return (
    <>
      {splitHeroMentions(text, hero).map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <HeroLink key={i} hero={part.hero} onSelect={onSelect}>
            {part.text}
          </HeroLink>
        ),
      )}
    </>
  )
}
