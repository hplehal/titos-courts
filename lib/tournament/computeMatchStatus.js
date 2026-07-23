import { MATCH_STATUS } from './constants'

// Supported match formats:
//
//   'pool'                / 'pool-2set-25-cap-27': legacy two-set pool play.
//     Each set to 25 cap 27. Match is FINAL once both sets have a winner;
//     winner is whoever took more sets (null on 1-1 split, both sets still
//     count toward pool standings independently).
//
//   'pool-1set' / 'pool-1set-25-cap-27': single-set elimination-style pool
//     match (May 23 REC tournament + play-in rounds). One set to 25 cap 27;
//     match is FINAL the moment that set has a winner. No 1-1 split logic.
//
//   'bracket' / 'bo3-25-15-cap-17': best-of-3 (default for bracket play).
//     Sets 1 & 2 to 25 cap 27; deciding set 3 to 15 cap 17.
//
//   'bracket-no-cap' / 'bo3-25-15-no-cap': best-of-3, no caps. Sets 1 & 2 to
//     25 win-by-2, set 3 to 15 win-by-2.

const isValidSet = (s) =>
  s &&
  typeof s === 'object' &&
  Number.isFinite(s.homeScore) &&
  Number.isFinite(s.awayScore) &&
  s.homeScore >= 0 &&
  s.awayScore >= 0

function setWinner(set, { target, cap }) {
  const { homeScore: h, awayScore: a } = set
  // A set is won when: (a) someone reached cap (no win-by-2 needed), OR
  // (b) someone reached target AND leads by 2.
  if (cap != null && h >= cap && h > a) return 'home'
  if (cap != null && a >= cap && a > h) return 'away'
  if (h >= target && h - a >= 2) return 'home'
  if (a >= target && a - h >= 2) return 'away'
  return null // in progress or tied near cap
}

// Normalize the public-facing format strings used in the schema to the
// internal modes this engine understands. Keeps callers from having to
// remember which legacy aliases exist.
function normalizeMode(mode) {
  if (!mode) return 'bracket'
  if (mode === 'pool' || mode === 'pool-2set-25-cap-27') return 'pool'
  if (mode === 'pool-1set' || mode === 'pool-1set-25-cap-27') return 'pool-1set'
  if (mode === 'bracket-no-cap' || mode === 'bo3-25-15-no-cap') return 'bracket-no-cap'
  if (mode === 'bracket' || mode === 'bo3-25-15-cap-17') return 'bracket'
  return mode
}

// Rule for set at `index` (0-based) given the match mode. Exposed so UI code
// can check "is THIS set finished yet?" without re-encoding captain's-package
// targets/caps in every component.
function rulesForIndex(index, mode) {
  const m = normalizeMode(mode)
  if (m === 'pool' || m === 'pool-1set') return { target: 25, cap: 27 }
  if (m === 'bracket-no-cap') return index === 2 ? { target: 15, cap: null } : { target: 25, cap: null }
  return index === 2 ? { target: 15, cap: 17 } : { target: 25, cap: 27 }
}

// How many sets a match of this format requires before it's FINAL.
// 'pool-1set' is a single-set decider; 'pool' is two independent sets;
// best-of-3 modes need 2 set wins to clinch.
export function expectedSetCount(mode) {
  const m = normalizeMode(mode)
  if (m === 'pool-1set') return 1
  if (m === 'pool') return 2
  return 3
}

/**
 * Returns 'home' | 'away' | null for a single set, honoring the correct
 * target/cap for its position in the match. A set in progress (e.g. 18–15,
 * or 25–24 mid rally) returns null — NOT a set win.
 */
export function setWinnerAt(set, index, mode = 'pool') {
  if (!isValidSet(set)) return null
  return setWinner(set, rulesForIndex(index, normalizeMode(mode)))
}

