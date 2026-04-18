// Ref-rotation helper.
//
// Source of truth: the April 25 Captains Package. Its pool-play schedule
// table shows TIME (REF) with the reffing SEED in parentheses:
//
//   10:00 (4)  R1 matchups: s1 v s3  → seed 4 refs in every pool
//   10:30 (3)  R2 matchups: s2 v s4  → seed 3 refs
//   11:00 (2)  R3 matchups: s1 v s4  → seed 2 refs
//   11:30 (4)  R4 matchups: s2 v s3  → seed 4 refs
//   12:00 (1)  R5 matchups: s3 v s4  → seed 1 refs
//   12:30 (3)  R6 matchups: s1 v s2  → seed 3 refs
//
// One ref per match (not lead + line). Each team refs 1–2 matches across
// the 6-round pool. The other non-playing team in the pool is just
// resting (not on whistle).
//
// Pure, framework-agnostic — safe to import from both server and client.

export const FOUR_TEAM_REF_BY_ROUND = {
  1: 4,
  2: 3,
  3: 2,
  4: 4,
  5: 1,
  6: 3,
}

/**
 * @param {{ homeTeamId?: string, awayTeamId?: string, roundNumber?: number }} match
 * @param {Array<{ id: string, name: string, seed?: number|null }>} poolTeams
 * @returns {{ ref: object|null, resting: object[] }}
 *   ref: the one team assigned to whistle this match (per PDF table)
 *   resting: every non-playing team in the pool (ref included, watcher too)
 */
export function refAssignmentForMatch(match, poolTeams) {
  if (!match || !Array.isArray(poolTeams) || poolTeams.length < 3) {
    return { ref: null, resting: [] }
  }

  const playing = new Set([match.homeTeamId, match.awayTeamId].filter(Boolean))
  const resting = poolTeams.filter((t) => !playing.has(t.id))

  // Canonical PDF assignment: standard 4-team pool with a known roundNumber.
  if (
    poolTeams.length === 4 &&
    match.roundNumber &&
    FOUR_TEAM_REF_BY_ROUND[match.roundNumber]
  ) {
    const refSeed = FOUR_TEAM_REF_BY_ROUND[match.roundNumber]
    const ref = poolTeams.find((t) => t.seed === refSeed) ?? null
    // If the PDF-assigned seed is somehow one of the playing teams (e.g. bad
    // data / custom schedule), fall through to the heuristic.
    if (ref && !playing.has(ref.id)) {
      return { ref, resting }
    }
  }

  // Fallback for 3-team, 5+-team, or untagged pools: the lowest-seeded
  // non-playing team takes the whistle. Deterministic and sensible.
  const sortedResting = resting.slice().sort((a, b) => {
    const sa = a.seed ?? Infinity
    const sb = b.seed ?? Infinity
    if (sa !== sb) return sa - sb
    return a.name.localeCompare(b.name)
  })
  return { ref: sortedResting[0] ?? null, resting: sortedResting }
}

/**
 * Convenience: which seed refs a given roundNumber in a standard 4-team pool.
 * Returns null when the round is outside 1..6 or the pool isn't a 4-pool.
 * @param {number} roundNumber
 * @returns {number|null}
 */
export function refSeedForRound(roundNumber) {
  return FOUR_TEAM_REF_BY_ROUND[roundNumber] ?? null
}
