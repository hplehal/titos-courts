import 'dotenv/config'
import prisma from '../lib/prisma.js'
const league = await prisma.league.findUnique({ where: { slug: 'sunday-mens' }, include: { seasons: { where: { status: { in: ['active','playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } } })
const season = league.seasons[0]
const w10 = await prisma.week.findFirst({ where: { seasonId: season.id, weekNumber: 10 } })
if (!w10) { console.log('No W10 for Sunday MENS'); process.exit(0) }
console.log(`W10 id=${w10.id} status=${w10.status} isPlayoff=${w10.isPlayoff}`)
const placements = await prisma.tierPlacement.findMany({ where: { weekId: w10.id }, include: { team: { select: { name: true } }, tier: { select: { tierNumber: true } } } })
const byTier = {}
for (const p of placements) { const tn = p.tier.tierNumber; (byTier[tn] = byTier[tn] || []).push(p) }
console.log('\nCurrent W10 placements (insertion order):')
for (const tn of Object.keys(byTier).sort((a,b)=>a-b)) {
  console.log(`Tier ${tn}:`)
  byTier[tn].forEach((p,i)=>console.log(`  [${i}] ${p.team.name} (finishPos=${p.finishPosition ?? 'null'})`))
}
const mc = await prisma.match.count({ where: { weekId: w10.id } })
console.log(`\nW10 matches: ${mc}`)
await prisma.$disconnect()
