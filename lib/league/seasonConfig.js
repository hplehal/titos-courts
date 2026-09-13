// Per-season league structure shared by admin writes, public standings and
// the playoff generator: tier court layouts, weekly tier points, and playoff
// division sizes. Pure module (no Prisma) so client and server both import it.

export const DIVISION_NAMES = ['Diamond', 'Platinum', 'Gold', 'Silver']

// Default playoff court per division position (Tuesday COED layout). Only
// used to pre-fill a playoff draft — admin edits courts afterwards.
const DEFAULT_DIVISION_COURTS = [6, 8, 9, 10]

export function isMensLeague(slug = '') {
  return slug.includes('sunday') || slug.includes('mens')
}

export function leagueTypeFor(slug = '') {
  return isMensLeague(slug) ? 'mens' : 'coed'
}

/* ─── Tiers ─── */

// Court/time-slot presets per league. Tiers are laid out court by court,
// filling one time slot before moving to the next; tiers past the preset
// reuse its courts (and stay in the last slot). Admin fine-tunes them on
// /admin/courts.
//   MENS:     courts 7,6,8,9,10 — single slot
//   Thursday: courts 9,10 — early (6:30–8:30) then late (8:30–10:30)
//   Tuesday:  courts 6,8,9,10 — early then late
function tierPreset(slug) {
  if (isMensLeague(slug)) return { courts: [7, 6, 8, 9, 10], slots: ['single'] }
  if (slug.includes('thursday')) return { courts: [9, 10], slots: ['early', 'late'] }
  return { courts: [6, 8, 9, 10], slots: ['early', 'late'] }
}

export function defaultTierCount(slug = '') {
  if (isMensLeague(slug)) return 5
  if (slug.includes('thursday')) return 4
  return 8
}

/** Court + time slot for a single (1-based) tier number. */
export function tierLayout(slug = '', tierNumber) {
  const { courts, slots } = tierPreset(slug)
  const i = tierNumber - 1
  return {
    tierNumber,
    courtNumber: courts[i % courts.length],
    timeSlot: slots[Math.min(Math.floor(i / courts.length), slots.length - 1)],
  }
}

export function defaultTierLayout(slug = '', tierCount = defaultTierCount(slug)) {
  return Array.from({ length: tierCount }, (_, i) => tierLayout(slug, i + 1))
}

// Weekly base points for the tier a team played in: top tier earns the most,
// bottom tier earns 1. Anchored at 8 tiers so every season keeps its
// historical numbers (Tier 1 = 8 … Tier 8 = 1); only seasons with more than
// 8 tiers extend the scale instead of flattening the bottom tiers to 1.
export function tierFactor(tierNumber, tierCount = 0) {
  const top = Math.max(8, tierCount) + 1
  return Math.max(1, top - (tierNumber || 1))
}

/* ─── Playoff divisions ─── */

// Even split used when a season has no stored sizes.
//   COED: 4 divisions, leftovers stacked on top (22 → 6/6/5/5).
//   MENS: 2 halves — Diamond takes the odd seat (15 → 8/7).
export function defaultDivisionSizes(totalTeams, leagueType = 'coed') {
  if (leagueType === 'mens') {
    const half = Math.ceil(totalTeams / 2)
    return [half, totalTeams - half]
  }
  const base = Math.floor(totalTeams / 4)
  const extras = totalTeams % 4
  return [0, 1, 2, 3].map(i => base + (i < extras ? 1 : 0))
}

/**
 * A season's divisions in rank order: stored rows win, otherwise the even
 * split. Empty divisions are dropped.
 * @returns {Array<{position:number, name:string, teamCount:number, courtNumber:number|null}>}
 */
export function resolveDivisions(stored, totalTeams, leagueType = 'coed') {
  const rows = stored?.length
    ? [...stored].sort((a, b) => a.position - b.position)
    : defaultDivisionSizes(totalTeams, leagueType).map((teamCount, i) => ({ position: i + 1, teamCount }))
  return rows
    .filter(d => d.teamCount > 0)
    .map(d => ({
      position: d.position,
      name: DIVISION_NAMES[d.position - 1] || `Division ${d.position}`,
      teamCount: d.teamCount,
      courtNumber: d.courtNumber ?? DEFAULT_DIVISION_COURTS[d.position - 1] ?? null,
    }))
}

// Division for a 1-based standings rank. Ranks past the last division land in
// the last one so a late-added team never drops off the table.
export function divisionForRank(rank, divisions) {
  let upper = 0
  for (const d of divisions) {
    upper += d.teamCount
    if (rank <= upper) return d
  }
  return divisions[divisions.length - 1] || null
}
