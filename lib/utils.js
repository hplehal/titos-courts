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

export function formatDateTime(date) {
  return `${formatDate(date)} at ${formatTime(date)}`
}

/**
 * Returns Tailwind classes for a given tier number (1-8).
 */
export function getTierColor(tierNumber) {
  const colors = {
    1: { bg: 'bg-tier-1/15', text: 'text-tier-1', border: 'border-tier-1/30', accent: 'tier-1' },
    2: { bg: 'bg-tier-2/15', text: 'text-tier-2', border: 'border-tier-2/30', accent: 'tier-2' },
    3: { bg: 'bg-tier-3/15', text: 'text-tier-3', border: 'border-tier-3/30', accent: 'tier-3' },
    4: { bg: 'bg-tier-4/15', text: 'text-tier-4', border: 'border-tier-4/30', accent: 'tier-4' },
    5: { bg: 'bg-tier-5/15', text: 'text-tier-5', border: 'border-tier-5/30', accent: 'tier-5' },
    6: { bg: 'bg-tier-6/15', text: 'text-tier-6', border: 'border-tier-6/30', accent: 'tier-6' },
    7: { bg: 'bg-tier-7/15', text: 'text-tier-7', border: 'border-tier-7/30', accent: 'tier-7' },
    8: { bg: 'bg-tier-8/15', text: 'text-tier-8', border: 'border-tier-8/30', accent: 'tier-8' },
  }
  return colors[tierNumber] || colors[1]
}

/**
 * Returns division info for a given rank within a league.
 * COED (24 teams): Diamond 1-5, Platinum 6-10, Gold 11-15, Silver 16-20, Bronze 21-24
 * MENS (15 teams): Diamond 1-3, Platinum 4-6, Gold 7-9, Silver 10-12, Bronze 13-15
 * Pass leagueType='mens' for the 15-team grouping, defaults to 'coed'.
 */
export function getDivisionInfo(rank, totalTeams, leagueType = 'coed') {
  const divisions = [
    { name: 'Diamond', color: 'div-diamond', bgClass: 'division-diamond' },
    { name: 'Platinum', color: 'div-platinum', bgClass: 'division-platinum' },
    { name: 'Gold', color: 'div-gold', bgClass: 'division-gold' },
    { name: 'Silver', color: 'div-silver', bgClass: 'division-silver' },
    { name: 'Bronze', color: 'div-bronze', bgClass: 'division-bronze' },
  ]

  // For MENS or small leagues (15 or fewer teams), groups of 3
  if (leagueType === 'mens' || totalTeams <= 15) {
    const groupSize = 3
    const divisionIndex = Math.floor((rank - 1) / groupSize)
    const clamped = Math.min(divisionIndex, divisions.length - 1)
    return divisions[clamped]
  }

  // COED structure (24 teams): 5-5-5-5-4
  if (rank <= 5) return divisions[0]  // Diamond: 1-5
  if (rank <= 10) return divisions[1] // Platinum: 6-10
  if (rank <= 15) return divisions[2] // Gold: 11-15
  if (rank <= 20) return divisions[3] // Silver: 16-20
  return divisions[4]                 // Bronze: 21-24
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
 * Returns base points for a tier.
 * Tiers 1-4 earn 10 base points, tiers 5-8 earn 9.
 */
export function getBasePoints(tierNumber) {
  return tierNumber <= 4 ? 10 : 9
}

export function getMatchStatus(match) {
  if (match.status === 'completed') return 'Completed'
  if (match.status === 'live') return 'Live'
  return 'Upcoming'
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
 * Sunday/MENS leagues run 9 PM - 12 AM, others run 8 PM - 12 AM.
 */
export function getLeagueTimeDisplay(slug) {
  if (slug && (slug.includes('sunday') || slug.includes('mens'))) {
    return '9 PM – 12 AM'
  }
  return '8 PM – 12 AM'
}

export function getPoolColor(poolName) {
  const colors = {
    'Pool A': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', solid: '#f59e0b' },
    'Pool B': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', solid: '#10b981' },
    'Pool C': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', solid: '#a855f7' },
    'Pool D': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', solid: '#0ea5e9' },
  }
  return colors[poolName] || colors['Pool A']
}
