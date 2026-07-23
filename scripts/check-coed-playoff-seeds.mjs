// Recompute Tuesday COED end-of-W9 standings (playoff weeks excluded, same
// logic as the admin playoff-seeding) and print what the Diamond division
// bracket SHOULD look like, vs what's currently persisted.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const REGULAR = 9

const league = await prisma.league.findUnique({
  where: { slug: 'tuesday-coed' },
  include: { seasons: { where: { status: { in: ['active', 'playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } },
})
const seasonId = league.seasons[0].id

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

const teamStats = {}
for (const t of season.teams) teamStats[t.id] = { id: t.id, name: t.name, setsWon: 0, pointDiff: 0, totalPoints: 0 }

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
        if (teamStats[m.homeTeamId]) { teamStats[m.homeTeamId].setsWon++; teamStats[m.homeTeamId].pointDiff += diff }
        if (teamStats[m.awayTeamId]) teamStats[m.awayTeamId].pointDiff -= diff
      } else {
        wts[m.awayTeamId].sets++
        if (teamStats[m.awayTeamId]) { teamStats[m.awayTeamId].setsWon++; teamStats[m.awayTeamId].pointDiff += Math.abs(diff) }
        if (teamStats[m.homeTeamId]) teamStats[m.homeTeamId].pointDiff -= Math.abs(diff)
      }
    }
  }
  const maxTier = Math.max(...Object.values(wts).map(d => d.tierNumber || 1), 1)
  for (const [tid, d] of Object.entries(wts)) {
    if (!teamStats[tid]) continue
    const tf = (maxTier - (d.tierNumber || 1)) + 1
    teamStats[tid].totalPoints += tf + d.sets
  }
}

const ranked = Object.values(teamStats)
  .sort((a, b) => (b.totalPoints - a.totalPoints) || (b.pointDiff - a.pointDiff))
  .map((t, i) => ({ ...t, rank: i + 1 }))

console.log('CORRECTED end-of-W9 standings (top 6 = Diamond):')
for (const t of ranked.slice(0, 6)) {
  console.log(`  #${t.rank} ${t.name.padEnd(22)} pts=${t.totalPoints} SW=${t.setsWon} +/-${t.pointDiff}`)
}

const d = ranked.slice(0, 6)
console.log('\nDiamond bracket SHOULD be:')
console.log(`  QF1: ${d[2].name} (3) vs ${d[5].name} (6)`)
console.log(`  QF2: ${d[3].name} (4) vs ${d[4].name} (5)`)
console.log(`  SF1: ${d[0].name} (1) vs Lower-seed QF winner`)
console.log(`  SF2: ${d[1].name} (2) vs Higher-seed QF winner`)

// Current persisted Diamond bracket (tierNumber 1)
const w10 = await prisma.week.findFirst({ where: { seasonId, weekNumber: 10 } })
const w11 = await prisma.week.findFirst({ where: { seasonId, weekNumber: 11 } })
const bracket = await prisma.match.findMany({
  where: { weekId: { in: [w10?.id, w11?.id].filter(Boolean) }, tierNumber: 1 },
  include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
  orderBy: [{ roundNumber: 'asc' }, { gameOrder: 'asc' }],
})
console.log('\nCurrently PERSISTED Diamond bracket:')
for (const m of bracket) {
  const r = { 1: 'QF', 2: 'SF', 3: 'F' }[m.roundNumber]
  console.log(`  ${r}${m.gameOrder}: ${m.homeTeam?.name || m.homeSeedLabel} vs ${m.awayTeam?.name || m.awaySeedLabel}`)
}

await prisma.$disconnect()
