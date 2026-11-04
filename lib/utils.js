import { MAX_DIVISIONS, divisionForRank, divisionName, leagueRules, resolveDivisions } from '@/lib/league/seasonConfig'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Returns Tailwind classes for a given tier number (1-8).
 * Tiers 1-4 (early slot, 8-10 PM) = blue tones
 * Tiers 5-8 (late slot, 10-12 AM) = purple tones
 */
export function getTierColor(tierNumber) {
  const colors = {
    1: { bg: 'bg-tier-1/15', text: 'text-tier-1', border: 'border-tier-1/30', accent: 'tier-1', slot: 'early' },
    2: { bg: 'bg-tier-2/15', text: 'text-tier-2', border: 'border-tier-2/30', accent: 'tier-2', slot: 'early' },
    3: { bg: 'bg-tier-3/15', text: 'text-tier-3', border: 'border-tier-3/30', accent: 'tier-3', slot: 'early' },
    4: { bg: 'bg-tier-4/15', text: 'text-tier-4', border: 'border-tier-4/30', accent: 'tier-4', slot: 'early' },
    5: { bg: 'bg-tier-5/15', text: 'text-tier-5', border: 'border-tier-5/30', accent: 'tier-5', slot: 'late' },
    6: { bg: 'bg-tier-6/15', text: 'text-tier-6', border: 'border-tier-6/30', accent: 'tier-6', slot: 'late' },
    7: { bg: 'bg-tier-7/15', text: 'text-tier-7', border: 'border-tier-7/30', accent: 'tier-7', slot: 'late' },
    8: { bg: 'bg-tier-8/15', text: 'text-tier-8', border: 'border-tier-8/30', accent: 'tier-8', slot: 'late' },
  }
  return colors[tierNumber] || colors[1]
}

/**
 * Returns the time slot color and label for a tier. Pass the league (any
 * object carrying its slot labels) to get that league's times — e.g. Thursday
 * REC COED runs 6:30–10:30 PM while Tuesday COED runs 8 PM–12 AM.
 */
export function getSlotInfo(tierNumber, timeSlot, league) {
  const rules = leagueRules(league)
  if (timeSlot === 'single') return { color: 'text-slot-single', bg: 'bg-slot-single/10', border: 'border-slot-single/25', label: rules.singleSlotLabel }
  // The tier's saved slot wins; tiers without one fall back to 1-4 = early.
  const isEarly = timeSlot ? timeSlot === 'early' : tierNumber <= 4
  if (isEarly) {
    return {
      color: 'text-slot-early',
      bg: 'bg-slot-early/10',
      border: 'border-slot-early/25',
      label: rules.earlySlotLabel,
    }
  }
  return {
    color: 'text-slot-late',
    bg: 'bg-slot-late/10',
    border: 'border-slot-late/25',
    label: rules.lateSlotLabel,
  }
}

/**
 * Division styling and name for a 1-based standings rank.
 *
 * Divisions are contiguous buckets down the standings. A season can store its
 * own sizes and names on /admin/seasons (e.g. a 5-team Thursday Diamond);
 * without stored rows the league's `divisionCount` is split evenly, with the
 * extras going to the higher divisions first — 22 teams over 4 divisions
 * lands as 6/6/5/5 rather than leaving a half-empty bottom division.
 *
 * Colours are keyed by POSITION, never by name, so renaming a division keeps
 * its place in the palette. The class names below are spelled out in full
 * because Tailwind only generates utilities it can find as literal strings.
 */
const DIVISION_TEXT_CLASSES = [
  'text-div-1', 'text-div-2', 'text-div-3', 'text-div-4',
  'text-div-5', 'text-div-6', 'text-div-7', 'text-div-8',
]

/** Colour slot for a 1-based division position. */
export function divisionStyle(position) {
  const i = Math.min(Math.max(position || 1, 1), MAX_DIVISIONS)
  return { color: `div-${i}`, bgClass: `division-${i}`, textClass: DIVISION_TEXT_CLASSES[i - 1] }
}

export function getDivisionInfo(rank, totalTeams, divisionCount = 4, divisions = null) {
  const resolved = resolveDivisions(divisions, totalTeams, divisionCount)
  const division = divisionForRank(rank, resolved) || resolved[resolved.length - 1]
  const position = division?.position ?? 1
  return { name: division?.name || divisionName(position), ...divisionStyle(position) }
}


/**
 * Returns an arrow character for movement direction.
 */
export function getMovementIcon(movement) {
  if (movement === 'up') return '\u2191'
  if (movement === 'down') return '\u2193'
  return '\u2014'
}

/**
 * Generate a short abbreviation from a team name.
 * Takes the first letter of each word.
 * E.g., "Sets on the Beach" -> "SB", "Block Party" -> "BP", "Notorious D.I.G." -> "ND"
 */
export function getTeamAbbreviation(name) {
  const ignore = new Set(['on', 'the', 'of', 'and', 'a', 'an', 'in', 'at', 'to', '&'])
  return name
    .replace(/[.']/g, '')
    .split(/\s+/)
    .filter(w => !ignore.has(w.toLowerCase()))
    .map(w => w.charAt(0).toUpperCase())
    .join('')
}

/**
 * The whole game night for a league, e.g. "8 PM – 12 AM". Set per league on
 * /admin/leagues; falls back to the Tuesday COED hours.
 */
export function getLeagueTimeDisplay(league) {
  return leagueRules(league).timeRangeLabel
}

