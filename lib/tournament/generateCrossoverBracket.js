// Crossover single-elimination bracket generator for 2-pool tournaments.
//
// Used by the May 23 REC Tournament format and any future tournament
// that uses two pools of 5 (or more) with top-3-from-each-pool + 1
// play-in winner from each pool feeding an 8-team single-elim bracket.
//
// Seeding pattern (from the captain's package):
//   QF1: A1 v Winner-PI2          (Pool A's top vs Pool B's 4-5 winner)
//   QF2: B1 v Winner-PI1          (Pool B's top vs Pool A's 4-5 winner)
//   QF3: B2 v A3                  (cross-pool: B's 2nd seed vs A's 3rd seed)
//   QF4: A2 v B3                  (cross-pool: A's 2nd seed vs B's 3rd seed)
//
//   SF1: W QF1 v W QF3
//   SF2: W QF2 v W QF4
//   F:   W SF1 v W SF2
//
// Court assignments follow the PDF (QF1+QF3+SF1 → Court 1, QF2+QF4+SF2 →
// Court 2, Final on Court 1). Times are passed in by the caller.

import { BRACKET_ROUND } from './constants'

/**
 * Generate the two play-in matches (4 vs 5 in each pool).
 *
 * @param {Array<{ label:string, standings: Array<{teamId:string, name:string}> }>} pools
 *   Pools ordered by label (Pool A first). Each pool's standings array
 *   must be sorted best-to-worst (index 0 = 1st place).
 * @returns {Array<{
 *   slot:number, teamAId:string, teamBId:string,
 *   teamASeedLabel:string, teamBSeedLabel:string, poolLabel:string
 * }>}
 */
export function generatePlayInMatches(pools) {
  const matches = []
  for (const pool of pools) {
    if (!pool.standings || pool.standings.length < 5) continue
    const fourth = pool.standings[3]
    const fifth = pool.standings[4]
    if (!fourth?.teamId || !fifth?.teamId) continue
    matches.push({
      slot: matches.length + 1,
      poolLabel: pool.label,
      teamAId: fourth.teamId,
      teamBId: fifth.teamId,
      teamASeedLabel: `${pool.label}4`,
      teamBSeedLabel: `${pool.label}5`,
    })
  }
  return matches
}

/**
 * Generate the 8-team crossover single-elim bracket from 2 pools.
 * Play-in winners must be provided (or omitted to leave the slots blank
 * until pool play wraps up).
 *
 * @param {Array<{ label:string, standings: Array<{teamId:string, name:string}> }>} pools
 * @param {{ playIn1WinnerId?:string|null, playIn2WinnerId?:string|null }} [opts]
 *   playIn1WinnerId = winner of Pool A's 4-vs-5 match (fills the QF2 slot)
 *   playIn2WinnerId = winner of Pool B's 4-vs-5 match (fills the QF1 slot)
 * @returns {{
 *   quarters: Array<{ slot:number, round:1, teamAId:string|null, teamBId:string|null,
 *                     teamASeedLabel:string, teamBSeedLabel:string, courtNumber:number }>,
 *   semis:    Array<{ slot:number, round:2, teamAId:null, teamBId:null,
 *                     teamASeedLabel:string, teamBSeedLabel:string, courtNumber:number,
 *                     _feedQfSlots:[number,number] }>,
 *   final:    { slot:1, round:3, teamAId:null, teamBId:null,
 *               teamASeedLabel:string, teamBSeedLabel:string, courtNumber:number,
 *               _feedSfSlots:[number,number] }
 * }}
 */
export function generateCrossoverBracket(pools, opts = {}) {
  if (!pools || pools.length < 2) {
    return { quarters: [], semis: [], final: null }
  }
  const [poolA, poolB] = pools
  const a1 = poolA.standings?.[0]
  const a2 = poolA.standings?.[1]
  const a3 = poolA.standings?.[2]
  const b1 = poolB.standings?.[0]
  const b2 = poolB.standings?.[1]
  const b3 = poolB.standings?.[2]
  const { playIn1WinnerId = null, playIn2WinnerId = null } = opts

  const quarters = [
    {
      slot: 1,
      round: BRACKET_ROUND.QUARTERFINAL,
      teamAId: a1?.teamId || null,
      teamBId: playIn2WinnerId,
      teamASeedLabel: `${poolA.label}1`,
      teamBSeedLabel: 'W PI 2',
      courtNumber: 1,
    },
    {
      slot: 2,
      round: BRACKET_ROUND.QUARTERFINAL,
      teamAId: b1?.teamId || null,
      teamBId: playIn1WinnerId,
      teamASeedLabel: `${poolB.label}1`,
      teamBSeedLabel: 'W PI 1',
      courtNumber: 2,
    },
    {
      slot: 3,
      round: BRACKET_ROUND.QUARTERFINAL,
      teamAId: b2?.teamId || null,
      teamBId: a3?.teamId || null,
      teamASeedLabel: `${poolB.label}2`,
      teamBSeedLabel: `${poolA.label}3`,
      courtNumber: 1,
    },
    {
      slot: 4,
      round: BRACKET_ROUND.QUARTERFINAL,
      teamAId: a2?.teamId || null,
      teamBId: b3?.teamId || null,
      teamASeedLabel: `${poolA.label}2`,
      teamBSeedLabel: `${poolB.label}3`,
      courtNumber: 2,
    },
  ]

  const semis = [
    {
      slot: 1,
      round: BRACKET_ROUND.SEMIFINAL,
      teamAId: null,
      teamBId: null,
      teamASeedLabel: 'W QF1',
      teamBSeedLabel: 'W QF3',
      courtNumber: 1,
      _feedQfSlots: [1, 3],
    },
    {
      slot: 2,
      round: BRACKET_ROUND.SEMIFINAL,
      teamAId: null,
      teamBId: null,
      teamASeedLabel: 'W QF2',
      teamBSeedLabel: 'W QF4',
      courtNumber: 2,
      _feedQfSlots: [2, 4],
    },
  ]

  const final = {
    slot: 1,
    round: BRACKET_ROUND.FINAL,
    teamAId: null,
    teamBId: null,
    teamASeedLabel: 'W SF1',
    teamBSeedLabel: 'W SF2',
    courtNumber: 1,
    _feedSfSlots: [1, 2],
  }

  return { quarters, semis, final }
}
