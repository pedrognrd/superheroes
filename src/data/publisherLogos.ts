// Editorial → logo de src/assets/publishers (SVG monocromos del proyecto anterior).
// Las editoriales sin logo se muestran con su nombre.
import abcStudios from '../assets/publishers/abc-studios.svg'
import darkHorse from '../assets/publishers/dark-horse.svg'
import dcComics from '../assets/publishers/dc-comics.svg'
import dragonBall from '../assets/publishers/dragon-ball.svg'
import harryPotter from '../assets/publishers/harry-potter.svg'
import heroesHelix from '../assets/publishers/heroes-helix.svg'
import iconComics from '../assets/publishers/icon-comics.svg'
import jamesBond from '../assets/publishers/james-bond.svg'
import idw from '../assets/publishers/idw-publishing.svg'
import image from '../assets/publishers/image.svg'
import marvel from '../assets/publishers/marvel.svg'
import microsoft from '../assets/publishers/microsoft.svg'
import rebellion from '../assets/publishers/rebellion.svg'
import sony from '../assets/publishers/sony-pictures.svg'
import southPark from '../assets/publishers/south-park.svg'
import starTrek from '../assets/publishers/star-trek.svg'
import starWars from '../assets/publishers/star-wars.svg'
import syfy from '../assets/publishers/syfy.svg'
import tolkien from '../assets/publishers/tolkien.svg'

const LOGOS: Record<string, string> = {
  'Marvel Comics': marvel,
  'DC Comics': dcComics,
  'Dark Horse Comics': darkHorse,
  'Image Comics': image,
  'IDW Publishing': idw,
  'Icon Comics': iconComics,
  Rebellion: rebellion, // 2000 AD (Judge Dredd)
  'J. K. Rowling': harryPotter,
  'J. R. R. Tolkien': tolkien,
  'George Lucas': starWars,
  'Star Trek': starTrek,
  'NBC - Heroes': heroesHelix,
  SyFy: syfy,
  'ABC Studios': abcStudios,
  'Sony Pictures': sony,
  'South Park': southPark,
  Microsoft: microsoft,
}

// Logos por personaje cuando la editorial agrupa obras distintas
// (Shueisha publica Dragon Ball, Naruto y One Punch Man; Titan Books, mucho más que 007)
const BY_HERO: Record<string, string> = {
  '352': jamesBond, // James Bond
  '289': dragonBall, // Goku
  '686': dragonBall, // Vegeta
}

export const publisherLogo = (publisher: string, heroId: string): string | null =>
  BY_HERO[heroId] ?? LOGOS[publisher] ?? null
