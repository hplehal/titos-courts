import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { generateRoundRobin } from '@/lib/tournament/generateRoundRobin'
import { MATCH_STATUS, ROUND_INTERVAL_MINUTES } from '@/lib/tournament/constants'

export const dynamic = 'force-dynamic'

/**
 * POST — generate round-robin schedules for every pool that has teams but no
 * matches yet. Stamps scheduledTime + courtNumber per the captain's package:
 *
 *   Pool index = court number (Pool A → Court 1, Pool B → Court 2, ...)
 *   Round 1 fires at tournament.date; each subsequent round is 30 minutes later.
 *
 * All pools play in parallel (same round → same time slot, different courts).
 * Idempotent per-pool: skips pools that already have matches.
 */
export async function POST(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        pools: {
          orderBy: { name: 'asc' },
          include: {
            // Order by the team's seed (set at pool-draw time) so seed-1 is
            // first in the list — canonical round-robin depends on this.
            teams: { select: { id: true, name: true, seed: true }, orderBy: [{ seed: 'asc' }, { name: 'asc' }] },
            matches: { select: { id: true } },
          },
        },
      },
    })
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    if (!t.pools.length) {
      return NextResponse.json({ error: 'Generate pools first' }, { status: 400 })
    }

    // Self-heal: re-stamp seeds 1..N per pool before scheduling. If an admin
    // manually reassigned teams using an older build (or any code path forgot
    // to re-seed), this guarantees the canonical round-robin pairings and the
    // PDF ref rotation line up with who's actually in the pool.
    await prisma.$transaction(async (tx) => {
      for (const pool of t.pools) {
        if (pool.matches.length > 0) continue // pool already scheduled — don't touch
        const sorted = pool.teams.slice().sort((a, b) => {
          const sa = a.seed ?? Number.POSITIVE_INFINITY
          const sb = b.seed ?? Number.POSITIVE_INFINITY
          if (sa !== sb) return sa - sb
          return a.name.localeCompare(b.name)
        })
        for (let i = 0; i < sorted.length; i++) {
          const expected = i + 1
          if (sorted[i].seed === expected) continue
          await tx.tournamentTeam.update({
            where: { id: sorted[i].id },
            data: { seed: expected },
          })
          sorted[i].seed = expected
        }
        pool.teams = sorted
      }
    })

    const kickoff = t.date ? new Date(t.date) : null
    // Convenience: compute the scheduled time for a given round number.
    const slotFor = (roundNumber) => {
      if (!kickoff) return null
      const d = new Date(kickoff)
      d.setMinutes(d.getMinutes() + (roundNumber - 1) * ROUND_INTERVAL_MINUTES)
      return d
    }

    // Flatten all match creates into a single createMany. Much faster than
    // one round-trip per match when you've got 6 matches × 4 pools = 24 rows.
    const rows = []
    for (const [poolIdx, pool] of t.pools.entries()) {
      if (pool.matches.length > 0) continue // skip — already scheduled
      if (pool.teams.length < 2) continue   // need at least 2 teams

      const rr = generateRoundRobin(pool.teams)
      for (const m of rr) {
        rows.push({
          poolId: pool.id,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          roundNumber: m.roundNumber,
          gameOrder: m.gameOrder,
          courtNumber: poolIdx + 1,
          scheduledTime: slotFor(m.roundNumber),
          status: MATCH_STATUS.SCHEDULED,
        })
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ created: 0 })
    }

    const result = await prisma.tournamentMatch.createMany({ data: rows })
    revalidateTournament(slug)
    return NextResponse.json({ created: result.count }, { status: 201 })
  } catch (error) {
    console.error('Generate schedule error:', error)
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
  }
}

/**
 * DELETE — wipe all pool-stage matches (only if none have scores entered).
 * Keeps brackets intact. Useful for redrawing pools.
 */
export async function DELETE(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

    const matches = await prisma.tournamentMatch.findMany({
      where: { pool: { tournamentId: t.id } },
      select: { id: true, scores: { select: { id: true } } },
    })
    const hasScores = matches.some(m => m.scores.length > 0)
    if (hasScores) {
      return NextResponse.json(
        { error: 'Cannot clear — some matches have scores entered.' },
        { status: 409 },
      )
    }
    const ids = matches.map(m => m.id)
    if (ids.length) {
      await prisma.tournamentSetScore.deleteMany({ where: { matchId: { in: ids } } })
      await prisma.tournamentMatch.deleteMany({ where: { id: { in: ids } } })
    }
    revalidateTournament(slug)
    return NextResponse.json({ cleared: ids.length })
  } catch (error) {
    console.error('Clear schedule error:', error)
    return NextResponse.json({ error: 'Failed to clear schedule' }, { status: 500 })
  }
}
