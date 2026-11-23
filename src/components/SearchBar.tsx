import { useEffect, useMemo, useRef, useState } from 'react'
import { fallbackThumb } from '../data/portraitFallbacks'
import { akababImage } from '../data/heroes'
import { STAT_KEYS, type Hero } from '../types'
import {
  applyFilters,
  BASE_OPTIONS,
  EMPTY_FILTERS,
  GROUP_OPTIONS,
  PUBLISHER_OPTIONS,
  type Filters,
} from '../utils/filters'
import { ChevronIcon, CloseIcon, SearchIcon } from './icons'
import './SearchBar.css'

interface FilterSelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className={`searchbar__field filter filter--${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </label>
  )
}

const opts = (values: string[]) => values.map((v) => ({ value: v, label: v }))

// Resultados que se pintan de golpe; al acercarse al final del scroll se añaden más
const PAGE = 60

/** Miniatura del resultado: si el retrato no carga, la de Comic Vine; si tampoco, un hueco */
function ResultImage({ hero }: { hero: Hero }) {
  const [step, setStep] = useState(0)
  const src = step === 0 ? (akababImage(hero.id, 'md') ?? hero.image.url) : step === 1 ? fallbackThumb(hero.id) : undefined
  if (!src) return <span className="results__noimg" aria-hidden="true" />
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setStep((s) => s + 1)} />
}

export function SearchBar({ onSelect }: { onSelect: (id: string) => void }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [open, setOpen] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const ref = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Tras elegir un héroe el foco vuelve al buscador (cursor parpadeando) sin reabrir la lista
  const keepClosed = useRef(false)
  const results = useMemo(() => applyFilters(filters), [filters])
  const sortBy = filters.sortBy

  const set = (key: keyof Filters) => (value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setLimit(PAGE)
    setOpen(true)
  }

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (hero: Hero) => {
    onSelect(hero.id)
    // El nombre elegido queda escrito en el buscador (con la X para borrarlo)
    setFilters((f) => ({ ...f, query: hero.name }))
    setOpen(false)
    keepClosed.current = true
    inputRef.current?.focus()
  }

  return (
    <nav className="searchbar" ref={ref} aria-label="Search and filters">
      {/* Esquina decorativa superior izquierda */}
      <span className="searchbar__frame" aria-hidden="true" />
      <div className="searchbar__group searchbar__group--search">
        <span className="searchbar__key">Search</span>
        <div className="searchbar__field searchbar__field--search">
        <input
          type="search"
          placeholder="Insert name"
          ref={inputRef}
          value={filters.query}
          onChange={(e) => set('query')(e.target.value)}
          onFocus={() => {
            if (keepClosed.current) keepClosed.current = false
            else setOpen(true)
          }}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) pick(results[0])
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        {filters.query && (
          <button type="button" className="searchbar__clear" onClick={() => set('query')('')} aria-label="Clear search">
            <CloseIcon />
          </button>
        )}
        <SearchIcon />
        </div>
        <span className="searchbar__sep" aria-hidden="true" />
      </div>

      <div className="searchbar__group searchbar__group--filters">
        <span className="searchbar__key">Filter by</span>
        <span className="searchbar__sep" aria-hidden="true" />
        <FilterSelect
          label="Powerstats"
          value={filters.sortBy}
          options={STAT_KEYS.map((k) => ({ value: k, label: `Top ${k}` }))}
          onChange={set('sortBy')}
        />
        <span className="searchbar__sep" aria-hidden="true" />
        <FilterSelect label="Group affiliation" value={filters.group} options={opts(GROUP_OPTIONS)} onChange={set('group')} />
        <span className="searchbar__sep" aria-hidden="true" />
        <FilterSelect label="Base" value={filters.base} options={opts(BASE_OPTIONS)} onChange={set('base')} />
        <span className="searchbar__sep" aria-hidden="true" />
        <FilterSelect
          label="Publisher"
          value={filters.publisher}
          options={PUBLISHER_OPTIONS}
          onChange={set('publisher')}
        />
        <span className="searchbar__sep" aria-hidden="true" />
      </div>

      {open && (
        <div className="results" role="listbox">
          <div className="results__head">
            <span>{results.length} {results.length === 1 ? 'hero' : 'heroes'}</span>
            {filters !== EMPTY_FILTERS && (
              <button type="button" onClick={() => { setFilters(EMPTY_FILTERS); setLimit(PAGE) }}>
                Clear filters
              </button>
            )}
          </div>
          <ul
            onScroll={(e) => {
              const el = e.currentTarget
              if (limit < results.length && el.scrollTop + el.clientHeight > el.scrollHeight - 200) setLimit((l) => l + PAGE)
            }}
          >
            {results.slice(0, limit).map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => pick(h)}>
                  <ResultImage hero={h} />
                  <span className="results__name">{h.name}</span>
                  <span className="results__meta">
                    {sortBy ? `${sortBy}: ${h.powerstats[sortBy]}` : h.biography.publisher.replace(' Comics', '')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
