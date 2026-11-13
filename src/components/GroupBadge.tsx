import { BanIcon } from './icons'

// Insignias para los grupos más conocidos. Para añadir uno nuevo basta con
// una entrada más (o cambiarlo por un logo de Flaticon en src/assets/groups).
const KNOWN_GROUPS: { match: RegExp; label: string; color: string }[] = [
  { match: /avengers/i, label: 'A', color: '#e0283c' },
  { match: /fantastic four/i, label: '4', color: '#a24ee0' },
  { match: /x-?men|x-force|x-factor/i, label: 'X', color: '#f2c230' },
  { match: /justice league/i, label: 'JL', color: '#2f7fe0' },
  { match: /justice society/i, label: 'JS', color: '#2f7fe0' },
  { match: /teen titans|titans/i, label: 'T', color: '#e0283c' },
  { match: /guardians of the galaxy/i, label: 'G', color: '#f0763a' },
  { match: /s\.?h\.?i\.?e\.?l\.?d/i, label: 'S', color: '#9fb6c8' },
  { match: /green lantern/i, label: 'GL', color: '#3fd36c' },
  { match: /hydra/i, label: 'H', color: '#e0283c' },
  { match: /defenders/i, label: 'D', color: '#e0457a' },
  { match: /suicide squad/i, label: 'SS', color: '#f0c58a' },
]

export function GroupBadge({ name, formerly }: { name: string; formerly: boolean }) {
  if (formerly) return <BanIcon />
  const known = KNOWN_GROUPS.find((g) => g.match.test(name))
  const color = known?.color ?? '#7fc4ea'
  const label = known?.label ?? name.replace(/^(member|leader|ally|agent|partner) of\s+(the\s+)?/i, '').charAt(0)
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke={color} strokeWidth="2.5" />
      <text
        x="16"
        y="17"
        fill={color}
        fontSize={label.length > 1 ? 12 : 17}
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font)"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  )
}