/**
 * Count completed set wins for each side. A partial/in-progress set does
 * NOT increment either tally — use this anywhere the UI previously did
 * `if (s.homeScore > s.awayScore) setsHome++`, which incorrectly treated a
 * mid-set lead as a won set.
 *
 * @param {Array<{setNumber:number, homeScore:number, awayScore:number}>} scores
 * @param {'pool'|'bracket'|'bracket-no-cap'} [mode='pool']
 * @returns {{ setsHome: number, setsAway: number }}
 */
export function tallySetsWon(scores, mode = 'pool') {
  const m = normalizeMode(mode)
  const ordered = (scores || [])
    .filter(isValidSet)
    .slice()
    .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0))
  let setsHome = 0
  let setsAway = 0
  for (let i = 0; i < ordered.length; i++) {
    const w = setWinner(ordered[i], rulesForIndex(i, m))
    if (w === 'home') setsHome++
    else if (w === 'away') setsAway++
  }
  return { setsHome, setsAway }
}

/**
 * Derive match status + winner + set counts from a set-scores array.
 *
 * @param {Array<{setNumber:number, homeScore:number, awayScore:number}>} scores
 * @param {{homeTeamId?: string|null, awayTeamId?: string|null}} [teams]
 * @param {{ mode?: 'pool'|'bracket'|'bracket-no-cap' }} [opts]
 * @returns {{ status: string, setsHome: number, setsAway: number, winnerId: string|null }}
 */
export function computeMatchStatus(scores, teams = {}, opts = {}) {
  const { homeTeamId = null, awayTeamId = null } = teams
  const mode = normalizeMode(opts.mode || 'bracket')

  if (!Array.isArray(scores) || scores.length === 0) {
    return { status: MATCH_STATUS.SCHEDULED, setsHome: 0, setsAway: 0, winnerId: null }
  }

  const ordered = scores
    .filter(isValidSet)
    .slice()
    .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0))

  if (ordered.length === 0) {
    return { status: MATCH_STATUS.SCHEDULED, setsHome: 0, setsAway: 0, winnerId: null }
  }

  let setsHome = 0
  let setsAway = 0
  let finishedSets = 0

  for (let i = 0; i < ordered.length; i++) {
    const winner = setWinner(ordered[i], rulesForIndex(i, mode))
    if (winner === 'home') { setsHome++; finishedSets++ }
    else if (winner === 'away') { setsAway++; finishedSets++ }
  }

  // pool-1set: single-set decider. The match is FINAL the instant that
  // one set has a winner; otherwise LIVE (someone has started entering
  // scores but neither side has clinched yet).
  if (mode === 'pool-1set') {
    if (finishedSets >= 1) {
      const winnerId = setsHome > setsAway ? homeTeamId : awayTeamId
      return { status: MATCH_STATUS.FINAL, setsHome, setsAway, winnerId }
    }
    return { status: MATCH_STATUS.LIVE, setsHome, setsAway, winnerId: null }
  }

  // pool (2-set): FINAL once both sets have a winner. winnerId is null on
  // a 1-1 split — pool standings still credit each team their set wins.
  if (mode === 'pool') {
    if (finishedSets >= 2) {
      let winnerId = null
      if (setsHome > setsAway) winnerId = homeTeamId
      else if (setsAway > setsHome) winnerId = awayTeamId
      return { status: MATCH_STATUS.FINAL, setsHome, setsAway, winnerId }
    }
    return { status: MATCH_STATUS.LIVE, setsHome, setsAway, winnerId: null }
  }

  // Bracket: best-of-3 — first to 2 set wins.
  if (setsHome >= 2) {
    return { status: MATCH_STATUS.FINAL, setsHome, setsAway, winnerId: homeTeamId }
  }
  if (setsAway >= 2) {
    return { status: MATCH_STATUS.FINAL, setsHome, setsAway, winnerId: awayTeamId }
  }
  return { status: MATCH_STATUS.LIVE, setsHome, setsAway, winnerId: null }
}
