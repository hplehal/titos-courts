import prismaClient from '@/lib/prisma'
import { MATCH_STATUS } from './constants'

/**
 * Returns `true` when every pool match in the tournament is FINAL (completed)
 * with a winner set. Used to gate the admin "Generate Brackets" button.
 *
 * Returns `false` if:
 *   - The tournament has no pools
 *   - Any pool has no matches
 *   - Any pool match is SCHEDULED or LIVE
 *   - Any FINAL match lacks a winnerId (data-integrity guard)
 */
export async function canStartBrackets(tournamentId, prisma = prismaClient) {
  if (!tournamentId) return false
  const pools = await prisma.tournamentPool.findMany({
    where: { tournamentId },
    select: {
      id: true,
      matches: { select: { id: true, status: true, winnerId: true } },
    },
  })
  if (!pools.length) return false

  for (const pool of pools) {
    if (!pool.matches.length) return false
    for (const m of pool.matches) {
      if (m.status !== MATCH_STATUS.FINAL) return false
      if (!m.winnerId) return false
    }
  }
  return true
}
