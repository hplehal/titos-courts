import 'dotenv/config'
import prisma from '../lib/prisma.js'

const league = await prisma.league.findUnique({
  where: { slug: 'sunday-mens' },
  include: { seasons: { where: { status: { in: ['active', 'playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } },
})
const season = league.seasons[0]
const w8 = await prisma.week.findFirst({ where: { seasonId: season.id, weekNumber: 8 } })

const placements = await prisma.tierPlacement.findMany({
  where: { weekId: w8.id },
  include: { team: { select: { name: true } }, tier: { select: { tierNumber: true } } },
  orderBy: [{ tier: { tierNumber: 'asc' } }, { finishPosition: 'asc' }],
})

let withFinish = 0
const byTier = {}
for (const p of placements) {
  const tn = p.tier.tierNumber
  byTier[tn] = byTier[tn] || []
  byTier[tn].push(p)
  if (p.finishPosition) withFinish++
}

console.log(`Week 8 placements: ${placements.length} (${withFinish} with finishPosition)\n`)
for (const tn of Object.keys(byTier).sort((a,b)=>a-b)) {
  console.log(`Tier ${tn}:`)
  for (const p of byTier[tn]) {
    console.log(`  pos=${p.finishPosition || '?'} mvmt=${p.movement || '?'} ${p.team.name}`)
  }
}
await prisma.$disconnect()
