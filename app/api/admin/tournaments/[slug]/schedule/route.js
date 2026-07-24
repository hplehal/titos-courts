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
    // Round spacing: ranked-split (beach) plays 40-minute games + 5-minute
    // changeover = 45-minute slots; other formats keep the classic 30.
    const intervalMinutes = t.bracketFormat === 'ranked-split' ? 45 : ROUND_INTERVAL_MINUTES
    // Convenience: compute the scheduled time for a given round number.
    const slotFor = (roundNumber) => {
      if (!kickoff) return null
      const d = new Date(kickoff)
      d.setMinutes(d.getMinutes() + (roundNumber - 1) * intervalMinutes)
      return d
    }

    // Flatten all match creates into a single createMany. Much faster than
    // one round-trip per match when you've got 6 matches × 4 pools = 24 rows.
    const rows = []

    // ── Canonical beach grid (ranked-split, 3 pools of 4, ≥4 courts) ──
    // Matches the printed plan exactly: pools interleave across all four
    // courts so pool play wraps in 5 rounds instead of 6 sequential ones.
    //   R1  A:1v4,2v3 (C1,C2)   B:1v4,2v3 (C3,C4)
    //   R2  C:1v4,2v3 (C1,C2)   B:1v3,2v4 (C3,C4)
    //   R3  C:1v3,2v4 (C1,C2)   A:1v3,2v4 (C3,C4)
    //   R4  A:1v2,3v4 (C1,C2)   B:1v2,3v4 (C3,C4)
    //   R5  C:1v2,3v4 (C1,C2)   — courts 3+4 free
    const isBeachGrid =
      t.bracketFormat === 'ranked-split' &&
      t.pools.length === 3 &&
      (t.courtCount ?? 4) >= 4 &&
      t.pools.every(pl => pl.teams.length === 4) &&
      t.pools.every(pl => pl.matches.length === 0)

    if (isBeachGrid) {
      const PAIRS = [
        [[0, 3], [1, 2]], // 1v4, 2v3
        [[0, 2], [1, 3]], // 1v3, 2v4
        [[0, 1], [2, 3]], // 1v2, 3v4
      ]
      const GRID = [
        { round: 1, blocks: [{ pool: 0, set: 0, courts: [1, 2] }, { pool: 1, set: 0, courts: [3, 4] }] },
        { round: 2, blocks: [{ pool: 2, set: 0, courts: [1, 2] }, { pool: 1, set: 1, courts: [3, 4] }] },
        { round: 3, blocks: [{ pool: 2, set: 1, courts: [1, 2] }, { pool: 0, set: 1, courts: [3, 4] }] },
        { round: 4, blocks: [{ pool: 0, set: 2, courts: [1, 2] }, { pool: 1, set: 2, courts: [3, 4] }] },
        { round: 5, blocks: [{ pool: 2, set: 2, courts: [1, 2] }] },
      ]
      for (const { round, blocks } of GRID) {
        for (const b of blocks) {
          const pool = t.pools[b.pool]
          PAIRS[b.set].forEach(([hi, ai], slotIdx) => {
            rows.push({
              poolId: pool.id,
              homeTeamId: pool.teams[hi].id,
              awayTeamId: pool.teams[ai].id,
              roundNumber: round,
              gameOrder: b.courts[slotIdx],
              courtNumber: b.courts[slotIdx],
              scheduledTime: slotFor(round),
              status: MATCH_STATUS.SCHEDULED,
            })
          })
        }
      }
    }

    for (const [poolIdx, pool] of (isBeachGrid ? [] : t.pools).entries()) {
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
