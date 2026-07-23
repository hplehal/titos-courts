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
 * Returns the time slot color and label for a tier. Pass `leagueSlug`
 * to get league-specific time labels — Thursday REC COED runs an
 * earlier schedule (6:30–10:30 PM) than Tuesday COED (8 PM–12 AM).
 */
export function getSlotInfo(tierNumber, timeSlot, leagueSlug) {
  const isThursday = !!(leagueSlug && leagueSlug.includes('thursday'))
  if (timeSlot === 'single') return { color: 'text-slot-single', bg: 'bg-slot-single/10', border: 'border-slot-single/25', label: '9 PM – 12 AM' }
  // Thursday has only 4 tiers (1-2 early, 3-4 late) so we defer entirely to timeSlot.
  // Tuesday COED has 8 tiers and the tierNumber heuristic (≤4 = early) is used as a fallback.
  const isEarly = isThursday ? timeSlot === 'early' : (tierNumber <= 4 || timeSlot === 'early')
  if (isEarly) {
    return {
      color: 'text-slot-early',
      bg: 'bg-slot-early/10',
      border: 'border-slot-early/25',
      label: isThursday ? '6:30 – 8:30 PM' : '8 – 10 PM',
    }
  }
  return {
    color: 'text-slot-late',
    bg: 'bg-slot-late/10',
    border: 'border-slot-late/25',
    label: isThursday ? '8:30 – 10:30 PM' : '10 PM – 12 AM',
  }
}

/**
 * Returns division info for a given rank within a league.
 *
 * MENS: split in half — top half Diamond, bottom half Platinum. A 12-team
 * Sunday MENS season pays out Diamond 1-6, Platinum 7-12. We deliberately
 * don't surface Gold/Silver/Bronze on MENS because there are only two payout
 * tiers; forcing a 5-way split would invent divisions that don't exist.
 *
 * COED (24 teams): 4-way EVEN split, 6 teams each:
 *   Diamond  1-6
 *   Platinum 7-12
 *   Gold     13-18
 *   Silver   19-24
 * Bronze was retired alongside the move to a 4-division payout pool — every
 * division now lines up with a 6-team single-elim playoff bracket
 * (top-2 byes + 3v6/4v5 → SF + Final).
 *
 * The split scales: we partition `totalTeams` into 4 contiguous buckets with
 * the extras (Math.ceil) given to the higher-prestige divisions first, so a
 * 22-team season would land as 6/6/5/5 rather than dropping an unlucky team
 * into a half-empty Silver. 23 → 6/6/6/5; 26 → 7/7/6/6; etc.
 *
 * Pass leagueType='mens' for the two-way MENS split; defaults to 'coed'.
 */
export function getDivisionInfo(rank, totalTeams, leagueType = 'coed') {
  const divisions = [
    { name: 'Diamond', color: 'div-diamond', bgClass: 'division-diamond' },
    { name: 'Platinum', color: 'div-platinum', bgClass: 'division-platinum' },
    { name: 'Gold', color: 'div-gold', bgClass: 'division-gold' },
    { name: 'Silver', color: 'div-silver', bgClass: 'division-silver' },
  ]

  // MENS: single cut down the middle. Odd totals give Diamond the extra seat
  // (Math.ceil), matching how the prize pool splits in practice.
  if (leagueType === 'mens') {
    const half = Math.ceil(totalTeams / 2)
    return rank <= half ? divisions[0] : divisions[1]
  }

  // COED: 4-way even split with leftovers stacked into the top divisions.
  // For the canonical 24-team season this is exactly 6/6/6/6.
  const base = Math.floor(totalTeams / 4)
  const extras = totalTeams % 4
  const sizes = [
    base + (extras > 0 ? 1 : 0), // Diamond
    base + (extras > 1 ? 1 : 0), // Platinum
    base + (extras > 2 ? 1 : 0), // Gold
    base,                        // Silver
  ]
  let upper = 0
  for (let i = 0; i < divisions.length; i++) {
    upper += sizes[i]
    if (rank <= upper) return divisions[i]
  }
  // Defensive fallback for ranks beyond totalTeams — keep them in Silver.
  return divisions[divisions.length - 1]
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
 * Returns the time range display string for a league based on slug or day.
 *   Sunday MENS:    9 PM – 12 AM (single slot)
 *   Thursday REC:   6:30 – 10:30 PM (earlier schedule)
 *   Tuesday COED:   8 PM – 12 AM (default)
 */
export function getLeagueTimeDisplay(slug) {
  if (slug && (slug.includes('sunday') || slug.includes('mens'))) {
    return '9 PM – 12 AM'
  }
  if (slug && slug.includes('thursday')) {
    return '6:30 – 10:30 PM'
  }
  return '8 PM – 12 AM'
}

