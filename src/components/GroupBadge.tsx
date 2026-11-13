import avengers from '../assets/groups/avengers.svg'
import bprd from '../assets/groups/bprd.svg'
import fantasticFour from '../assets/groups/fantastic-four.svg'
import greenLantern from '../assets/groups/green-lantern-corps.svg'
import jla from '../assets/groups/jla.svg'
import others from '../assets/groups/others.svg'
import titans from '../assets/groups/titans.svg'
import xMen from '../assets/groups/x-men.svg'
import { BanIcon, MaskIcon } from './icons'

// Logos de los grupos más conocidos (src/assets/groups), cada uno en su color.
// Los demás grupos llevan el escudo genérico: en su color si está en la lista,
// si no en el color de acento.
const KNOWN_GROUPS: { match: RegExp; logo: string; color: string }[] = [
  { match: /avengers/i, logo: avengers, color: '#e0283c' },
  { match: /fantastic four/i, logo: fantasticFour, color: '#a24ee0' },
  { match: /x-?men|x-force|x-factor/i, logo: xMen, color: '#f2c230' },
  { match: /justice league/i, logo: jla, color: '#2f7fe0' },
  { match: /teen titans|titans/i, logo: titans, color: '#e0283c' },
  { match: /green lantern/i, logo: greenLantern, color: '#3fd36c' },
  { match: /b\.?p\.?r\.?d|bureau for paranormal/i, logo: bprd, color: '#f0763a' },
  { match: /justice society/i, logo: others, color: '#2f7fe0' },
  { match: /guardians of the galaxy/i, logo: others, color: '#f0763a' },
  { match: /s\.?h\.?i\.?e\.?l\.?d/i, logo: others, color: '#9fb6c8' },
  { match: /hydra/i, logo: others, color: '#e0283c' },
  { match: /defenders/i, logo: others, color: '#e0457a' },
  { match: /suicide squad/i, logo: others, color: '#f0c58a' },
]

export function GroupBadge({ name, formerly }: { name: string; formerly: boolean }) {
  if (formerly) return <BanIcon />
  const known = KNOWN_GROUPS.find((g) => g.match.test(name))
  return <MaskIcon src={known?.logo ?? others} width={32} height={30} color={known?.color ?? 'var(--accent)'} />
}
