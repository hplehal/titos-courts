// Compute Sunday MENS end-of-regular-season standings (W1-W10, playoff
// weeks excluded) using the same formula as the league standings, and
// print the Diamond (1-6) + Platinum (7-12) playoff seeds. Read-only.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const REGULAR = 10

const league = await prisma.league.findUnique({
  where: { slug: 'sunday-mens' },
  include: { seasons: { where: { status: { in: ['active','playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } },
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

console.log('MENS end-of-regular-season standings:\n')
console.log('  DIAMOND (seeds 1-6):')
ranked.slice(0, 6).forEach((t, i) => console.log(`    ${i + 1}. ${t.name.padEnd(22)} pts=${t.totalPoints} SW=${t.setsWon} +/-${t.pointDiff}`))
console.log('\n  PLATINUM (seeds 1-6):')
ranked.slice(6, 12).forEach((t, i) => console.log(`    ${i + 1}. ${t.name.padEnd(22)} pts=${t.totalPoints} SW=${t.setsWon} +/-${t.pointDiff}`))

await prisma.$disconnect()
