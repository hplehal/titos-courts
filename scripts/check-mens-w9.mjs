import 'dotenv/config'
import prisma from '../lib/prisma.js'

const league = await prisma.league.findUnique({
  where: { slug: 'sunday-mens' },
  include: { seasons: { where: { status: { in: ['active', 'playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } },
})
const season = league.seasons[0]
const w9 = await prisma.week.findFirst({ where: { seasonId: season.id, weekNumber: 9 } })
if (!w9) { console.log('No W9'); process.exit(0) }
console.log(`W9 id=${w9.id} status=${w9.status}`)

const placements = await prisma.tierPlacement.findMany({
  where: { weekId: w9.id },
  include: { team: { select: { name: true } }, tier: { select: { tierNumber: true } } },
  // No orderBy — mirror the schedule query so we see the real insertion order.
})
const byTier = {}
for (const p of placements) {
  const tn = p.tier.tierNumber
  byTier[tn] = byTier[tn] || []
  byTier[tn].push(p)
}
console.log('\nPlacements (DB insertion order):')
for (const tn of Object.keys(byTier).sort((a,b)=>a-b)) {
  console.log(`Tier ${tn}:`)
  byTier[tn].forEach((p, i) => console.log(`  [${i}] ${p.team.name} (finishPos=${p.finishPosition ?? 'null'})`))
}

const matchCount = await prisma.match.count({ where: { weekId: w9.id } })
console.log(`\nW9 matches: ${matchCount}`)
await prisma.$disconnect()
