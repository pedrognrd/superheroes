# Superhero Database

Ficha interactiva de los 731 superhéroes (todas las editoriales) con datos de [SuperHero API](https://www.superheroapi.com/).

React + Vite + TypeScript · Leaflet + OpenStreetMap para los mapas.

## Arrancar

```bash
npm install
npm run dev
```

## Datos

Los héroes se descargan una vez a `src/data/heroes.json` (la API no tiene endpoint para listarlos todos):

```bash
npm run fetch:heroes
```

Necesita `SUPERHERO_TOKEN` en `.env.local` (ver `.env.example`). El token solo lo usa este script: no llega al navegador ni al build.

### Portadas de primera aparición

```bash
npm run fetch:covers            # todos los que falten (~4 h la primera vez)
npm run fetch:covers -- 620 69  # solo esos ids
```

Usa la API de [Comic Vine](https://comicvine.gamespot.com/api/) (`COMICVINE_API_KEY` en `.env.local`). Es incremental y se puede cortar y reanudar. Solo acepta un personaje si coincide la identidad (nombre o nombre real) y la editorial o el número. Las correcciones manuales van en `MANUAL` de `src/data/covers.ts`.

Respaldo con Fandom (marvel.fandom.com / dc.fandom.com), sin clave, para los que Comic Vine no resuelve:

```bash
npm run fetch:covers:fandom           # todos los que falten (~1 petición/s)
npm run fetch:covers:fandom -- 95 69  # solo esos ids
```

Interpreta el texto de primera aparición ("Marvel Family #1 (December, 1945)"), busca la página del número ("The Marvel Family Vol 1 1"), exige que el año cuadre y guarda la portada en `covers-fandom.json`. Prioridad: `MANUAL` → Comic Vine → Fandom. Las imágenes de Fandom se cargan con `referrerPolicy="no-referrer"`, porque con Referer de otra web devuelven 404.

Personajes de cine, TV, libros y videojuegos (Star Wars, Star Trek, Heroes…): la tabla héroe → artículo de la obra de primera aparición está en `src/data/wikipediaWorks.ts`, y el script toma la imagen del infobox (póster, carátula o portada) de la Wikipedia en inglés:

```bash
npm run fetch:covers:wikipedia            # los que falten
npm run fetch:covers:wikipedia -- 418 7   # rehacer esos ids
```

Para añadir un personaje nuevo, añade su id a `screenWorks.ts` (cine/TV) o `wikipediaWorks.ts` (libros, videojuegos…) y ejecuta el script correspondiente.

Cine y televisión: pósters de [TMDB](https://www.themoviedb.org/) (de la película, o de la temporada en la que aparece el personaje). La tabla héroe → obra (título, año, temporada) está en `src/data/screenWorks.ts`. Necesita `TMDB_API_KEY` en `.env.local` (cuenta gratuita → Settings → API; vale la API Key o el Read Access Token):

```bash
npm run fetch:covers:tmdb            # los que falten
npm run fetch:covers:tmdb -- 418 87  # rehacer esos ids
```

Prioridad final: `MANUAL` → TMDB → Wikipedia → Comic Vine → Fandom.

### Lugares de los mapas

```bash
npm run fetch:places   # los que falten (~1 petición/s)
```

Geolocaliza de antemano la base y el lugar de nacimiento de cada héroe con Nominatim y guarda el resultado en `src/data/places.json`, así la web no consulta Nominatim en cada visita. En los lugares de Marvel y DC con página de lugar en Fandom, el mapa solo se usa si Nominatim devuelve el mismo nombre y es un lugar importante (New York, London) o de la región indicada ("Queens, New York"). Si no (Gotham City, Metropolis, Attilan, Asgard…), se muestra la imagen de su página de Fandom. Para Dark Horse, Star Wars y Star Trek se consultan sus wikis de franquicia (avp.fandom.com, Wookieepedia, Memory Alpha), donde una página cuenta como lugar si sus categorías lo dicen (Planets, Locations…). Los textos que no son un lugar (el de Alien es "Your chest :)") se fijan a mano en `MANUAL`, dentro del script, con una imagen de Fandom.

### Actualizar todo (héroes nuevos + portadas)

```bash
npm run update:data                  # héroes nuevos → Comic Vine → Fandom → informe
npm run update:data -- --skip-covers --skip-places  # solo héroes nuevos + informe
```

La API no tiene listado, así que `fetch:heroes` pide ids por encima del último hasta encontrar 5 seguidos inexistentes. Todo es incremental: solo procesa lo nuevo o pendiente. El informe final lista los héroes nuevos, los posibles duplicados y los que siguen sin portada, agrupados por editorial. Los duplicados confirmados van en `src/data/duplicates.ts` (se ocultan y su `#id` abre el original).

## Publicación

Web: **https://pedrognrd.github.io/superheroes/** · Repo: https://github.com/pedrognrd/superheroes

Cada push a `main` la vuelve a publicar con GitHub Actions (`.github/workflows/deploy.yml`, ~1 min). Vite usa `base: '/superheroes/'` solo al hacer build. Las claves de `.env.local` no se suben (`*.local` está en `.gitignore`) y solo las usan los scripts locales: después de `npm run update:data`, haz commit de `src/data/*.json` y push para publicar los datos nuevos.

## Estructura

```
src/
├── App.tsx                  maqueta general + héroe seleccionado (#id en la URL)
├── data/heroes.ts           carga los héroes y lista de editoriales
├── data/publisherFixes.ts   corrige editoriales mal etiquetadas en la API
├── data/covers.ts           portadas (Comic Vine + Fandom + correcciones)
├── utils/parse.ts           convierte los textos de la API (grupos, familiares, lugares)
├── utils/filters.ts         buscador y desplegables
├── hooks/useGeocode.ts      texto → coordenadas (Nominatim, con caché)
└── components/
    ├── Panel                marco con pestaña reutilizado en todo el diseño
    ├── SearchBar            buscador + filtros + resultados
    ├── HeroIdentity         retrato, alineación, nombre
    ├── PowerStatsPanel      → StatRing ×6
    ├── ConnectionsPanel     Connections + Aliases (GroupBadge)
    ├── PublisherPanel       Publisher + First appearance
    ├── MapPanel             Base y Place of birth
    └── AlterEgo             Appearance, Relatives, Occupation
```

## Pendiente

- Logos reales de editoriales (Fandom) → `src/assets/publishers/`
- Revisar portadas sin coincidencia en `src/data/covers.json` (valor `null`)
- Iconos de grupos (Flaticon, con atribución) → `GroupBadge.tsx`
- Ciudades ficticias (Gotham, Metropolis…) → coordenadas de una ciudad real
