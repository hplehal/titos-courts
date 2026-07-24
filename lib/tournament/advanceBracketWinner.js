import prismaClient from '@/lib/prisma'
import { MATCH_STATUS, BRACKET_ROUND } from './constants'
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
      bracketRound: true,
      bracketPosition: true,
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
  // Skip the ref rotation entirely for tournaments run without team refs.
  let refsEnabled = true
  if (match.bracketId) {
    const b = await prisma.tournamentBracket.findUnique({
      where: { id: match.bracketId },
      select: { tournament: { select: { hasRefs: true } } },
    })
    refsEnabled = b?.tournament?.hasRefs !== false
  }
  if (loserId && refsEnabled) {
    const nextOnCourt = await findNextOnSameCourt(prisma, match)
    if (nextOnCourt && !nextOnCourt.refTeamId) {
      await prisma.tournamentMatch.update({
        where: { id: nextOnCourt.id },
        data: { refTeamId: loserId },
      })
      refAssigned = true
    }
  }

  // ── 3rd-place routing: if this was a semifinal and the bracket has a
  // 3rd-place shell (FINAL round, bracketPosition 1 — created by the
  // ranked-split format), the loser drops into it. SF1's loser takes the
  // home slot, SF2's the away slot. No-op for formats without the shell,
  // and idempotent (never overwrites a filled slot).
  if (loserId && match.bracketId && match.bracketRound === BRACKET_ROUND.SEMIFINAL) {
    const third = await prisma.tournamentMatch.findFirst({
      where: {
        bracketId: match.bracketId,
        bracketRound: BRACKET_ROUND.FINAL,
        bracketPosition: 1,
      },
      select: { id: true, homeTeamId: true, awayTeamId: true },
    })
    if (third) {
      const slotData = match.bracketPosition === 0
        ? (third.homeTeamId ? null : { homeTeamId: loserId })
        : (third.awayTeamId ? null : { awayTeamId: loserId })
      if (slotData) {
        await prisma.tournamentMatch.update({ where: { id: third.id }, data: slotData })
      }
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
  // the other fills team B. This works perfectly when BOTH slots come
  // from feeders (e.g. SF feeding F). For the crossover format where
  // QF1 already has its team A pre-filled (A1, the pool winner) and
  // only team B is a play-in feeder, we fall back to "whichever slot
  // is empty" so the play-in winner lands in the right place rather
  // than trying to overwrite the pool winner.
  const feeders = [...(next.feederMatches || [])]
    .filter(f => f && typeof f.bracketPosition === 'number')
    .sort((a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0))
  const conventionIsA = feeders.length && feeders[0]?.id === bracketMatchId

  // Prefer the convention; if that slot's already filled, use the
  // empty one. If both are filled, this is a retry — bail.
  let isA
  if (conventionIsA && !next.homeTeamId) isA = true
  else if (!conventionIsA && !next.awayTeamId) isA = false
  else if (!next.homeTeamId) isA = true
  else if (!next.awayTeamId) isA = false
  else return { advanced: false, reason: 'slot already filled', refAssigned }

  const data = isA
    ? { homeTeamId: match.winnerId }
    : { awayTeamId: match.winnerId }

  await prisma.tournamentMatch.update({ where: { id: next.id }, data })
  return { advanced: true, nextMatchId: next.id, refAssigned }
}
