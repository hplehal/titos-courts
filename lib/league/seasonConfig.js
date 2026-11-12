// League + season structure shared by admin writes, public pages and the
// playoff generator: each league's game-night rules, tier court layouts,
// weekly tier points, and playoff division sizes. Pure module (no Prisma) so
// client and server both import it.

// Most playoff divisions one season can run — one per tier at the extreme.
export const MAX_DIVISIONS = 8

// What each division position is called when a season hasn't renamed it.
// Seasons rename divisions on /admin/seasons, so never use this list to
// label a division you have a stored row for — call divisionName() instead.
export const DEFAULT_DIVISION_NAMES = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Copper', 'Steel', 'Iron']

// Default playoff court per division position (Tuesday COED layout). Only
// used to pre-fill a playoff draft — admin edits courts afterwards.
const DEFAULT_DIVISION_COURTS = [6, 8, 9, 10]

/** A division's display name: the season's own name, else the position default. */
export function divisionName(position, name) {
  const custom = typeof name === 'string' ? name.trim() : ''
  return custom || DEFAULT_DIVISION_NAMES[position - 1] || `Division ${position}`
}

/* ─── League rules ─── */

// What a league falls back to for any rule it doesn't set (Tuesday COED).
// Every league stores its own rules on the League row — see /admin/leagues.
export const LEAGUE_RULE_DEFAULTS = Object.freeze({
  roundsPerWeek: 2,
  headToHead: false,
  divisionCount: 4,
  slotMode: 'two',
  earlySlotLabel: '8 – 10 PM',
  lateSlotLabel: '10 PM – 12 AM',
  singleSlotLabel: '9 PM – 12 AM',
  timeRangeLabel: '8 PM – 12 AM',
  courts: [6, 8, 9, 10],
  defaultTierCount: 8,
})

/** A league's rules with defaults filled in. Accepts a League row, a partial object, or null. */
export function leagueRules(league) {
  const rules = { ...LEAGUE_RULE_DEFAULTS }
  if (!league) return rules
  for (const key of Object.keys(LEAGUE_RULE_DEFAULTS)) {
    if (league[key] != null) rules[key] = league[key]
  }
  if (!rules.courts.length) rules.courts = LEAGUE_RULE_DEFAULTS.courts
  return rules
}

/* ─── Tiers ─── */

// Tiers are laid out court by court from the league's court list, filling the
// early slot before the late one (or everything in the single slot). Tiers
// past the court list reuse its courts and stay in the last slot. Admin
// fine-tunes them on /admin/courts.
/** Court + time slot for a single (1-based) tier number. */
export function tierLayout(league, tierNumber) {
  const { courts, slotMode } = leagueRules(league)
  const slots = slotMode === 'single' ? ['single'] : ['early', 'late']
  const i = tierNumber - 1
  return {
    tierNumber,
    courtNumber: courts[i % courts.length],
    timeSlot: slots[Math.min(Math.floor(i / courts.length), slots.length - 1)],
  }
}

export function defaultTierLayout(league, tierCount = leagueRules(league).defaultTierCount) {
  return Array.from({ length: tierCount }, (_, i) => tierLayout(league, i + 1))
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

// Even split used when a season has no stored sizes: `divisionCount`
// contiguous buckets with leftovers stacked on top.
//   4 divisions: 22 → 6/6/5/5
//   2 divisions: 15 → 8/7
export function defaultDivisionSizes(totalTeams, divisionCount = 4) {
  const count = Math.max(1, Math.min(divisionCount, MAX_DIVISIONS))
  const base = Math.floor(totalTeams / count)
  const extras = totalTeams % count
  return Array.from({ length: count }, (_, i) => base + (i < extras ? 1 : 0))
}

/**
 * A season's divisions in rank order: stored rows win, otherwise the even
 * split across the league's division count. Empty divisions are dropped.
 * @returns {Array<{position:number, name:string, teamCount:number, courtNumber:number|null}>}
 */
export function resolveDivisions(stored, totalTeams, divisionCount = 4) {
  const rows = stored?.length
    ? [...stored].sort((a, b) => a.position - b.position)
    : defaultDivisionSizes(totalTeams, divisionCount).map((teamCount, i) => ({ position: i + 1, teamCount }))
  return rows
    .filter(d => d.teamCount > 0)
    .map(d => ({
      position: d.position,
      name: divisionName(d.position, d.name),
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

/* ─── Current season ─── */

// How close a season is to being "the one the league is playing right now".
// Lower wins. Anything unrecognised sorts with registration.
const SEASON_STATUS_RANK = { playoffs: 0, active: 0, registration: 1, upcoming: 1, completed: 2, archived: 3 }

/**
 * The season an admin screen should open on: the one in play (active or in
 * playoffs), else the one taking registrations, else the most recent finished
 * one. Ties go to the higher season number.
 *
 * Picking simply the highest season number is wrong for the weeks when next
 * season is already open for registration but the current one is still being
 * played — it lands on an empty season with no weeks or matches.
 * @param {Array<{status?:string, seasonNumber:number}>} seasons one league's seasons
 */
export function pickCurrentSeason(seasons) {
  const rank = s => SEASON_STATUS_RANK[s.status] ?? 1
  return [...(seasons || [])].sort((a, b) => rank(a) - rank(b) || b.seasonNumber - a.seasonNumber)[0] || null
}
