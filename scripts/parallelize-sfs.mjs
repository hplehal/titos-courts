// Bring already-generated Tuesday COED playoff matches in line with the
// updated W11 plan: SF1 + SF2 run in PARALLEL on two different courts
// (both tip at 10:00 PM), Final stays at 11 PM, both SF2 + Final court
// numbers reset to NULL ("TBD" until admin assigns the extra W11 court).
//
// Idempotent.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const league = await prisma.league.findUnique({
  where: { slug: 'tuesday-coed' },
  include: {
    seasons: {
      where: { status: { in: ['active', 'playoffs'] } },
      orderBy: { seasonNumber: 'desc' },
      take: 1,
      include: { weeks: { where: { weekNumber: 11 } } },
    },
  },
})
const w11 = league?.seasons?.[0]?.weeks?.[0]
if (!w11) { console.error('No W11 found'); process.exit(1) }

const at = (h, m) => {
  const d = new Date(w11.date)
  d.setHours(h, m, 0, 0)
  return d
}

// SF2 (gameOrder=2, roundNumber=2): court → null, time → 10:00 PM
const sf2Updates = await prisma.match.updateMany({
  where: { weekId: w11.id, roundNumber: 2, gameOrder: 2 },
  data: { courtNumber: null, scheduledTime: at(22, 0) },
})

// Final (roundNumber=3): court → null
const finalUpdates = await prisma.match.updateMany({
  where: { weekId: w11.id, roundNumber: 3 },
  data: { courtNumber: null },
})

console.log(`SF2 matches updated: ${sf2Updates.count}`)
console.log(`Final matches updated: ${finalUpdates.count}`)
await prisma.$disconnect()
