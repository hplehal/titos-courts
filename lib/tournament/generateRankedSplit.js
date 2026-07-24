// Ranked-split bracket format (July 25 Beach Tournament plan).
//
// Works for any pool count where pools have (at least) 4 teams — designed
// for 3 pools of 4. Division membership is by POOL FINISH per the plan:
// top 2 finishers of each pool → Gold, bottom 2 → Silver (6 teams each
// with 3 pools).
//
// Seeding within a division ranks by pool finish first (all pool winners
// ahead of all runners-up), then by the same currency pool standings use:
// set wins, then point differential, then name for stability.
//
//   Gold: seeds #1–#2 (best two pool winners) get a BYE to the semifinals.
//         Seeds #3–#6 play quarterfinals: QF1 = #3 v #6, QF2 = #4 v #5.
//   SF1 = #1 v Winner(QF2), SF2 = #2 v Winner(QF1)  — per the plan sheet.
//   Final = W(SF1) v W(SF2); 3rd place = L(SF1) v L(SF2).
//   Silver mirrors the same shape.
//
// This module is pure (no DB) — the admin brackets route materialises the
// matches. Court/time layout (also per the plan sheet, 4 courts):
//   Gold  → Courts 1–2, Silver → Courts 3–4
//   QFs at T0, SFs at T0+interval, Final/3rd at T0+2×interval.

import { DIVISION_GOLD } from './constants'

/**
 * Rank one division's 6 seeds from per-pool standings.
 *
 * @param {Array<{ label:string, standings:Array<{teamId:string,name:string,sw:number,diff:number}> }>} pools
 * @param {'Gold'|'Silver'} division
 * @returns {Array<{ teamId:string, name:string, seedLabel:string, poolLabel:string, poolPos:number }>}
 *   Ordered best (#1) to worst (#6). seedLabel like "#3 (B1)".
 */
export function rankRankedSplitDivision(pools, division) {
  const isGold = division === DIVISION_GOLD
  const rows = []
  for (const pool of pools) {
    const n = pool.standings.length
    // Gold takes finish positions 0,1 — Silver takes n-2, n-1
    const idxs = isGold ? [0, 1] : [n - 2, n - 1]
    for (const [rank, idx] of idxs.entries()) {
      const s = pool.standings[idx]
      if (!s) continue
      rows.push({
        teamId: s.teamId,
        name: s.name,
        poolLabel: pool.label,
        // 1 = pool winner tier, 2 = runner-up tier (within this division)
        divisionPos: rank + 1,
        poolPos: idx + 1,
        sw: s.sw ?? 0,
        diff: s.diff ?? 0,
      })
    }
  }

  rows.sort((a, b) =>
    a.divisionPos - b.divisionPos ||
    b.sw - a.sw ||
    b.diff - a.diff ||
    a.name.localeCompare(b.name)
  )

  return rows.map((r, i) => ({
    teamId: r.teamId,
    name: r.name,
    seedLabel: `#${i + 1} (${r.poolLabel}${r.poolPos})`,
    poolLabel: r.poolLabel,
    poolPos: r.poolPos,
  }))
}

/** Minutes between bracket rounds for this format (50-min playoff rounds). */
export const RANKED_SPLIT_ROUND_MINUTES = 50

/**
 * Default bracket start offset from the tournament kickoff, in minutes.
 * Mirrors the plan sheet: 9:00 kickoff → 5×40-min pool rounds → lunch →
 * seeding → first playoff serve at 1:05 PM (245 minutes later). Admins can
 * adjust individual match times afterward via the bracket match editor.
 */
export const RANKED_SPLIT_START_OFFSET_MINUTES = 245
