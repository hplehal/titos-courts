// Generate the Sunday MENS Week 11 playoff bracket.
//
// Format: 2 divisions of 6 (Diamond ranks 1-6, Platinum ranks 7-12),
// single-elim with top-2 byes. QF / SF / Final all on the same night (W11).
//
// Per division (captain layout):
//   QF1: 3 v 6   ref = seed 2
//   QF2: 4 v 5   ref = seed 1
//   SF1: 1 v lower-ranked QF winner   (ref = same-court QF loser, set on score entry)
//   SF2: 2 v higher-ranked QF winner  (ref = same-court QF loser)
//   Final: W SF1 v W SF2
//
// Court layout:
//   Diamond  — QF1 C8, QF2 C6, SF1 C6, SF2 C8, Final C6
//   Platinum — QF1 C9, QF2 C10, SF1 C9, SF2 C10, Final C9
//
// Times: QF 9 PM, SF 10 PM, Final 11 PM (MENS night is 9 PM-12 AM).
//
// Replaces W11's regular-season matches with the 10 bracket shells and
// marks W11 isPlayoff=true. Idempotent: re-running wipes + rebuilds W11.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const REGULAR = 10
const PLAYOFF_ROUND = { QF: 1, SF: 2, FINAL: 3 }

// Court + ref layout per division (tierNumber 1=Diamond, 2=Platinum).
const LAYOUT = {
  1: { name: 'Diamond',  qf1Court: 8, qf2Court: 6, sf1Court: 6, sf2Court: 8, finalCourt: 6 },
  2: { name: 'Platinum', qf1Court: 9, qf2Court: 10, sf1Court: 9, sf2Court: 10, finalCourt: 9 },
}

async function computeStandings(seasonId) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      teams: true,
      weeks: {
        where: { weekNumber: { lte: REGULAR }, status: 'completed', isPlayoff: false },
        include: { matches: { where: { status: 'completed' }, include: { scores: true } } },
      },
    },
  })
  const stats = {}
  for (const t of season.teams) stats[t.id] = { id: t.id, name: t.name, setsWon: 0, pointDiff: 0, totalPoints: 0 }
  for (const week of season.weeks) {
    if (week.weekNumber === 1) continue
    const wts = {}
    for (const m of week.matches) {
      for (const s of m.scores) {
        const homeWon = s.homeScore > s.awayScore
        const diff = s.homeScore - s.awayScore
        wts[m.homeTeamId] = wts[m.homeTeamId] || { sets: 0, tierNumber: m.tierNumber }
        wts[m.awayTeamId] = wts[m.awayTeamId] || { sets: 0, tierNumber: m.tierNumber }
        if (homeWon) {
          wts[m.homeTeamId].sets++
          if (stats[m.homeTeamId]) { stats[m.homeTeamId].setsWon++; stats[m.homeTeamId].pointDiff += diff }
          if (stats[m.awayTeamId]) stats[m.awayTeamId].pointDiff -= diff
        } else {
          wts[m.awayTeamId].sets++
          if (stats[m.awayTeamId]) { stats[m.awayTeamId].setsWon++; stats[m.awayTeamId].pointDiff += Math.abs(diff) }
          if (stats[m.homeTeamId]) stats[m.homeTeamId].pointDiff -= Math.abs(diff)
        }
      }
    }
    const maxTier = Math.max(...Object.values(wts).map(d => d.tierNumber || 1), 1)
    for (const [tid, d] of Object.entries(wts)) {
      if (!stats[tid]) continue
      const tf = (maxTier - (d.tierNumber || 1)) + 1
      stats[tid].totalPoints += tf + d.sets
    }
  }
  return Object.values(stats)
    .sort((a, b) => (b.totalPoints - a.totalPoints) || (b.pointDiff - a.pointDiff))
    .map((t, i) => ({ ...t, rank: i + 1 }))
}

