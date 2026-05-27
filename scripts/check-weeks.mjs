import 'dotenv/config'
import prisma from '../lib/prisma.js'
const weeks = await prisma.week.findMany({
  where: { season: { league: { slug: 'tuesday-coed' } } },
  select: { weekNumber: true, status: true, isPlayoff: true },
  orderBy: { weekNumber: 'asc' },
})
for (const w of weeks) console.log(`W${w.weekNumber} status=${w.status} isPlayoff=${w.isPlayoff}`)
await prisma.$disconnect()
