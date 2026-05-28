import 'dotenv/config'
import prisma from '../lib/prisma.js'
const seasons = await prisma.season.findMany({
  where: { league: { slug: 'tuesday-coed' } },
  include: { weeks: { where: { weekNumber: { in: [10, 11] } } } },
})
for (const s of seasons) {
  console.log(`Season ${s.seasonNumber} (${s.name}) status=${s.status}`)
  for (const w of s.weeks) console.log(`  W${w.weekNumber} isPlayoff=${w.isPlayoff}`)
}
await prisma.$disconnect()
