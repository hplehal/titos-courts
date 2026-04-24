// Bracket seeding with cross-pool matchups.
//
// Per April 25 Tournament Captains Package: pools are paired A↔B and C↔D
// (NOT a rotational N/2 shift), and the two matchups per pair are
// INTERLEAVED across courts so the 1:00 PM slot runs on all four courts
// simultaneously, then the 1:45 PM slot plays the "rematch" half:
//
//   GOLD (top 2 from each pool) — position → (court, time):
//     pos 0: A1 v B2    → C1 @ 1:00 PM
//     pos 1: C1 v D2    → C2 @ 1:00 PM
//     pos 2: A2 v B1    → C1 @ 1:45 PM
//     pos 3: C2 v D1    → C2 @ 1:45 PM
//
//   SILVER (bottom 2 from each pool):
//     pos 0: A3 v B4    → C3 @ 1:00 PM
//     pos 1: C3 v D4    → C4 @ 1:00 PM
//     pos 2: A4 v B3    → C3 @ 1:45 PM
//     pos 3: C4 v D3    → C4 @ 1:45 PM
//
// SF mapping (wired in the admin route, not here): same-court QFs feed the
// same SF, so QF0 & QF2 (both Court 1) → SF0; QF1 & QF3 (both Court 2) → SF1.
// Both SFs then feed the Final, which plays on Court 1 (Gold) or Court 3
// (Silver).
//
// Home/away orientation mirrors the PDF exactly: for the 1:00 PM matchups
// the higher seed is home (A1 v B2); for the 1:45 PM "rematch" slot the
// lower-pair seed is home (A2 v B1) — preserving the PDF's left/right
// column so refs printed next to each match line up.
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
    //
    // INTERLEAVED emission: we do TWO passes over the pool-pairs so all of
    // the "1:00 PM" matchups (one per pair) come out before any "1:45 PM"
    // matchups. Position indices land on courts via `position % 2` (see
    // canonicalBracketSchedule.courtFor), and positions <2 are the 1:00 PM
    // slot while positions ≥2 are the 1:45 PM slot — so interleaving here
    // is what makes Court 1 and Court 2 each run two QFs in sequence.
    const pairs = []
    for (let i = 0; i < N - 1; i += 2) pairs.push([pools[i], pools[i + 1]])

    // Pass 1 (1:00 PM slot): poolA top seed vs poolB second seed.
    for (const [poolA, poolB] of pairs) {
      const a1 = poolA.standings[seedIdx(poolA, 1)]
      const b2 = poolB.standings[seedIdx(poolB, 2)]
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
    }

    // Pass 2 (1:45 PM slot): poolA's 2nd seed vs poolB's top seed.
    // Home/away follows the PDF — poolA's lower seed is listed first, so
    // it lands as teamA (home) and poolB's top seed is teamB (away).
    for (const [poolA, poolB] of pairs) {
      const a2 = poolA.standings[seedIdx(poolA, 2)]
      const b1 = poolB.standings[seedIdx(poolB, 1)]
      if (a2?.teamId && b1?.teamId) {
        matches.push({
          slot: slot++,
          round: BRACKET_ROUND.QUARTERFINAL,
          teamAId: a2.teamId,
          teamBId: b1.teamId,
          teamASeedLabel: `${poolA.label}${seedRank(poolA, 2)}`,
          teamBSeedLabel: `${poolB.label}${seedRank(poolB, 1)}`,
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
