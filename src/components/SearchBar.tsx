import { useEffect, useMemo, useRef, useState } from 'react'
import { STAT_KEYS } from '../types'
import {
  applyFilters,
  BASE_OPTIONS,
  EMPTY_FILTERS,
  GROUP_OPTIONS,
  PUBLISHER_OPTIONS,
  type Filters,
} from '../utils/filters'
import { ChevronIcon, SearchIcon } from './icons'
import './SearchBar.css'

interface FilterSelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="filter">
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

export function SearchBar({ onSelect }: { onSelect: (id: string) => void }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const results = useMemo(() => applyFilters(filters), [filters])
  const sortBy = filters.sortBy

  const set = (key: keyof Filters) => (value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setOpen(true)
  }

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  return (
    <div className="searchbar" ref={ref}>
      <div className="searchbar__group searchbar__group--search">
        <span className="searchbar__key">Search</span>
        <input
          type="search"
          placeholder="Insert name"
          value={filters.query}
          onChange={(e) => set('query')(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) pick(results[0].id)
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        <SearchIcon />
      </div>

      <div className="searchbar__group searchbar__group--filters">
        <span className="searchbar__key">Filter by</span>
        <FilterSelect
          label="Powerstats"
          value={filters.sortBy}
          options={STAT_KEYS.map((k) => ({ value: k, label: `Top ${k}` }))}
          onChange={set('sortBy')}
        />
        <FilterSelect label="Group affiliation" value={filters.group} options={opts(GROUP_OPTIONS)} onChange={set('group')} />
        <FilterSelect label="Base" value={filters.base} options={opts(BASE_OPTIONS)} onChange={set('base')} />
        <FilterSelect
          label="Publisher"
          value={filters.publisher}
          options={PUBLISHER_OPTIONS}
          onChange={set('publisher')}
        />
      </div>

      {open && (
        <div className="results" role="listbox">
          <div className="results__head">
            <span>{results.length} {results.length === 1 ? 'hero' : 'heroes'}</span>
            {filters !== EMPTY_FILTERS && (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </button>
            )}
          </div>
          <ul>
            {results.slice(0, 60).map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => pick(h.id)}>
                  <img src={h.image.url} alt="" loading="lazy" />
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
    </div>
  )
}
