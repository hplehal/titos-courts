import 'dotenv/config'
import prisma from '../lib/prisma.js'

const SLUG = 'titos-rec-tournament-may-2026'
const t = await prisma.tournament.findUnique({ where: { slug: SLUG } })
if (!t) { console.error('tournament not found'); process.exit(1) }

const matches = await prisma.tournamentMatch.findMany({
  where: {
    OR: [
      { pool: { tournamentId: t.id } },
      { bracket: { tournamentId: t.id } },
    ],
  },
  select: { id: true },
})
const ids = matches.map(m => m.id)

const deletedScores = await prisma.tournamentSetScore.deleteMany({ where: { matchId: { in: ids } } })
const resetCount = await prisma.tournamentMatch.updateMany({
  where: { id: { in: ids } },
  data: { status: 'scheduled', winnerId: null },
})
console.log(`Cleared ${deletedScores.count} set scores`)
console.log(`Reset ${resetCount.count} matches to scheduled`)
await prisma.$disconnect()
