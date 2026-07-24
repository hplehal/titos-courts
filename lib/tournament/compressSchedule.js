// Dynamic schedule compression: when every match in the current round is
// FINAL ahead of schedule, pull all remaining rounds earlier so the next
// round starts ~10 minutes from now (5-min changeover + buffer) instead of
// waiting for the printed slot. Relative spacing between later rounds is
// preserved. Only ever moves times EARLIER — running late never pushes the
// printed schedule back automatically.
//
// Pool and bracket matches are treated as one timeline: pool roundNumbers
// first, then bracket rounds (QF/SF/F), matching how the day actually runs.

import prismaClient from '@/lib/prisma'
import { MATCH_STATUS } from './constants'

const NEXT_ROUND_LEAD_MS = 10 * 60_000

export async function compressTournamentSchedule(tournamentId, prisma = prismaClient) {
  const matches = await prisma.tournamentMatch.findMany({
    where: {
      OR: [
        { pool: { tournamentId } },
        { bracket: { tournamentId } },
      ],
      scheduledTime: { not: null },
    },
    select: {
      id: true, status: true, scheduledTime: true,
      roundNumber: true, bracketRound: true, poolId: true,
    },
  })
  if (!matches.length) return { shifted: 0 }

  // Order key: pool rounds (1..N) then bracket rounds offset above them.
  const maxPoolRound = Math.max(0, ...matches.filter(m => m.poolId).map(m => m.roundNumber ?? 0))
  const key = (m) => m.poolId ? (m.roundNumber ?? 0) : maxPoolRound + (m.bracketRound ?? 0)

  // Earliest round with any unfinished match = the round to pull forward.
  const unfinished = matches.filter(m => m.status !== MATCH_STATUS.FINAL)
  if (!unfinished.length) return { shifted: 0 }
  const nextKey = Math.min(...unfinished.map(key))

  // Every round BEFORE nextKey must be fully final (they are, by definition
  // of nextKey being the minimum unfinished round).
  const nextRoundTimes = unfinished.filter(m => key(m) === nextKey).map(m => new Date(m.scheduledTime).getTime())
  const nextStart = Math.min(...nextRoundTimes)
  const target = Date.now() + NEXT_ROUND_LEAD_MS
  const delta = nextStart - target
  // Only compress meaningfully (>5 min early) and never push later.
  if (delta <= 5 * 60_000) return { shifted: 0 }

  const toShift = matches.filter(m => key(m) >= nextKey && m.status !== MATCH_STATUS.FINAL)
  await prisma.$transaction(
    toShift.map(m => prisma.tournamentMatch.update({
      where: { id: m.id },
      data: { scheduledTime: new Date(new Date(m.scheduledTime).getTime() - delta) },
    }))
  )
  return { shifted: toShift.length, minutesEarlier: Math.round(delta / 60_000) }
}
