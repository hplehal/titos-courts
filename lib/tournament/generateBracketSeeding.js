// Bracket seeding with cross-pool matchups.
//
// Per April 25 Tournament Captains Package: pools are paired A↔B and C↔D
// (NOT a rotational N/2 shift). For 4 pools, Gold and Silver brackets each
// have 4 QF matches:
//
//   GOLD (top 2 from each pool):
//     QF1: A1 vs B2
//     QF2: B1 vs A2
//     QF3: C1 vs D2
//     QF4: D1 vs C2
//
//   SILVER (bottom 2 from each pool):
//     QF1: A3 vs B4
//     QF2: B3 vs A4
//     QF3: C3 vs D4
//     QF4: D3 vs C4
//
// SF mapping: QF1/QF2 → SF1, QF3/QF4 → SF2 (keeps the A/B region separate
// from the C/D region until the final).
//
// For pool counts ≠ 4 we fall back to a generic "pair adjacent pools"
// algorithm (pools 0↔1, 2↔3, …). Odd pool counts leave the last pool
// unpaired — callers should pad or throw upstream; we return what we can.

import { BRACKET_ROUND, DIVISION_GOLD } from './constants'

/**
 * @param {Array<{ label:string, standings: Array<{teamId:string, name:string}> }>} pools
 *   Each pool has computed standings (array ordered best-to-worst).
 * @param {'Gold'|'Silver'} division
 * @returns {Array<{
 *   slot:number, round:1, teamAId:string, teamBId:string,
 *   teamASeedLabel:string, teamBSeedLabel:string
 * }>}
 */
export function generateBracketSeeding(pools, division) {
  if (!pools || pools.length < 2) return []

  const isGold = division === DIVISION_GOLD

  // Seed indices (0-based) feeding this division. Gold uses the top two
  // seeds of each pool; Silver uses the bottom two. We fetch by explicit
  // index so variable pool sizes still work (e.g. 5-team pool → Silver
  // uses indices 3, 4).
  const seedIdx = (pool, slot) => {
    // slot 1 = best in division, slot 2 = 2nd best
    if (isGold) return slot === 1 ? 0 : 1
    const last = pool.standings.length - 1
    return slot === 1 ? last - 1 : last
  }
  const seedRank = (pool, slot) => {
    if (isGold) return slot === 1 ? 1 : 2
    // Silver labels as poolSize-1 and poolSize (e.g. 4-team pool → A3/A4)
    const size = pool.standings.length
    return slot === 1 ? size - 1 : size
  }

  const matches = []
  let slot = 1
  const N = pools.length

  if (N % 2 === 0) {
    // Even pool count — pair adjacent pools (0↔1), (2↔3), (4↔5), ...
    // Matches the captain's-package spec for 4 pools (A↔B, C↔D).
    for (let i = 0; i < N - 1; i += 2) {
      const poolA = pools[i]
      const poolB = pools[i + 1]

      const a1 = poolA.standings[seedIdx(poolA, 1)]
      const b2 = poolB.standings[seedIdx(poolB, 2)]
      const b1 = poolB.standings[seedIdx(poolB, 1)]
      const a2 = poolA.standings[seedIdx(poolA, 2)]

      if (a1?.teamId && b2?.teamId) {
        matches.push({
          slot: slot++,
          round: BRACKET_ROUND.QUARTERFINAL,
          teamAId: a1.teamId,
          teamBId: b2.teamId,
          teamASeedLabel: `${poolA.label}${seedRank(poolA, 1)}`,
          teamBSeedLabel: `${poolB.label}${seedRank(poolB, 2)}`,
        })
      }
      if (b1?.teamId && a2?.teamId) {
        matches.push({
          slot: slot++,
          round: BRACKET_ROUND.QUARTERFINAL,
          teamAId: b1.teamId,
          teamBId: a2.teamId,
          teamASeedLabel: `${poolB.label}${seedRank(poolB, 1)}`,
          teamBSeedLabel: `${poolA.label}${seedRank(poolA, 2)}`,
        })
      }
    }
  } else {
    // Odd pool count — rotational crossover so every pool participates.
    // Each pool's top seed plays the 2nd seed of a non-adjacent pool.
    const shift = Math.floor(N / 2) + 1
    for (let i = 0; i < N; i++) {
      const poolA = pools[i]
      const poolB = pools[(i + shift) % N]
      if (poolA === poolB) continue
      const a1 = poolA.standings[seedIdx(poolA, 1)]
      const b2 = poolB.standings[seedIdx(poolB, 2)]
      if (!a1?.teamId || !b2?.teamId) continue
      matches.push({
        slot: slot++,
        round: BRACKET_ROUND.QUARTERFINAL,
        teamAId: a1.teamId,
        teamBId: b2.teamId,
        teamASeedLabel: `${poolA.label}${seedRank(poolA, 1)}`,
        teamBSeedLabel: `${poolB.label}${seedRank(poolB, 2)}`,
      })
    }
  }

  return matches
}

/**
 * Given a set of QF matches, build the SF and F match shells. Returns
 * ALL bracket matches (QF + SF + F) with nextMatchId chain pre-computed.
 * Caller persists these in insertion order so nextMatchId references
 * resolve cleanly (F first, then SFs pointing at F, then QFs pointing at SFs).
 */
export function buildBracketShells(qfMatches) {
  const qfCount = qfMatches.length
  if (qfCount === 0) return []

  // Final (1 match, round 3)
  const finalSlot = {
    slot: 1,
    round: BRACKET_ROUND.FINAL,
    teamAId: null,
    teamBId: null,
    teamASeedLabel: 'SF1 Winner',
    teamBSeedLabel: 'SF2 Winner',
  }

  // Semifinals (ceil(qf/2) matches, round 2)
  const sfCount = Math.ceil(qfCount / 2)
  const sfs = []
  for (let s = 0; s < sfCount; s++) {
    sfs.push({
      slot: s + 1,
      round: BRACKET_ROUND.SEMIFINAL,
      teamAId: null,
      teamBId: null,
      teamASeedLabel: `QF${s * 2 + 1} Winner`,
      teamBSeedLabel: `QF${s * 2 + 2} Winner`,
    })
  }

  // QF → SF mapping: QF1 & QF2 → SF1; QF3 & QF4 → SF2; ...
  // SF → F mapping: SF1 & SF2 → F
  // Callers use these indices (after persisting) to populate nextMatchId.
  const qfs = qfMatches.map((qf, i) => ({ ...qf, _sfIndex: Math.floor(i / 2) }))
  const _sfs = sfs.map((sf, i) => ({ ...sf, _finalIndex: Math.floor(i / 2) }))

  return {
    qfs,
    sfs: _sfs,
    final: finalSlot,
  }
}
