import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { computeMatchStatus } from '@/lib/tournament/computeMatchStatus'
import { advanceBracketWinner } from '@/lib/tournament/advanceBracketWinner'
import { MATCH_STATUS } from '@/lib/tournament/constants'

export const dynamic = 'force-dynamic'

/**
 * PATCH — upsert set scores for a bracket match, auto-transition status via
 * computeMatchStatus, then (if FINAL) advance the winner into the next match
 * slot via advanceBracketWinner.
 */
export async function PATCH(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug, matchId } = await params
  try {
    const body = await request.json()
    const incoming = Array.isArray(body.scores) ? body.scores : []

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, homeTeamId: true, awayTeamId: true, bracketId: true },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    if (!match.bracketId) {
      return NextResponse.json({ error: 'Not a bracket match' }, { status: 400 })
    }

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

    const scores = await prisma.tournamentSetScore.findMany({
      where: { matchId }, orderBy: { setNumber: 'asc' },
    })
    const { status, winnerId } = computeMatchStatus(scores, match)

    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status, winnerId: winnerId ?? null },
    })

    let advanceResult = null
    if (status === MATCH_STATUS.FINAL && winnerId) {
      advanceResult = await advanceBracketWinner(matchId, prisma)
    }

    revalidateTournament(slug)
    return NextResponse.json({ status, winnerId, advance: advanceResult })
  } catch (error) {
    console.error('Save bracket match scores error:', error)
    return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 })
  }
}
