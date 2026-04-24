import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { computeMatchStatus } from '@/lib/tournament/computeMatchStatus'
import { advanceBracketWinner } from '@/lib/tournament/advanceBracketWinner'
import { findNextOnSameCourt } from '@/lib/tournament/canonicalBracketSchedule'
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

/**
 * DELETE — wipe all set scores for a bracket match and reset it to
 * SCHEDULED. Best-effort "undo" of the downstream effects too:
 *
 *   • If this match had a winner that advanced into next.homeTeamId or
 *     next.awayTeamId, null that slot out (only if downstream hasn't
 *     started scoring — we don't want to destroy a later match's state).
 *   • If this match's loser had been stamped as ref on the next match on
 *     the same court, clear that ref so it doesn't stick around stale.
 *
 * Used by the admin "Clear scores" button to genuinely remove a match
 * result (not just set everything to 0–0, which would still count).
 */
export async function DELETE(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug, matchId } = await params
  try {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        winnerId: true,
        homeTeamId: true,
        awayTeamId: true,
        nextMatchId: true,
        bracketId: true,
        courtNumber: true,
        scheduledTime: true,
      },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    if (!match.bracketId) {
      return NextResponse.json({ error: 'Not a bracket match' }, { status: 400 })
    }

    const loserId = match.winnerId
      ? (match.winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId)
      : null

    await prisma.$transaction(async (tx) => {
      // 1) Delete the set scores.
      await tx.tournamentSetScore.deleteMany({ where: { matchId } })

      // 2) Reset the match status + winner.
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: MATCH_STATUS.SCHEDULED, winnerId: null },
      })

      // 3) Un-advance winner into downstream slot, if safe.
      if (match.nextMatchId && match.winnerId) {
        const next = await tx.tournamentMatch.findUnique({
          where: { id: match.nextMatchId },
          select: {
            id: true,
            homeTeamId: true,
            awayTeamId: true,
            scores: { select: { id: true } },
          },
        })
        // Only safe if the downstream match has NOT yet had scores entered —
        // otherwise we'd rip a team out from under an in-progress result.
        if (next && next.scores.length === 0) {
          const patch = {}
          if (next.homeTeamId === match.winnerId) patch.homeTeamId = null
          if (next.awayTeamId === match.winnerId) patch.awayTeamId = null
          if (Object.keys(patch).length > 0) {
            await tx.tournamentMatch.update({ where: { id: next.id }, data: patch })
          }
        }
      }

      // 4) Un-ref: if our loser was auto-assigned as ref on the next match
      //    on this court, clear that ref so the admin can reassign.
      if (loserId) {
        const nextOnCourt = await findNextOnSameCourt(tx, match)
        if (nextOnCourt && nextOnCourt.refTeamId === loserId) {
          await tx.tournamentMatch.update({
            where: { id: nextOnCourt.id },
            data: { refTeamId: null },
          })
        }
      }
    })

    revalidateTournament(slug)
    return NextResponse.json({ cleared: true })
  } catch (error) {
    console.error('Clear bracket match scores error:', error)
    return NextResponse.json({ error: 'Failed to clear scores' }, { status: 500 })
  }
}
