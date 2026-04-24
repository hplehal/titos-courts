import prismaClient from '@/lib/prisma'
import { MATCH_STATUS } from './constants'

/**
 * Returns `true` when every pool match in the tournament is FINAL (completed).
 * Used to gate the admin "Generate Brackets" button.
 *
 * IMPORTANT: pool matches are 2 fixed sets (captain's package), so a 1-1
 * split is a valid FINAL result with winnerId = null — each team gets credit
 * for their set in pool standings but no overall match winner. Do NOT add a
 * `winnerId != null` check here; that rejects legitimate pool splits and
 * makes it impossible to generate brackets.
 *
 * Returns `false` if:
 *   - The tournament has no pools
 *   - Any pool has no matches
 *   - Any pool match is SCHEDULED or LIVE
 */
export async function canStartBrackets(tournamentId, prisma = prismaClient) {
  if (!tournamentId) return false
  const pools = await prisma.tournamentPool.findMany({
    where: { tournamentId },
    select: {
      id: true,
      matches: { select: { id: true, status: true } },
    },
  })
  if (!pools.length) return false

  for (const pool of pools) {
    if (!pool.matches.length) return false
    for (const m of pool.matches) {
      if (m.status !== MATCH_STATUS.FINAL) return false
    }
  }
  return true
}

/**
 * Detailed variant used by the admin UI to produce actionable error messages.
 * Returns { ok, reason, pending } — `pending` lists the match IDs + pool name
 * + status that are blocking bracket generation, so the admin sees exactly
 * which matches still need scores instead of a generic "not ready" string.
 */
export async function diagnoseBracketReadiness(tournamentId, prisma = prismaClient) {
  if (!tournamentId) return { ok: false, reason: 'No tournament id' }
  const pools = await prisma.tournamentPool.findMany({
    where: { tournamentId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      matches: {
        select: {
          id: true,
          status: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
    },
  })
  if (!pools.length) return { ok: false, reason: 'No pools generated yet' }

  const pending = []
  for (const pool of pools) {
    if (!pool.matches.length) {
      return { ok: false, reason: `Pool ${pool.name} has no matches. Generate the schedule first.` }
    }
    for (const m of pool.matches) {
      if (m.status !== MATCH_STATUS.FINAL) {
        pending.push({
          id: m.id,
          pool: pool.name,
          status: m.status,
          label: `${m.homeTeam?.name ?? '?'} vs ${m.awayTeam?.name ?? '?'}`,
        })
      }
    }
  }

  if (pending.length > 0) {
    return {
      ok: false,
      reason: `${pending.length} pool match${pending.length === 1 ? '' : 'es'} still pending`,
      pending,
    }
  }
  return { ok: true }
}
