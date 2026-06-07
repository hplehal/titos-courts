// Dump the current state of Sunday MENS Week 8 matches + set scores.
// Helps diagnose whether Week 9 deletion accidentally cascaded into
// Week 8 (it shouldn't — matches FK weekId is per-week) or whether the
// scores are simply orphaned somehow.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const league = await prisma.league.findUnique({
  where: { slug: 'sunday-mens' },
  include: {
    seasons: {
      where: { status: { in: ['active', 'playoffs'] } },
      orderBy: { seasonNumber: 'desc' },
      take: 1,
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          select: { id: true, weekNumber: true, status: true, isPlayoff: true },
        },
      },
    },
  },
})

const season = league?.seasons?.[0]
if (!season) { console.log('No active season'); process.exit(1) }
console.log(`Season: ${season.name} (${season.id})`)
console.log('Weeks:')
for (const w of season.weeks) {
  console.log(`  W${w.weekNumber} status=${w.status} isPlayoff=${w.isPlayoff} (${w.id})`)
}

const w8 = season.weeks.find(w => w.weekNumber === 8)
if (!w8) { console.log('\nWeek 8 does not exist'); process.exit(0) }

const matches = await prisma.match.findMany({
  where: { weekId: w8.id },
  include: {
    homeTeam: { select: { name: true } },
    awayTeam: { select: { name: true } },
    scores: { orderBy: { setNumber: 'asc' } },
  },
  orderBy: [{ tierNumber: 'asc' }, { gameOrder: 'asc' }],
})

console.log(`\nWeek 8: ${matches.length} matches`)
let withScores = 0
for (const m of matches) {
  const scoreStr = m.scores.length
    ? m.scores.map(s => `${s.homeScore}-${s.awayScore}`).join(', ')
    : '(no scores)'
  if (m.scores.length) withScores++
  console.log(`  T${m.tierNumber}-${m.gameOrder} ${m.homeTeam?.name} vs ${m.awayTeam?.name} | ${m.status} | ${scoreStr}`)
}
console.log(`\nTotal: ${matches.length} matches, ${withScores} with scores`)

await prisma.$disconnect()
