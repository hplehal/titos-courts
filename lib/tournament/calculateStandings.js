// Pool standings calculation with head-to-head tiebreaker.
//
// Per April 25 Tournament Captains Package: pool play is 2 fixed sets and
// EACH SET counts independently. So set wins are the primary standings
// currency, not match wins.
//
// Sort order (each level breaks ties for the previous):
//   1. Set wins (desc) — each of the 2 pool sets counts individually
//   2. Head-to-head point differential among tied teams only (face-off diff)
//   3. Overall point differential across all pool matches (desc)
//   4. Match wins (desc) — retained as a final tiebreaker for completeness
//
// Exports `computeStandingsFromMatches(teams, matches)` — pure, testable, no
// DB. Kept free of Prisma imports so it can be used from client components
// (e.g. TournamentHubClient) without dragging the pg driver into the browser
// bundle. Server code that needs DB-backed standings should inline the query
// and pass the results through this function.

import { MATCH_STATUS } from './constants'

/**
 * Given an array of teams and match rows (each with set scores), return
 * sorted standings rows. This is pure — tests can call directly.
 *
 * @param {Array<{id:string, name:string, seed?:number}>} teams
 * @param {Array<{
 *   id:string, homeTeamId:string, awayTeamId:string, status:string,
 *   winnerId?:string|null,
 *   scores: Array<{homeScore:number, awayScore:number, setNumber:number}>
 * }>} matches
 * @returns {Array<{
 *   teamId:string, name:string, seed:number|null,
 *   w:number, l:number, sw:number, sl:number, pf:number, pa:number, diff:number,
 *   qualifies:'gold'|'silver'|'none'
 * }>}
 */
export function computeStandingsFromMatches(teams, matches) {
  const rows = new Map()
  for (const t of teams) {
    rows.set(t.id, {
      teamId: t.id,
      name: t.name,
      seed: t.seed ?? null,
      w: 0, l: 0, t: 0,
      sw: 0, sl: 0,
      pf: 0, pa: 0,
      diff: 0,
      qualifies: 'none',
    })
  }

  // Only completed matches contribute
  const completed = (matches || []).filter(m => m.status === MATCH_STATUS.FINAL)

  for (const match of completed) {
    const home = rows.get(match.homeTeamId)
    const away = rows.get(match.awayTeamId)
    if (!home || !away) continue // team not in this pool — defensive

    let setsHome = 0
    let setsAway = 0
    let ptsHome = 0
    let ptsAway = 0
    for (const s of (match.scores || [])) {
      if (!Number.isFinite(s.homeScore) || !Number.isFinite(s.awayScore)) continue
      ptsHome += s.homeScore
      ptsAway += s.awayScore
      if (s.homeScore > s.awayScore) setsHome++
      else if (s.awayScore > s.homeScore) setsAway++
    }

    home.sw += setsHome; home.sl += setsAway
    away.sw += setsAway; away.sl += setsHome
    home.pf += ptsHome; home.pa += ptsAway
    away.pf += ptsAway; away.pa += ptsHome

    // Pool play is 2 fixed sets → a 1-1 match is a TIE, not a win for either
    // side. Previously the else-branch credited the away team with a match
    // win on any non-home-win outcome, which made W/L columns inconsistent
    // with each team's real set results.
    if (setsHome > setsAway) { home.w++; away.l++ }
    else if (setsAway > setsHome) { away.w++; home.l++ }
    else { home.t++; away.t++ }
  }

  for (const row of rows.values()) {
    row.diff = row.pf - row.pa
  }

  // Sort with full tiebreaker chain. Primary = set wins (captain's package).
  const ordered = Array.from(rows.values()).sort((a, b) => {
    if (b.sw !== a.sw) return b.sw - a.sw
    // Same set wins — compute head-to-head among teams tied at this sw count
    const groupIds = Array.from(rows.values())
      .filter(r => r.sw === a.sw)
      .map(r => r.teamId)
    const h2hA = headToHeadDiff(a.teamId, groupIds, completed)
    const h2hB = headToHeadDiff(b.teamId, groupIds, completed)
    if (h2hB !== h2hA) return h2hB - h2hA
    if (b.diff !== a.diff) return b.diff - a.diff
    if (b.w !== a.w) return b.w - a.w
    return a.name.localeCompare(b.name) // stable tiebreaker
  })

  // Gold/Silver qualifier tags (top 2 / bottom 2). Only meaningful when the
  // pool has >=4 teams AND at least some matches are complete.
  if (ordered.length >= 4 && completed.length > 0) {
    ordered[0].qualifies = 'gold'
    ordered[1].qualifies = 'gold'
    ordered[ordered.length - 1].qualifies = 'silver'
    ordered[ordered.length - 2].qualifies = 'silver'
  }

  return ordered
}

/**
 * Point differential for `teamId` considering only matches against teams in
 * `groupIds`. Used by the head-to-head tiebreaker when multiple teams are
 * tied on match wins.
 */
function headToHeadDiff(teamId, groupIds, matches) {
  if (!groupIds.includes(teamId)) return 0
  let diff = 0
  for (const m of matches) {
    const isHome = m.homeTeamId === teamId && groupIds.includes(m.awayTeamId)
    const isAway = m.awayTeamId === teamId && groupIds.includes(m.homeTeamId)
    if (!isHome && !isAway) continue
    for (const s of (m.scores || [])) {
      const my    = isHome ? s.homeScore : s.awayScore
      const their = isHome ? s.awayScore : s.homeScore
      if (Number.isFinite(my) && Number.isFinite(their)) diff += (my - their)
    }
  }
  return diff
}

