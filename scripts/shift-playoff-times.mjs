// One-shot: shift the already-generated Tuesday COED playoff match times
// from the 8 PM start window to the 10 PM start window (matches the
// league's actual game hours, 10 PM-12 AM).
//
// W10: QF1 10:00 PM, QF2 11:00 PM
// W11: SF1 10:00 PM, SF2 10:30 PM, Final 11:00 PM
//
// Idempotent — re-running just sets the same times again.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const league = await prisma.league.findUnique({
  where: { slug: 'tuesday-coed' },
  include: {
    seasons: {
      where: { status: { in: ['active', 'playoffs'] } },
      orderBy: { seasonNumber: 'desc' },
      take: 1,
      include: {
        weeks: { where: { weekNumber: { in: [10, 11] } } },
      },
    },
  },
})
const season = league?.seasons?.[0]
if (!season) { console.error('No active Tuesday COED season'); process.exit(1) }
const w10 = season.weeks.find(w => w.weekNumber === 10)
const w11 = season.weeks.find(w => w.weekNumber === 11)
if (!w10 || !w11) { console.error('W10 or W11 missing'); process.exit(1) }

const at = (weekDate, h, m) => {
  const d = new Date(weekDate)
  d.setHours(h, m, 0, 0)
  return d
}

let updated = 0
const playoffMatches = await prisma.match.findMany({
  where: { weekId: { in: [w10.id, w11.id] } },
})
for (const m of playoffMatches) {
  let newTime
  if (m.weekId === w10.id) {
    // QF1 → 10 PM, QF2 → 11 PM
    newTime = at(w10.date, 22 + (m.gameOrder === 2 ? 1 : 0), 0)
  } else {
    // W11: Final at 11 PM; SF1 at 10:00 PM; SF2 at 10:30 PM
    if (m.roundNumber === 3) newTime = at(w11.date, 23, 0)
    else newTime = at(w11.date, 22, m.gameOrder === 2 ? 30 : 0)
  }
  await prisma.match.update({
    where: { id: m.id },
    data: { scheduledTime: newTime },
  })
  updated++
}

console.log(`Updated ${updated} playoff matches to the 10 PM-12 AM window.`)
await prisma.$disconnect()
