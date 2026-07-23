// Round-robin generator.
//
// For the canonical 4-team pool (the format in the April 25 Captains
// Package), we use the EXACT round ordering from the schedule:
//
//   Round 1: seed1 vs seed3
//   Round 2: seed2 vs seed4
//   Round 3: seed1 vs seed4
//   Round 4: seed2 vs seed3
//   Round 5: seed3 vs seed4
//   Round 6: seed1 vs seed2
//
// This guarantees every team sits exactly one round between games (30-min
// rest between matches) and the two top-seeded teams meet LAST, which keeps
// the pool-determining matchup for the end of pool play.
//
// For other sizes we fall back to the circle method so the generator still
// works for 3-, 5-, 6-, 8-team pools (e.g. edge cases / different events).
//
// `teams` order defines seed order: teams[0] = seed 1, teams[1] = seed 2, etc.
// Output: [{ homeTeamId, awayTeamId, roundNumber, gameOrder }]

const FOUR_TEAM_ORDER = [
  // [seed-index-A, seed-index-B] (0-based)
  [0, 2], // seed1 vs seed3
  [1, 3], // seed2 vs seed4
  [0, 3], // seed1 vs seed4
  [1, 2], // seed2 vs seed3
  [2, 3], // seed3 vs seed4
  [0, 1], // seed1 vs seed2
]

export function generateRoundRobin(teams) {
  const ids = teams.map(t => t?.id ?? t)
  if (ids.length < 2) return []

  // Captain's-package pool (4 teams) — use the canonical ordering.
  if (ids.length === 4) {
    return FOUR_TEAM_ORDER.map(([a, b], i) => ({
      homeTeamId: ids[a],
      awayTeamId: ids[b],
      roundNumber: i + 1,
      gameOrder: 1,
    }))
  }

  // Generic circle method for any other size.
  const odd = ids.length % 2 === 1
  const ringSize = odd ? ids.length + 1 : ids.length
  const ring = odd ? [...ids, null] : [...ids]
  const roundsCount = ringSize - 1
  const halfSize = ringSize / 2

  const out = []
  let rotating = ring.slice(1)
  for (let r = 0; r < roundsCount; r++) {
    const current = [ring[0], ...rotating]
    let gameOrder = 1
    for (let i = 0; i < halfSize; i++) {
      const a = current[i]
      const b = current[ringSize - 1 - i]
      if (a != null && b != null) {
        out.push({ homeTeamId: a, awayTeamId: b, roundNumber: r + 1, gameOrder: gameOrder++ })
      }
    }
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)]
  }
  return out
}
