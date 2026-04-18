import { MATCH_STATUS } from './constants'

// Two match formats (per April 25 Tournament Captains Package):
//
//   Pool play ('pool'): 2 fixed sets. Each set plays to 25 (cap 27), starting
//     score 4-4. No 3rd/deciding set — each set counts INDEPENDENTLY toward
//     pool standings. Match is FINAL once both sets have a winner. The
//     match-level winner is whoever took more sets (null on a 1-1 split —
//     pool standings still credit each team the set they won).
//
//   Bracket play ('bracket', default): best-of-3. Sets 1 & 2 to 25 (cap 27);
//     deciding set 3 to 15 (cap 17 per house rules — captain's package says
//     "no cap" for the deciding set in playoffs, but we keep the 17 cap as a
//     safety. Override by passing `mode: 'bracket-no-cap'` if needed).

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

// Rule for set at `index` (0-based) given the match mode. Exposed so UI code
// can check "is THIS set finished yet?" without re-encoding captain's-package
// targets/caps in every component.
function rulesForIndex(index, mode) {
  if (mode === 'pool') return { target: 25, cap: 27 }
  if (mode === 'bracket-no-cap') return index === 2 ? { target: 15, cap: null } : { target: 25, cap: null }
  return index === 2 ? { target: 15, cap: 17 } : { target: 25, cap: 27 }
}

/**
 * Returns 'home' | 'away' | null for a single set, honoring the correct
 * target/cap for its position in the match. A set in progress (e.g. 18–15,
 * or 25–24 mid rally) returns null — NOT a set win.
 */
export function setWinnerAt(set, index, mode = 'pool') {
  if (!isValidSet(set)) return null
  return setWinner(set, rulesForIndex(index, mode))
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
  const ordered = (scores || [])
    .filter(isValidSet)
    .slice()
    .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0))
  let setsHome = 0
  let setsAway = 0
  for (let i = 0; i < ordered.length; i++) {
    const w = setWinner(ordered[i], rulesForIndex(i, mode))
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
  const mode = opts.mode || 'bracket'

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
    let rule
    if (mode === 'pool') {
      // Both pool sets to 25 cap 27, starting 4-4 (we don't model the
      // starting score here — it's purely a target/cap matter).
      rule = { target: 25, cap: 27 }
    } else if (mode === 'bracket-no-cap') {
      rule = i === 2 ? { target: 15, cap: null } : { target: 25, cap: null }
    } else {
      rule = i === 2 ? { target: 15, cap: 17 } : { target: 25, cap: 27 }
    }
    const winner = setWinner(ordered[i], rule)
    if (winner === 'home') { setsHome++; finishedSets++ }
    else if (winner === 'away') { setsAway++; finishedSets++ }
  }

  // Pool: match is FINAL once both sets have a winner. Winner = more sets;
  // 1-1 split leaves winnerId null (still a FINAL match — standings credit
  // each side their set win independently).
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
