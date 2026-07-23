// Updates the active Tuesday COED season's structure:
//   - totalWeeks: 11 (9 regular + 2 playoff)
//   - playoffWeeks: 2 (Week 10 + Week 11)
//   - Flags weeks 10 & 11 with isPlayoff=true
// Idempotent — re-running is safe.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const SLUG = 'tuesday-coed'
const REGULAR_SEASON_WEEKS = 9
const PLAYOFF_WEEKS = 2

const league = await prisma.league.findUnique({
  where: { slug: SLUG },
  include: {
    seasons: {
      where: { status: { in: ['active', 'playoffs'] } },
      orderBy: { seasonNumber: 'desc' },
      take: 1,
      include: { weeks: { orderBy: { weekNumber: 'asc' } } },
    },
  },
})
const season = league?.seasons?.[0]
if (!season) { console.error('No active Tuesday COED season'); process.exit(1) }
console.log(`Season: ${season.name} (${season.id})`)

await prisma.season.update({
  where: { id: season.id },
  data: {
    totalWeeks: REGULAR_SEASON_WEEKS + PLAYOFF_WEEKS,
    playoffWeeks: PLAYOFF_WEEKS,
  },
})
console.log(`  totalWeeks → ${REGULAR_SEASON_WEEKS + PLAYOFF_WEEKS}, playoffWeeks → ${PLAYOFF_WEEKS}`)

for (const w of season.weeks) {
  const shouldBePlayoff = w.weekNumber > REGULAR_SEASON_WEEKS
  if (w.isPlayoff !== shouldBePlayoff) {
    await prisma.week.update({
      where: { id: w.id },
      data: { isPlayoff: shouldBePlayoff },
    })
    console.log(`  Week ${w.weekNumber} → isPlayoff = ${shouldBePlayoff}`)
  }
}
console.log('Done.')
await prisma.$disconnect()
