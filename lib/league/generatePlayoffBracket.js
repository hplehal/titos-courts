// Builds the league playoff bracket draft from end-of-season standings and
// the season's division sizes. Pure function — easily testable, no Prisma.
//
// Format per division depends on its size:
//   6 teams — the league's reseeded format:
//     - Top 2 (seeds 1 & 2) get byes to the SF
//     - QFs: (3 v 6) and (4 v 5)
//     - SFs reseed: 1 v lowest-seed QF winner, 2 v highest-seed QF winner
//       (advancePlayoffWinner reseeds — the QFs carry no winner slot)
//     - Final: W SF1 v W SF2
//   2–5, 7 or 8 teams — a fixed single-elim bracket with byes for the top
//     seeds, e.g. 5 teams: QF 4 v 5 → SF1 1 v W QF1, SF2 2 v 3 → Final.
//
// The result is a DRAFT: admins adjust week, court, time, teams and winner
// wiring on /admin/playoffs afterwards.
//
// Defaults: QFs in week 10, SFs + Final in week 11. QF1/QF2 run back-to-back
// on the division court (10 PM / 11 PM); SFs tip at 10 PM (SF1 on the
// division court, SF2 court TBD); Final at 11 PM, court TBD.
//
// Each shell has a per-division `key` ('QF1', 'SF2', 'F1') and
// `next: { key, slot } | null`. The caller creates matches Final-first and
// resolves keys to nextMatchId, storing slot as Match.nextSlot.

export const PLAYOFF_ROUND = Object.freeze({ QF: 1, SF: 2, FINAL: 3 })
export const MAX_DIVISION_SIZE = 8

const ROUND_META = {
  [PLAYOFF_ROUND.QF]: { stage: 'qf', short: 'QF', weekKey: 10 },
  [PLAYOFF_ROUND.SF]: { stage: 'sf', short: 'SF', weekKey: 11 },
  [PLAYOFF_ROUND.FINAL]: { stage: 'final', short: 'F', weekKey: 11 },
}

/**
 * Partition end-of-season standings into playoff divisions, top of the table
 * down, using each division's team count.
 * @param {Array<{teamId:string, name:string, rank:number}>} standings
 * @param {Array<{position:number, name:string, teamCount:number, courtNumber:number|null}>} divisions
 *   From resolveDivisions() in lib/league/seasonConfig.js.
 * @returns {Array<{ position:number, name:string, court:number|null, teams: Array<{seed:number, teamId:string, name:string}> }>}
 */
export function partitionIntoDivisions(standings, divisions) {
  const ranked = [...standings].sort((a, b) => a.rank - b.rank)
  let offset = 0
  return divisions.map(d => {
    const teams = ranked
      .slice(offset, offset + d.teamCount)
      .map((t, i) => ({ seed: i + 1, teamId: t.teamId, name: t.name }))
    offset += d.teamCount
    return { position: d.position, name: d.name, court: d.courtNumber ?? null, teams }
  })
}

function slotDefaults(roundNumber, gameOrder, court) {
  if (roundNumber === PLAYOFF_ROUND.QF) {
    return { courtNumber: gameOrder <= 2 ? court : null, startTime: gameOrder % 2 === 1 ? '22:00' : '23:00' }
  }
  if (roundNumber === PLAYOFF_ROUND.SF) {
    return { courtNumber: gameOrder === 1 ? court : null, startTime: '22:00' }
  }
  return { courtNumber: null, startTime: '23:00' }
}

function shell(division, roundNumber, gameOrder, home, away) {
  const meta = ROUND_META[roundNumber]
  return {
    key: `${meta.short}${gameOrder}`,
    stage: meta.stage,
    weekKey: meta.weekKey,
    tierNumber: division.position,
    roundNumber,
    gameOrder,
    ...slotDefaults(roundNumber, gameOrder, division.court),
    homeTeamId: home.teamId ?? null, homeSeedLabel: home.label,
    awayTeamId: away.teamId ?? null, awaySeedLabel: away.label,
    next: null,
  }
}

function seedEntry(division, seed) {
  return { teamId: division.teams[seed - 1].teamId, label: `${division.name} ${seed}` }
}

function buildReseededSix(division) {
  const s = seed => seedEntry(division, seed)
  const qf1 = shell(division, PLAYOFF_ROUND.QF, 1, s(3), s(6))
  const qf2 = shell(division, PLAYOFF_ROUND.QF, 2, s(4), s(5))
  const sf1 = shell(division, PLAYOFF_ROUND.SF, 1, s(1), { label: 'Lower QF Winner' })
  const sf2 = shell(division, PLAYOFF_ROUND.SF, 2, s(2), { label: 'Higher QF Winner' })
  const final = shell(division, PLAYOFF_ROUND.FINAL, 1, { label: 'W SF1' }, { label: 'W SF2' })
  qf1.next = { key: sf1.key, slot: null }
  qf2.next = { key: sf2.key, slot: null }
  sf1.next = { key: final.key, slot: 'home' }
  sf2.next = { key: final.key, slot: 'away' }
  return [qf1, qf2, sf1, sf2, final]
}

// Standard bracket seed order (1 v 8, 4 v 5, 2 v 7, 3 v 6) so top seeds meet
// as late as possible.
function seedOrder(size) {
  let order = [1]
  while (order.length < size) {
    const n = order.length * 2
    order = order.flatMap(seed => [seed, n + 1 - seed])
  }
  return order
}

function buildSingleElim(division) {
  const n = division.teams.length
  let size = 2
  while (size < n) size *= 2
  const rounds = Math.log2(size)
  const shells = []
  // Entrants into the current round: a seeded team, the winner of an earlier
  // shell ({ from }), or null for an empty bye slot.
  let entrants = seedOrder(size).map(seed => (seed <= n ? seedEntry(division, seed) : null))
  for (let r = 0; r < rounds; r++) {
    const roundNumber = PLAYOFF_ROUND.FINAL - (rounds - 1 - r)
    const advancing = []
    let gameOrder = 0
    for (let i = 0; i < entrants.length; i += 2) {
      const a = entrants[i]
      const b = entrants[i + 1]
      if (!a || !b) { advancing.push(a || b); continue } // bye
      const m = shell(division, roundNumber, ++gameOrder, a, b)
      if (a.from) a.from.next = { key: m.key, slot: 'home' }
      if (b.from) b.from.next = { key: m.key, slot: 'away' }
      shells.push(m)
      advancing.push({ from: m, label: `W ${m.key}` })
    }
    entrants = advancing
  }
  return shells
}

/** Match shells for one division (see the format notes at the top). */
export function buildDivisionBracket(division) {
  const n = division.teams.length
  if (n < 2) return []
  if (n > MAX_DIVISION_SIZE) {
    throw new Error(`${division.name} has ${n} teams — playoff drafts support up to ${MAX_DIVISION_SIZE} per division.`)
  }
  return n === 6 ? buildReseededSix(division) : buildSingleElim(division)
}

/** Full draft across every division, each shell tagged with divisionName. */
export function buildPlayoffPlan(standings, divisions) {
  return partitionIntoDivisions(standings, divisions).flatMap(d =>
    buildDivisionBracket(d).map(m => ({ ...m, divisionName: d.name })),
  )
}
