// Personajes de cine y televisión: id del héroe → obra de primera aparición en TMDB.
// `npm run fetch:covers:tmdb` busca la obra (título + año) y guarda su póster
// (o el de la temporada indicada) en covers-tmdb.json.
// Libros, videojuegos y demás siguen en wikipediaWorks.ts.
export interface ScreenWork {
  type: 'movie' | 'tv'
  query: string
  /** Año de estreno (película) o de inicio de la serie: desambigua remakes */
  year: number
  /** Temporada de la primera aparición (solo series) */
  season?: number
}

const movie = (query: string, year: number): ScreenWork => ({ type: 'movie', query, year })
const tv = (query: string, year: number, season?: number): ScreenWork => ({ type: 'tv', query, year, season })

const STAR_WARS_IV = movie('Star Wars', 1977)
const PHANTOM_MENACE = movie('Star Wars: Episode I - The Phantom Menace', 1999)
const FORCE_AWAKENS = movie('Star Wars: The Force Awakens', 2015)
const ROGUE_ONE = movie('Rogue One: A Star Wars Story', 2016)
const TNG_1 = tv('Star Trek: The Next Generation', 1987, 1)
const TOS_1 = tv('Star Trek', 1966, 1)
const heroes = (season: number) => tv('Heroes', 2006, season)
const ALPHAS_1 = tv('Alphas', 2011, 1)
const NO_ORDINARY_FAMILY_1 = tv('No Ordinary Family', 2010, 1)

export const SCREEN_WORKS: Record<string, ScreenWork> = {
  // Star Wars e Indiana Jones
  '127': movie('The Star Wars Holiday Special', 1978), // Boba Fett
  '207': PHANTOM_MENACE, // Darth Maul
  '208': STAR_WARS_IV, // Darth Vader
  '297': STAR_WARS_IV, // Greedo
  '307': STAR_WARS_IV, // Han Solo
  '354': PHANTOM_MENACE, // Jar Jar Binks
  '377': ROGUE_ONE, // Jyn Erso
  '378': ROGUE_ONE, // K-2SO
  '398': FORCE_AWAKENS, // Kylo Ren
  '418': STAR_WARS_IV, // Luke Skywalker
  '555': FORCE_AWAKENS, // Rey
  '639': STAR_WARS_IV, // Stormtrooper
  '729': movie('The Empire Strikes Back', 1980), // Yoda
  '341': movie('Raiders of the Lost Ark', 1981), // Indiana Jones

  // Star Trek
  '210': TNG_1, // Data
  '357': TNG_1, // Jean-Luc Picard
  '533': TNG_1, // Q
  '353': TOS_1, // James T. Kirk
  '627': TOS_1, // Spock
  '380': tv('Star Trek: Voyager', 1995, 1), // Kathryn Janeway

  // Heroes (NBC)
  '7': heroes(2), // Adam Monroe
  '16': heroes(3), // Alex Woolsly
  '22': heroes(1), // Ando Masahashi
  '178': heroes(1), // Claire Bennet
  '220': heroes(1), // DL Hawkins
  '239': heroes(2), // Elle Bishop
  '326': heroes(1), // Hiro Nakamura
  '362': heroes(1), // Jessica Sanders
  '417': heroes(4), // Luke Campbell
  '437': heroes(1), // Matt Parkman
  '440': heroes(2), // Maya Herrera
  '449': heroes(1), // Micah Sanders
  '465': heroes(1), // Mohinder Suresh
  '469': heroes(2), // Monica Dawson
  '486': heroes(1), // Nathan Petrelli
  '492': heroes(1), // Niki Sanders
  '647': heroes(1), // Sylar
  '673': heroes(3), // Tracy Strauss

  // Otras series
  '84': ALPHAS_1, // Bill Harken
  '147': ALPHAS_1, // Cameron Hicks
  '277': ALPHAS_1, // Gary Bell
  '493': ALPHAS_1, // Nina Theroux
  '539': ALPHAS_1, // Rachel Pirzad
  '200': NO_ORDINARY_FAMILY_1, // Daphne Powell
  '364': NO_ORDINARY_FAMILY_1, // Jim Powell
  '365': NO_ORDINARY_FAMILY_1, // JJ Powell
  '636': NO_ORDINARY_FAMILY_1, // Stephanie Powell
  '656': tv('The Cape', 2011, 1), // The Cape
  '349': tv('24', 2001, 1), // Jack Bauer
  '87': tv('The Six Million Dollar Man', 1974, 2), // Bionic Woman: aparece en la 2.ª temporada (1975)
  '91': tv('Birdman and the Galaxy Trio', 1967), // Birdman
  '154': tv('South Park', 1997, 14), // Captain Hindsight

  // Dark Horse: personajes de cine/TV con cómics licenciados
  '18': movie('Alien', 1979), // Alien
  '526': movie('Predator', 1987), // Predator
  '650': movie('The Terminator', 1984), // T-800
  '649': movie('Terminator 2: Judgment Day', 1991), // T-1000
  '651': movie('Terminator 3: Rise of the Machines', 2003), // T-850
  '652': movie('Terminator 3: Rise of the Machines', 2003), // T-X
  '209': movie('The Incredibles', 2004), // Dash
  '236': movie('The Incredibles', 2004), // Elastigirl
  '351': movie('The Incredibles', 2004), // Jack-Jack
  '476': movie('The Incredibles', 2004), // Mr Incredible
  '696': movie('The Incredibles', 2004), // Violet Parr
  '140': movie('Buffy the Vampire Slayer', 1992), // Buffy (película de 1992)
  '23': tv('Buffy the Vampire Slayer', 1997, 1), // Angel

  // Cine
  '139': movie('The Fly', 1986), // Brundlefly
  '203': movie('Darkman', 1990), // Darkman
  '245': movie('Mission: Impossible', 1996), // Ethan Hunt
  '287': movie('Godzilla', 1954), // Godzilla
  '308': movie('Hancock', 2008), // Hancock
  '389': movie('King Kong', 1933), // King Kong
  '510': movie('Paul Blart: Mall Cop', 2009), // Paul Blart
}
