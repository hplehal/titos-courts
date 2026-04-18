import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { computeMatchStatus } from '@/lib/tournament/computeMatchStatus'

export const dynamic = 'force-dynamic'

/**
 * PATCH — upsert set scores for a pool match, then auto-transition status
 * (SCHEDULED → LIVE → FINAL) via computeMatchStatus. Only accepts numeric
 * scores; clients should send 0 rather than blank for an un-played set.
 *
 * Body: { scores: [{ setNumber, homeScore, awayScore }, ...] }
 */
export async function PATCH(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug, matchId } = await params
  try {
    const body = await request.json()
    const incoming = Array.isArray(body.scores) ? body.scores : []

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, homeTeamId: true, awayTeamId: true, poolId: true },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    // Upsert each set in a transaction so state stays consistent.
    await prisma.$transaction(async (tx) => {
      for (const s of incoming) {
        const setNumber = Number(s.setNumber)
        const homeScore = Number(s.homeScore)
        const awayScore = Number(s.awayScore)
        if (!Number.isFinite(setNumber) || setNumber < 1) continue
        if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue
        await tx.tournamentSetScore.upsert({
          where: { matchId_setNumber: { matchId, setNumber } },
          update: { homeScore, awayScore },
          create: { matchId, setNumber, homeScore, awayScore },
        })
      }
    })

    // Re-derive status/winner from the authoritative saved scores.
    const scores = await prisma.tournamentSetScore.findMany({
      where: { matchId }, orderBy: { setNumber: 'asc' },
    })
    // Pool matches are 2 fixed sets (captain's package). Fall back to bracket
    // mode for any match lacking a poolId (shouldn't happen for this route).
    const mode = match.poolId ? 'pool' : 'bracket'
    const { status, winnerId } = computeMatchStatus(scores, match, { mode })

    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status, winnerId: winnerId ?? null },
    })

    revalidateTournament(slug)
    return NextResponse.json({ status, winnerId })
  } catch (error) {
    console.error('Save match scores error:', error)
    return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 })
  }
}
