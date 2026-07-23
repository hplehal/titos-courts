// Assign the previously-TBD Week 11 courts for Tuesday COED now that the
// extra bookings are confirmed.
//
// W11 layout per division (10:00 PM SFs in parallel, 11:00 PM Final):
//   SF1 → division's primary court (unchanged: 6 / 8 / 9 / 10)
//   SF2 → an extra court           (2 / 3 / 4 / 7)
//   Final → back on the primary court (free again by 11 PM)
//
// Extra courts available: 2, 3, 4, 7.
// Idempotent — re-running just sets the same courts again.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

// tier → { sf2Court, finalCourt }
const COURTS = {
  1: { name: 'Diamond',  primary: 6,  sf2: 2 },
  2: { name: 'Platinum', primary: 8,  sf2: 3 },
  3: { name: 'Gold',     primary: 9,  sf2: 4 },
  4: { name: 'Silver',   primary: 10, sf2: 7 },
}

const league = await prisma.league.findUnique({
  where: { slug: 'tuesday-coed' },
  include: { seasons: { where: { status: { in: ['active', 'playoffs'] } }, orderBy: { seasonNumber: 'desc' }, take: 1 } },
})
const seasonId = league.seasons[0].id
const w11 = await prisma.week.findFirst({ where: { seasonId, weekNumber: 11 } })
if (!w11) { console.error('No W11'); process.exit(1) }

for (const [tier, c] of Object.entries(COURTS)) {
  const t = Number(tier)
  // SF2 (roundNumber 2, gameOrder 2) → extra court
  const sf2 = await prisma.match.updateMany({
    where: { weekId: w11.id, tierNumber: t, roundNumber: 2, gameOrder: 2 },
    data: { courtNumber: c.sf2 },
  })
  // Final (roundNumber 3) → primary court
  const fin = await prisma.match.updateMany({
    where: { weekId: w11.id, tierNumber: t, roundNumber: 3 },
    data: { courtNumber: c.primary },
  })
  console.log(`${c.name}: SF1 → C${c.primary}, SF2 → C${c.sf2}, Final → C${c.primary}  (sf2:${sf2.count} final:${fin.count})`)
}

console.log('\nDone. Hard-refresh /schedule/tuesday-coed or /playoffs/tuesday-coed.')
await prisma.$disconnect()
