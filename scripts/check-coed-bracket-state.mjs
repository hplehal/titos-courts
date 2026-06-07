import 'dotenv/config'
import prisma from '../lib/prisma.js'

const league = await prisma.league.findUnique({
  where: { slug: 'tuesday-coed' },
  include: { seasons: { where: { status: { in: ['active', 'playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } },
})
const seasonId = league.seasons[0].id
const w10 = await prisma.week.findFirst({ where: { seasonId, weekNumber: 10 } })
const w11 = await prisma.week.findFirst({ where: { seasonId, weekNumber: 11 } })

const DIV = { 1: 'Diamond', 2: 'Platinum', 3: 'Gold', 4: 'Silver' }

for (const tier of [1, 2, 3, 4]) {
  console.log(`\n=== ${DIV[tier]} (tier ${tier}) ===`)
  const qfs = await prisma.match.findMany({
    where: { weekId: w10.id, tierNumber: tier, roundNumber: 1 },
    include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } }, winnerTeam: { select: { name: true } } },
    orderBy: { gameOrder: 'asc' },
  })
  for (const q of qfs) {
    console.log(`  QF${q.gameOrder}: ${q.homeSeedLabel}(${q.homeTeam?.name}) vs ${q.awaySeedLabel}(${q.awayTeam?.name}) | ${q.status} | winner=${q.winnerTeam?.name || '—'}`)
  }
  const sfs = await prisma.match.findMany({
    where: { weekId: w11.id, tierNumber: tier, roundNumber: 2 },
    include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    orderBy: { gameOrder: 'asc' },
  })
  for (const s of sfs) {
    console.log(`  SF${s.gameOrder}: ${s.homeSeedLabel}(${s.homeTeam?.name || '—'}) vs ${s.awaySeedLabel}(${s.awayTeam?.name || 'EMPTY'})`)
  }
}
await prisma.$disconnect()
