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
/** Con `whole`, solo enlaza si el texto entero es el nombre de un personaje (alias como "Dark Angel" no enlazan "Angel"). */
export function HeroText({ text, hero, onSelect, whole = false }: { text: string; hero: Hero; onSelect: (id: string) => void; whole?: boolean }) {
  let parts = splitHeroMentions(text, hero)
  if (whole && !(parts.length === 1 && typeof parts[0] !== 'string')) parts = [text]
  return (
    <>
      {parts.map((part, i) =>
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
