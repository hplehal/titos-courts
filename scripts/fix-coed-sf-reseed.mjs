// Re-apply the correct QF→SF reseed for every Tuesday COED playoff division.
//
// Rule (per division): of the two QF winners, the BETTER seed (smaller #)
// faces the 2 seed (SF2); the WORSE seed faces the 1 seed (SF1). The #1
// overall seed must get the weakest team that advanced.
//
// The live bracket had this inverted in all 4 divisions (SF1 got the
// better winner, SF2 got the worse) because the runtime reseed fell
// through to naive QF1→SF1 / QF2→SF2 wiring. This recomputes both SF
// away slots from scratch. Idempotent.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const seedFromLabel = (label) => {
  const m = (label || '').match(/(\d+)\s*$/)
  return m ? Number(m[1]) : Infinity
}

const league = await prisma.league.findUnique({
  where: { slug: 'tuesday-coed' },
  include: { seasons: { where: { status: { in: ['active', 'playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } },
})
const seasonId = league.seasons[0].id
const w10 = await prisma.week.findFirst({ where: { seasonId, weekNumber: 10 } })
const w11 = await prisma.week.findFirst({ where: { seasonId, weekNumber: 11 } })

const DIV = { 1: 'Diamond', 2: 'Platinum', 3: 'Gold', 4: 'Silver' }

for (const tier of [1, 2, 3, 4]) {
  const qfs = await prisma.match.findMany({
    where: { weekId: w10.id, tierNumber: tier, roundNumber: 1 },
    orderBy: { gameOrder: 'asc' },
  })
  if (qfs.length !== 2 || qfs.some(q => q.status !== 'completed' || !q.winnerId)) {
    console.log(`${DIV[tier]}: QFs not both final — skipping`)
    continue
  }
  // Seed of each winner.
  const winnerSeed = (q) => seedFromLabel(q.winnerId === q.homeTeamId ? q.homeSeedLabel : q.awaySeedLabel)
  const [a, b] = qfs
  const aSeed = winnerSeed(a)
  const bSeed = winnerSeed(b)
  const betterWinnerId = aSeed < bSeed ? a.winnerId : b.winnerId
  const worseWinnerId  = aSeed < bSeed ? b.winnerId : a.winnerId

  const sfs = await prisma.match.findMany({
    where: { weekId: w11.id, tierNumber: tier, roundNumber: 2 },
    orderBy: { gameOrder: 'asc' },
  })
  if (sfs.length !== 2) { console.log(`${DIV[tier]}: expected 2 SFs, found ${sfs.length} — skipping`); continue }
  const [sf1, sf2] = sfs

  // SF1 (faces seed 1) gets the WORSE winner; SF2 (faces seed 2) gets the BETTER winner.
  await prisma.match.update({ where: { id: sf1.id }, data: { awayTeamId: worseWinnerId } })
  await prisma.match.update({ where: { id: sf2.id }, data: { awayTeamId: betterWinnerId } })

  const nameOf = async (id) => (await prisma.team.findUnique({ where: { id }, select: { name: true } }))?.name
  console.log(`${DIV[tier]}: SF1 away → ${await nameOf(worseWinnerId)} (worse), SF2 away → ${await nameOf(betterWinnerId)} (better)`)
}

console.log('\nDone. Hard-refresh /schedule/tuesday-coed or /playoffs/tuesday-coed.')
await prisma.$disconnect()
