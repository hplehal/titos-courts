// Generates the Tuesday COED playoff bracket structure from the
// regular-season standings. Pure function — easily testable, no Prisma.
//
// Format (per division, 6 teams):
//   - Top 2 (ranks 1 & 2) get byes to the SF
//   - Week 10 QFs: (3 v 6) and (4 v 5)
//   - Week 11 SFs reseed: 1 v lowest-seed-W10-winner, 2 v highest-seed-W10-winner
//   - Week 11 Final: W SF1 v W SF2 (11 PM-12 AM)
//
// Divisions (24-team COED, ranked by end-of-W9 standings):
//   Diamond  1-6  → Court 6
//   Platinum 7-12 → Court 8
//   Gold     13-18 → Court 9
//   Silver   19-24 → Court 10
//
// Output is an array of match shells with court + scheduledTime + seed
// labels. Caller (the admin API) persists them in dependency order
// (Finals first, then SFs pointing at Finals, then QFs pointing at SFs)
// so the nextMatchId chain resolves cleanly without forward-FK pain.

export const PLAYOFF_DIVISIONS = [
  { name: 'Diamond',  startRank: 1,  court: 6 },
  { name: 'Platinum', startRank: 7,  court: 8 },
  { name: 'Gold',     startRank: 13, court: 9 },
  { name: 'Silver',   startRank: 19, court: 10 },
]

export const PLAYOFF_ROUND = Object.freeze({ QF: 1, SF: 2, FINAL: 3 })

/**
 * Partition end-of-season standings into the 4 playoff divisions.
 * @param {Array<{teamId:string, name:string, rank:number}>} standings
 *   Sorted from rank 1 (best) to rank N (worst). Must contain at least 24
 *   teams (or we skip empty division slots — bracket is malformed but
 *   doesn't crash).
 * @returns {Array<{ name:string, court:number, teams: Array<{seed:number, teamId:string, name:string}> }>}
 */
export function partitionIntoDivisions(standings) {
  const divisions = []
  for (const def of PLAYOFF_DIVISIONS) {
    const teams = []
    for (let i = 0; i < 6; i++) {
      const rank = def.startRank + i
      const t = standings.find(s => s.rank === rank)
      if (!t) break
      teams.push({ seed: i + 1, teamId: t.teamId, name: t.name })
    }
    divisions.push({ name: def.name, court: def.court, teams })
  }
  return divisions
}

/**
 * Build the bracket plan for a single division. Returns the 5 match
 * shells (QF1, QF2, SF1, SF2, Final) with seed labels + court + game
 * order. Pure data — no scheduledTime yet (caller composes that from
 * a `kickoffByWeek` map).
 *
 * Seeds within division (1 = best, 6 = worst):
 *   QF1: 3 v 6  (gameOrder 1)
 *   QF2: 4 v 5  (gameOrder 2)
 *   SF1: 1 v "Lower-seed QF Winner"  (gameOrder 1)
 *   SF2: 2 v "Higher-seed QF Winner" (gameOrder 2)
 *   Final: W SF1 v W SF2             (gameOrder 1)
 */
export function buildDivisionBracket(division, divisionIndex) {
  if (division.teams.length < 6) return []

  const [s1, s2, s3, s4, s5, s6] = division.teams
  const tier = divisionIndex + 1  // 1..4 for Diamond..Silver

  return [
    // ── Week 10 QFs (same court, sequential)
    {
      stage: 'qf',
      weekKey: 10,
      tierNumber: tier,
      roundNumber: PLAYOFF_ROUND.QF,
      gameOrder: 1,
      courtNumber: division.court,
      homeTeamId: s3.teamId, homeSeedLabel: `${division.name} 3`,
      awayTeamId: s6.teamId, awaySeedLabel: `${division.name} 6`,
    },
    {
      stage: 'qf',
      weekKey: 10,
      tierNumber: tier,
      roundNumber: PLAYOFF_ROUND.QF,
      gameOrder: 2,
      courtNumber: division.court,
      homeTeamId: s4.teamId, homeSeedLabel: `${division.name} 4`,
      awayTeamId: s5.teamId, awaySeedLabel: `${division.name} 5`,
    },
    // ── Week 11 SFs (reseed: 1 plays the lower-seed QF winner,
    //   2 plays the higher-seed QF winner). Team slots filled by
    //   advanceLeaguePlayoffWinner when the QFs go FINAL.
    {
      stage: 'sf',
      weekKey: 11,
      tierNumber: tier,
      roundNumber: PLAYOFF_ROUND.SF,
      gameOrder: 1,
      courtNumber: division.court,  // default; admin can move when W11 courts are booked
      homeTeamId: s1.teamId, homeSeedLabel: `${division.name} 1`,
      awayTeamId: null,      awaySeedLabel: 'Lower QF Winner',
    },
    {
      stage: 'sf',
      weekKey: 11,
      tierNumber: tier,
      roundNumber: PLAYOFF_ROUND.SF,
      gameOrder: 2,
      courtNumber: division.court,
      homeTeamId: s2.teamId, homeSeedLabel: `${division.name} 2`,
      awayTeamId: null,      awaySeedLabel: 'Higher QF Winner',
    },
    // ── Week 11 Final (11 PM-12 AM)
    {
      stage: 'final',
      weekKey: 11,
      tierNumber: tier,
      roundNumber: PLAYOFF_ROUND.FINAL,
      gameOrder: 1,
      courtNumber: division.court,  // default; admin can move
      homeTeamId: null, homeSeedLabel: 'W SF1',
      awayTeamId: null, awaySeedLabel: 'W SF2',
    },
  ]
}

/**
 * Full plan across all 4 divisions. 20 match shells total
 * (4 divisions × 5 = 20). Caller adds weekId + scheduledTime + persists
 * with nextMatchId chain via persistPlayoffBracket().
 */
export function buildPlayoffPlan(standings) {
  const divisions = partitionIntoDivisions(standings)
  const all = []
  divisions.forEach((d, i) => {
    for (const m of buildDivisionBracket(d, i)) {
      all.push({ ...m, divisionName: d.name })
    }
  })
  return all
}
