import prismaClient from '@/lib/prisma'
import { MATCH_STATUS } from './constants'
import { findNextOnSameCourt } from './canonicalBracketSchedule'

/**
 * When a bracket match finalizes:
 *   1. Write the winner into the next round's empty slot via nextMatchId.
 *   2. Assign the LOSER as ref of the next match scheduled on the same
 *      court (per the April 25 Captains Package rotation — loser of the
 *      1:00 PM match refs the 1:45 PM match on that court, and so on).
 *
 * Idempotent on both counts — skips slots that are already populated, so
 * calling this multiple times for the same match is safe.
 */
export async function advanceBracketWinner(bracketMatchId, prisma = prismaClient) {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: bracketMatchId },
    select: {
      id: true,
      winnerId: true,
      status: true,
      nextMatchId: true,
      bracketId: true,
      courtNumber: true,
      scheduledTime: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  })
  if (!match) return { advanced: false, reason: 'match not found' }
  if (match.status !== MATCH_STATUS.FINAL) return { advanced: false, reason: 'not final' }
  if (!match.winnerId) return { advanced: false, reason: 'no winner set' }

  // ── Ref rotation: loser of this match refs the next match on same court.
  // Computed independently of nextMatchId (SF/F still need a ref even
  // when no downstream match is wired for a given team).
  const loserId =
    match.homeTeamId && match.homeTeamId !== match.winnerId
      ? match.homeTeamId
      : match.awayTeamId && match.awayTeamId !== match.winnerId
        ? match.awayTeamId
        : null
  let refAssigned = false
  if (loserId) {
    const nextOnCourt = await findNextOnSameCourt(prisma, match)
    if (nextOnCourt && !nextOnCourt.refTeamId) {
      await prisma.tournamentMatch.update({
        where: { id: nextOnCourt.id },
        data: { refTeamId: loserId },
      })
      refAssigned = true
    }
  }

  // ── Winner advancement: write into downstream slot.
  if (!match.nextMatchId) {
    return { advanced: false, reason: 'no downstream match (final round)', refAssigned }
  }

  const next = await prisma.tournamentMatch.findUnique({
    where: { id: match.nextMatchId },
    include: {
      feederMatches: { select: { id: true, gameOrder: true, bracketPosition: true } },
    },
  })
  if (!next) return { advanced: false, reason: 'next match missing', refAssigned }

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
  if (!canOverwrite) return { advanced: false, reason: 'slot already filled', refAssigned }

  await prisma.tournamentMatch.update({ where: { id: next.id }, data })
  return { advanced: true, nextMatchId: next.id, refAssigned }
}
