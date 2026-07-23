import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { computeMatchStatus } from '@/lib/tournament/computeMatchStatus'
import { MATCH_STATUS } from '@/lib/tournament/constants'

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
      select: { id: true, homeTeamId: true, awayTeamId: true, poolId: true, matchFormat: true, stage: true },
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
    // Resolve the scoring mode from the match's explicit matchFormat field
    // (e.g. 'pool-1set-25-cap-27' for the May 23 REC tournament). Falls back
    // to the legacy "poolId → pool" heuristic when matchFormat is null so
    // older tournaments keep their 2-set pool behaviour.
    const mode = match.matchFormat || (match.poolId ? 'pool' : 'bracket')
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

/**
 * POST — force-finalize a match at the 20-minute time cap. Used when the
 * leading team didn't reach 25 (e.g. 22-18 when the buzzer goes). Body
 * carries the same scores payload as PATCH; we save them, then mark the
 * match FINAL with whoever has more points across all entered sets.
 *
 * Refuses when the scores are tied — the captain's package says "if tied
 * at the cap, play the next point", so admin must enter a deciding point
 * before forcing the end.
 *
 * Body: { scores: [{ setNumber, homeScore, awayScore }, ...] }
 */
export async function POST(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug, matchId } = await params
  try {
    const body = await request.json()
    const incoming = Array.isArray(body.scores) ? body.scores : []

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, homeTeamId: true, awayTeamId: true, matchFormat: true, stage: true },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    // Save whatever scores were entered, then derive the winner from them.
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

    // Pure point comparison — ignore "win by 2" / cap rules entirely. The
    // time cap means whoever has more raw points takes the set. Ties are
    // illegal at this point per the captain's package; bail with 400 so the
    // admin enters the deciding point first.
    let homePts = 0, awayPts = 0
    for (const s of scores) { homePts += s.homeScore; awayPts += s.awayScore }
    if (homePts === awayPts) {
      return NextResponse.json(
        { error: 'Match is tied — play the deciding point before ending the match.' },
        { status: 400 },
      )
    }
    const winnerId = homePts > awayPts ? match.homeTeamId : match.awayTeamId

    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status: MATCH_STATUS.FINAL, winnerId },
    })

    revalidateTournament(slug)
    return NextResponse.json({ status: MATCH_STATUS.FINAL, winnerId, reason: 'time-cap' })
  } catch (error) {
    console.error('Time-cap end match error:', error)
    return NextResponse.json({ error: 'Failed to end match' }, { status: 500 })
  }
}

/**
 * DELETE — wipe all set scores for a pool match and reset its status to
 * SCHEDULED (winnerId cleared). Used by the admin "Clear scores" button
 * when a result needs to be redone from scratch.
 */
export async function DELETE(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug, matchId } = await params
  try {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, poolId: true },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      await tx.tournamentSetScore.deleteMany({ where: { matchId } })
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: MATCH_STATUS.SCHEDULED, winnerId: null },
      })
    })

    revalidateTournament(slug)
    return NextResponse.json({ cleared: true })
  } catch (error) {
    console.error('Clear match scores error:', error)
    return NextResponse.json({ error: 'Failed to clear scores' }, { status: 500 })
  }
}
