import 'dotenv/config'
import prisma from '../lib/prisma.js'

const league = await prisma.league.findUnique({
  where: { slug: 'sunday-mens' },
  include: {
    seasons: {
      where: { status: { in: ['active', 'playoffs'] } },
      orderBy: { seasonNumber: 'desc' }, take: 1,
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: { matches: { select: { status: true, scores: { select: { id: true } } } } },
        },
      },
    },
  },
})
const season = league.seasons[0]
console.log(`Season: ${season.name}  totalWeeks=${season.totalWeeks} playoffWeeks=${season.playoffWeeks}`)
for (const w of season.weeks) {
  const withScores = w.matches.filter(m => m.scores.length > 0).length
  console.log(`  W${String(w.weekNumber).padStart(2)} status=${w.status.padEnd(9)} isPlayoff=${w.isPlayoff} | ${w.matches.length} matches, ${withScores} scored`)
}
await prisma.$disconnect()
