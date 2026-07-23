import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { MATCH_STATUS } from '@/lib/tournament/constants'

export const dynamic = 'force-dynamic'

/**
 * POST — wipe all pool-stage scores so the tournament can be re-played from
 * scratch for testing. Unlike DELETE /schedule, this keeps match pairings,
 * court assignments, seeds, and scheduledTime intact — just resets each match
 * back to `scheduled`, nulls out the winner, and deletes every set score row.
 *
 * Refuses if brackets exist. Bracket seeding is derived from pool standings,
 * so mass-resetting pool scores while brackets are live would leave the
 * bracket stale. Delete brackets first via the existing admin button, then
 * run this, then replay scores.
 *
 * Safe to run multiple times. Idempotent.
 */
export async function POST(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      select: {
        id: true,
        brackets: { select: { id: true } },
      },
    })
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

    if (t.brackets.length > 0) {
      return NextResponse.json(
        { error: 'Delete brackets before resetting pool scores — bracket seeding is derived from pool standings.' },
        { status: 409 },
      )
    }

    // Find every pool match for this tournament. We only touch pool matches
    // (match.poolId is set) — bracket matches live under match.bracketId and
    // should not be reset here.
    const matches = await prisma.tournamentMatch.findMany({
      where: { pool: { tournamentId: t.id } },
      select: { id: true },
    })
    const ids = matches.map(m => m.id)

    if (ids.length === 0) {
      return NextResponse.json({ reset: 0, scoresDeleted: 0 })
    }

    // One transaction: drop all set scores, then flip every match back to
    // scheduled with no winner. Both writes succeed or both roll back.
    const [deleted, updated] = await prisma.$transaction([
      prisma.tournamentSetScore.deleteMany({ where: { matchId: { in: ids } } }),
      prisma.tournamentMatch.updateMany({
        where: { id: { in: ids } },
        data: { status: MATCH_STATUS.SCHEDULED, winnerId: null },
      }),
    ])

    revalidateTournament(slug)
    return NextResponse.json({
      reset: updated.count,
      scoresDeleted: deleted.count,
    })
  } catch (error) {
    console.error('Reset pool scores error:', error)
    return NextResponse.json({ error: 'Failed to reset scores' }, { status: 500 })
  }
}
