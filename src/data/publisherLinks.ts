// Editorial (ya corregida con publisherFixes) → artículo de la Wikipedia en inglés,
// para que el logo del panel Publisher enlace a más información.
// Las que no tienen enlace (Unknown, Team Epic TV) se muestran sin él.
const WIKI = 'https://en.wikipedia.org/wiki/'

const ARTICLES: Record<string, string> = {
  'Marvel Comics': 'Marvel Comics',
  'DC Comics': 'DC Comics',
  'Dark Horse Comics': 'Dark Horse Comics',
  'Image Comics': 'Image Comics',
  'IDW Publishing': 'IDW Publishing',
  Wildstorm: 'WildStorm',
  'Icon Comics': 'Icon Comics',
  'Titan Books': 'Titan Publishing Group',
  Rebellion: 'Rebellion Developments',
  Shueisha: 'Shueisha',
  HarperCollins: 'HarperCollins',
  Scholastic: 'Scholastic Corporation',
  'J. K. Rowling': 'J. K. Rowling',
  'J. R. R. Tolkien': 'J. R. R. Tolkien',
  'Tezuka Productions': 'Tezuka Productions',
  'King Features Syndicate': 'King Features Syndicate',
  'George Lucas': 'Lucasfilm',
  'Star Trek': 'Star Trek',
  'NBC - Heroes': 'Heroes (American TV series)',
  NBC: 'NBC',
  SyFy: 'Syfy',
  'ABC Studios': 'ABC Signature',
  'South Park': 'South Park',
  'Hanna-Barbera': 'Hanna-Barbera',
  'Universal Studios': 'Universal Pictures',
  '20th Century Fox': '20th Century Studios',
  'Paramount Pictures': 'Paramount Pictures',
  'Sony Pictures': 'Sony Pictures',
  'Carolco Pictures': 'Carolco Pictures',
  'RKO Pictures': 'RKO Pictures',
  Toho: 'Toho',
  Microsoft: 'Microsoft',
  'Kraft Foods': 'Kraft Foods',
}

export function publisherLink(publisher: string): string | null {
  const article = ARTICLES[publisher]
  return article ? WIKI + encodeURIComponent(article.replaceAll(' ', '_')) : null
}
