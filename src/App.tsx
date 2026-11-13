import { useEffect, useState } from 'react'
import { heroById, heroes } from './data/heroes'
import { STAT_KEYS } from './types'
import { AppearancePanel, OccupationBar, RelativesPanel } from './components/AlterEgo'
import { AliasesPanel, ConnectionsPanel } from './components/ConnectionsPanel'
import { HeroIdentity } from './components/HeroIdentity'
import { MapPanel } from './components/MapPanel'
import { PowerStatsPanel } from './components/PowerStatsPanel'
import { FirstAppearancePanel, PublisherPanel } from './components/PublisherPanel'
import { SearchBar } from './components/SearchBar'

const DEFAULT_ID = '620' // Spider-Man
const pickOne = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

/** Héroe inicial: un powerstat al azar y, de entre los que superan 90 en él, uno al azar */
function randomHeroId() {
  const stat = pickOne(STAT_KEYS)
  const strong = heroes.filter((h) => Number(h.powerstats[stat]) > 90)
  return strong.length ? pickOne(strong).id : DEFAULT_ID
}

/** El héroe seleccionado se guarda en el historial del navegador, no en la URL:
    la dirección siempre es la de la portada y el botón "atrás" vuelve al anterior.
    Los enlaces antiguos con #id se siguen abriendo y luego se limpia la dirección.
    Al recargar se mantiene el héroe; en una visita nueva se muestra uno aleatorio. */
const BASE_URL = window.location.pathname

/** Héroe al cargar: enlace antiguo con #id, el que había antes de recargar, o el aleatorio */
const initialId = (fallback: string) => {
  const fromHash = window.location.hash.slice(1)
  if (heroById(fromHash)) return fromHash
  const fromHistory = window.history.state?.id
  return heroById(fromHistory) ? fromHistory : fallback
}

function useSelectedHero() {
  const [fallback] = useState(randomHeroId)
  const [id, setId] = useState(() => initialId(fallback))
  useEffect(() => {
    window.history.replaceState({ id }, '', BASE_URL)
    const onPop = (e: PopStateEvent) => setId(e.state?.id && heroById(e.state.id) ? e.state.id : fallback)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar: guarda el héroe inicial
  }, [fallback])
  const select = (next: string) => {
    if (next !== id) window.history.pushState({ id: next }, '', BASE_URL)
    setId(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return [heroById(id) ?? heroes[0], select] as const
}

export default function App() {
  const [hero, select] = useSelectedHero()

  useEffect(() => {
    document.title = `${hero.name} · Superhero Database`
  }, [hero])

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__deco" aria-hidden="true" />
        <SearchBar onSelect={select} />
      </header>

      <main className="dashboard" key={hero.id}>
        <aside className="dashboard__identity">
          <HeroIdentity hero={hero} />
        </aside>

        <section className="hero-info">
          <div className="section-head">
            <span className="section-head__note">// Alignment: {hero.biography.alignment}</span>
            <h2 className="section-head__title">Superhero information</h2>
          </div>
          <div className="hero-info__grid">
            <PowerStatsPanel hero={hero} />
            <div className="stack">
              <ConnectionsPanel hero={hero} />
              <AliasesPanel hero={hero} />
            </div>
            <div className="stack">
              <PublisherPanel hero={hero} />
              <FirstAppearancePanel hero={hero} />
            </div>
            <MapPanel title="Base" place={hero.work.base} align="right" className="base-map" />
          </div>
        </section>

        <section className="alter-ego">
          <div className="section-head">
            <h2 className="section-head__title">Alter-ego information</h2>
          </div>
          <div className="alter-ego__grid">
            <MapPanel
              title="Place of birth"
              place={hero.biography['place-of-birth']}
              className="birth-map map-panel--left-label"
            />
            <AppearancePanel hero={hero} />
            <RelativesPanel hero={hero} onSelect={select} />
            <OccupationBar hero={hero} />
          </div>
        </section>
      </main>

      <footer className="app__footer">
        Data: <a href="https://www.superheroapi.com/">SuperHero API</a> · Maps: © OpenStreetMap, <a href="https://www.fandom.com/">Fandom</a> · Covers: <a href="https://comicvine.gamespot.com/">Comic Vine</a>, <a href="https://www.fandom.com/">Fandom</a>, <a href="https://en.wikipedia.org/">Wikipedia</a>, <a href="https://www.themoviedb.org/">TMDB</a> · Icons: <a href="https://www.flaticon.com/free-icons/strong" title="strong icons">Puckung</a>, <a href="https://www.flaticon.com/free-icons/earth" title="earth icons">Nsu Rabo Elijah</a> – Flaticon · Design: Pasajero Gráfico
        <p className="app__footer-note">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </footer>
    </div>
  )
}
