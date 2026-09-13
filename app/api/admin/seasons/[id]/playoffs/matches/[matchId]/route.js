// Playoff schedule editor API (admin) for one match.
//
// PATCH  — edit any of: weekId, roundNumber, gameOrder, courtNumber,
//          scheduledTime, home/away/ref team or placeholder label, and winner
//          wiring (nextMatchId + nextSlot). Only keys sent are changed.
// DELETE — remove the match, its scores, and any links pointing at it.

import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidateLeague } from '@/lib/server/leagues'
import { deletePlayoffMatches, loadPlayoffContext, parsePlayoffMatchInput } from '@/lib/server/playoffMatches'

export const dynamic = 'force-dynamic'

async function contextForMatch(seasonId, matchId) {
  const ctx = await loadPlayoffContext(seasonId)
  if (!ctx) return { error: NextResponse.json({ error: 'Season not found' }, { status: 404 }) }
  if (!ctx.matches.some(m => m.id === matchId)) {
    return { error: NextResponse.json({ error: "Match isn't in this season's playoffs" }, { status: 404 }) }
  }
  return { ctx }
}

export async function PATCH(request, { params }) {
  const { id: seasonId, matchId } = await params
  try {
    const body = await request.json()
    const { ctx, error: notFound } = await contextForMatch(seasonId, matchId)
    if (notFound) return notFound

    const { data, error } = parsePlayoffMatchInput(body, ctx, { matchId })
    if (error) return NextResponse.json({ error }, { status: 400 })
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    const match = await prisma.match.update({ where: { id: matchId }, data })
    revalidateLeague(ctx.season.league.slug)
    return NextResponse.json({ success: true, match })
  } catch (error) {
    console.error('Playoff match update error:', error)
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  const { id: seasonId, matchId } = await params
  try {
    const { ctx, error: notFound } = await contextForMatch(seasonId, matchId)
    if (notFound) return notFound

    await deletePlayoffMatches([matchId])
    revalidateLeague(ctx.season.league.slug)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Playoff match delete error:', error)
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 })
  }
}
