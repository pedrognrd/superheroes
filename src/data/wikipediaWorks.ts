// Personajes de cine, televisión, libros y videojuegos: id del héroe → artículos de
// la Wikipedia en inglés de la obra donde aparecen por primera vez, por orden de
// preferencia. `npm run fetch:covers:wikipedia` toma la imagen del infobox del primer
// artículo que la tenga (póster, portada o carátula) → covers-wikipedia.json.
//
// Para las series con temporadas se usa la página de la temporada (tiene carátula);
// los episodios sueltos rara vez tienen imagen.
const STAR_WARS_IV = ['Star Wars (film)']
const PHANTOM_MENACE = ['Star Wars: Episode I – The Phantom Menace']
const FORCE_AWAKENS = ['Star Wars: The Force Awakens']
const ROGUE_ONE = ['Rogue One']
const TNG = ['Encounter at Farpoint', 'Star Trek: The Next Generation season 1', 'Star Trek: The Next Generation']
const TOS = ['The Man Trap', 'Star Trek: The Original Series season 1', 'Star Trek: The Original Series']
const HEROES_1 = ['Heroes season 1', 'Heroes (American TV series)']
const HEROES_2 = ['Heroes season 2', 'Heroes (American TV series)']
const HEROES_3 = ['Heroes season 3', 'Heroes (American TV series)']
const HEROES_4 = ['Heroes season 4', 'Heroes (American TV series)']
const NO_ORDINARY_FAMILY = ['No Ordinary Family']
const ALPHAS = ['Alphas season 1', 'Alphas (TV series)']

export const WIKIPEDIA_WORKS: Record<string, string[]> = {
  // Star Wars
  '127': ['The Star Wars Holiday Special'], // Boba Fett
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
  '729': ['The Empire Strikes Back'], // Yoda
  '341': ['Raiders of the Lost Ark'], // Indiana Jones

  // Star Trek
  '210': TNG, // Data
  '357': TNG, // Jean-Luc Picard
  '533': TNG, // Q
  '353': TOS, // James T. Kirk
  '627': TOS, // Spock
  '380': ['Caretaker (Star Trek: Voyager)', 'Star Trek: Voyager season 1', 'Star Trek: Voyager'], // Janeway

  // Heroes (NBC)
  '7': HEROES_2, // Adam Monroe
  '16': HEROES_3, // Alex Woolsly
  '22': HEROES_1, // Ando Masahashi
  '178': HEROES_1, // Claire Bennet
  '220': HEROES_1, // DL Hawkins
  '239': HEROES_2, // Elle Bishop
  '326': HEROES_1, // Hiro Nakamura
  '362': HEROES_1, // Jessica Sanders
  '417': HEROES_4, // Luke Campbell
  '437': HEROES_1, // Matt Parkman
  '440': HEROES_2, // Maya Herrera
  '449': HEROES_1, // Micah Sanders
  '465': HEROES_1, // Mohinder Suresh
  '469': HEROES_2, // Monica Dawson
  '486': HEROES_1, // Nathan Petrelli
  '492': HEROES_1, // Niki Sanders
  '647': HEROES_1, // Sylar
  '673': HEROES_3, // Tracy Strauss

  // Otras series
  '84': ALPHAS, // Bill Harken
  '147': ALPHAS, // Cameron Hicks
  '277': ALPHAS, // Gary Bell
  '493': ALPHAS, // Nina Theroux
  '539': ALPHAS, // Rachel Pirzad
  '200': NO_ORDINARY_FAMILY, // Daphne Powell
  '364': NO_ORDINARY_FAMILY, // Jim Powell
  '365': NO_ORDINARY_FAMILY, // JJ Powell
  '636': NO_ORDINARY_FAMILY, // Stephanie Powell
  '656': ['The Cape (2011 TV series)'], // The Cape
  '349': ['24 season 1', '24 (TV series)'], // Jack Bauer
  '87': ['The Six Million Dollar Man', 'The Bionic Woman'], // Bionic Woman (Jaime Sommers)
  '91': ['Birdman and the Galaxy Trio'], // Birdman
  '154': ['Coon 2: Hindsight', 'South Park season 14'], // Captain Hindsight

  // Cine
  '139': ['The Fly (1986 film)'], // Brundlefly
  '203': ['Darkman'], // Darkman
  '245': ['Mission: Impossible (film)'], // Ethan Hunt
  '287': ['Godzilla (1954 film)'], // Godzilla
  '308': ['Hancock (film)'], // Hancock
  '389': ['King Kong (1933 film)'], // King Kong
  '510': ['Paul Blart: Mall Cop'], // Paul Blart

  // Hellboy (Dark Horse): novelas gráficas sin número
  '2': ['Hellboy: Seed of Destruction', 'Hellboy'], // Abe Sapien
  '411': ['Hellboy: Seed of Destruction', 'Hellboy'], // Liz Sherman
  '366': ['B.P.R.D.: Hollow Earth and Other Stories', 'B.P.R.D.'], // Johann Krauss

  // Libros, manga, videojuegos, publicidad
  '352': ['Casino Royale (novel)'], // James Bond
  '47': ['Astro Boy'], // Astro Boy (manga, 1952)
  '310': ["Harry Potter and the Philosopher's Stone"], // Harry Potter
  '355': ['The Bourne Identity (novel)'], // Jason Bourne
  '381': ['The Hunger Games (novel)'], // Katniss Everdeen
  '540': ['First Blood (novel)'], // Rambo
  '574': ['The Fellowship of the Ring'], // Sauron
  '435': ['Halo: Combat Evolved'], // Master Chief
  '393': ['Kool-Aid Man'], // Kool-Aid Man
}
