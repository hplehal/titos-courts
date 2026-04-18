import prismaClient from '@/lib/prisma'
import { MATCH_STATUS } from './constants'

/**
 * When a bracket match finalizes, write its winner into the next round's
 * empty slot via the nextMatchId chain.
 *
 * Idempotent — safe to call multiple times for the same match; it only
 * writes if the slot is empty. If both feeder matches are complete, both
 * slots get populated.
 */
export async function advanceBracketWinner(bracketMatchId, prisma = prismaClient) {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: bracketMatchId },
    select: { id: true, winnerId: true, status: true, nextMatchId: true },
  })
  if (!match) return { advanced: false, reason: 'match not found' }
  if (match.status !== MATCH_STATUS.FINAL) return { advanced: false, reason: 'not final' }
  if (!match.winnerId) return { advanced: false, reason: 'no winner set' }
  if (!match.nextMatchId) return { advanced: false, reason: 'no downstream match (final round)' }

  const next = await prisma.tournamentMatch.findUnique({
    where: { id: match.nextMatchId },
    include: {
      feederMatches: { select: { id: true, gameOrder: true, bracketPosition: true } },
    },
  })
  if (!next) return { advanced: false, reason: 'next match missing' }

  // Determine which slot (homeTeamId or awayTeamId) this winner fills.
  // Convention: the feeder with the LOWER bracket slot fills team A,
  // the other fills team B.
  const feeders = [...(next.feederMatches || [])]
    .filter(f => f && typeof f.bracketPosition === 'number')
    .sort((a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0))
  const isA = feeders.length && feeders[0]?.id === bracketMatchId

  const data = isA
    ? { homeTeamId: match.winnerId }
    : { awayTeamId: match.winnerId }
  // Only write if the slot is empty — avoids overwriting on retries
  const canOverwrite = isA ? !next.homeTeamId : !next.awayTeamId
  if (!canOverwrite) return { advanced: false, reason: 'slot already filled' }

  await prisma.tournamentMatch.update({ where: { id: next.id }, data })
  return { advanced: true, nextMatchId: next.id }
}