const league = await prisma.league.findUnique({
  where: { slug: 'sunday-mens' },
  include: { seasons: { where: { status: { in: ['active', 'playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } },
})
const seasonId = league.seasons[0].id
const w11 = await prisma.week.findFirst({ where: { seasonId, weekNumber: 11 } })
if (!w11) { console.error('No W11'); process.exit(1) }

const ranked = await computeStandings(seasonId)
// Diamond = ranks 1-6, Platinum = ranks 7-12. seeds[tier][seedNumber] = team.
const seeds = {
  1: ranked.slice(0, 6),
  2: ranked.slice(6, 12),
}

// 1. Wipe W11 regular matches + placements, mark playoff.
const old = await prisma.match.findMany({ where: { weekId: w11.id }, select: { id: true } })
const oldIds = old.map(m => m.id)
if (oldIds.length) {
  await prisma.setScore.deleteMany({ where: { matchId: { in: oldIds } } })
  await prisma.playerStat.deleteMany({ where: { matchId: { in: oldIds } } })
  // null nextMatchId first (self-FK) then delete
  await prisma.match.updateMany({ where: { id: { in: oldIds } }, data: { nextMatchId: null } })
  await prisma.match.deleteMany({ where: { weekId: w11.id } })
}
await prisma.tierPlacement.deleteMany({ where: { weekId: w11.id } })
await prisma.week.update({ where: { id: w11.id }, data: { isPlayoff: true } })
console.log(`Cleared ${oldIds.length} old W11 matches; W11 marked isPlayoff=true`)

const at = (h, m) => { const d = new Date(w11.date); d.setHours(h, m, 0, 0); return d }
const QF_TIME = at(21, 0), SF_TIME = at(22, 0), F_TIME = at(23, 0)

// 2. Build each division. Create Final first, then SFs → Final, then QFs → SFs.
for (const tier of [1, 2]) {
  const L = LAYOUT[tier]
  const s = seeds[tier]
  const [s1, s2, s3, s4, s5, s6] = s
  const mk = (data) => prisma.match.create({ data: {
    weekId: w11.id, tierNumber: tier, status: 'scheduled', ...data,
  } })

  const final = await mk({
    roundNumber: PLAYOFF_ROUND.FINAL, gameOrder: 1, courtNumber: L.finalCourt, scheduledTime: F_TIME,
    homeTeamId: null, awayTeamId: null, homeSeedLabel: 'W SF1', awaySeedLabel: 'W SF2',
  })
  // SF1: seed 1 (home) v lower-ranked QF winner (away). Court = sf1Court.
  const sf1 = await mk({
    roundNumber: PLAYOFF_ROUND.SF, gameOrder: 1, courtNumber: L.sf1Court, scheduledTime: SF_TIME,
    homeTeamId: s1.id, awayTeamId: null, homeSeedLabel: `${L.name} 1`, awaySeedLabel: 'Lower QF Winner',
    nextMatchId: final.id,
  })
  // SF2: seed 2 (home) v higher-ranked QF winner (away). Court = sf2Court.
  const sf2 = await mk({
    roundNumber: PLAYOFF_ROUND.SF, gameOrder: 2, courtNumber: L.sf2Court, scheduledTime: SF_TIME,
    homeTeamId: s2.id, awayTeamId: null, homeSeedLabel: `${L.name} 2`, awaySeedLabel: 'Higher QF Winner',
    nextMatchId: final.id,
  })
  // QF1: 3 v 6, ref = seed 2. Court = qf1Court. Feeds SF1 (reseed corrects).
  await mk({
    roundNumber: PLAYOFF_ROUND.QF, gameOrder: 1, courtNumber: L.qf1Court, scheduledTime: QF_TIME,
    homeTeamId: s3.id, awayTeamId: s6.id, refTeamId: s2.id,
    homeSeedLabel: `${L.name} 3`, awaySeedLabel: `${L.name} 6`, nextMatchId: sf1.id,
  })
  // QF2: 4 v 5, ref = seed 1. Court = qf2Court. Feeds SF2 (reseed corrects).
  await mk({
    roundNumber: PLAYOFF_ROUND.QF, gameOrder: 2, courtNumber: L.qf2Court, scheduledTime: QF_TIME,
    homeTeamId: s4.id, awayTeamId: s5.id, refTeamId: s1.id,
    homeSeedLabel: `${L.name} 4`, awaySeedLabel: `${L.name} 5`, nextMatchId: sf2.id,
  })

  console.log(`${L.name}: QF1 ${s3.name} v ${s6.name} (C${L.qf1Court}, ref ${s2.name}) | QF2 ${s4.name} v ${s5.name} (C${L.qf2Court}, ref ${s1.name})`)
  console.log(`         SF1 ${s1.name} v <lower> (C${L.sf1Court}) | SF2 ${s2.name} v <higher> (C${L.sf2Court}) | Final C${L.finalCourt}`)
}

console.log('\nDone. 10 bracket matches created (5 per division). Hard-refresh /schedule/sunday-mens.')
await prisma.$disconnect()
