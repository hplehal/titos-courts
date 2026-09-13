// Playoff schedule editor API (admin).
//
// GET  /api/admin/seasons/[id]/playoffs/matches
//   Playoff weeks, season teams, resolved divisions and every playoff match.
// POST /api/admin/seasons/[id]/playoffs/matches
//   Add a match to a division. Body needs tierNumber, weekId and roundNumber;
//   everything else is optional and editable afterwards.
//
// Edits and deletes of a single match live in ./[matchId]/route.js.

import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidateLeague } from '@/lib/server/leagues'
import { leagueTypeFor, resolveDivisions } from '@/lib/league/seasonConfig'
import { loadPlayoffContext, parsePlayoffMatchInput } from '@/lib/server/playoffMatches'

export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  const { id: seasonId } = await params
  try {
    const ctx = await loadPlayoffContext(seasonId)
    if (!ctx) return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    const { season } = ctx
    return NextResponse.json({
      season: { id: season.id, name: season.name, league: season.league },
      weeks: ctx.weeks,
      teams: ctx.teams,
      divisions: resolveDivisions(season.divisions, ctx.teams.length, leagueTypeFor(season.league.slug)),
      matches: ctx.matches,
    })
  } catch (error) {
    console.error('Playoff matches GET error:', error)
    return NextResponse.json({ error: 'Failed to load playoff matches' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const { id: seasonId } = await params
  try {
    const body = await request.json()
    if (body.tierNumber == null || !body.weekId || body.roundNumber == null) {
      return NextResponse.json({ error: 'tierNumber, weekId and roundNumber required' }, { status: 400 })
    }
    const ctx = await loadPlayoffContext(seasonId)
    if (!ctx) return NextResponse.json({ error: 'Season not found' }, { status: 404 })

    const { data, error } = parsePlayoffMatchInput(body, ctx)
    if (error) return NextResponse.json({ error }, { status: 400 })
    if (data.gameOrder == null) {
      const siblings = ctx.matches.filter(m => m.tierNumber === data.tierNumber && m.roundNumber === data.roundNumber)
      data.gameOrder = Math.max(0, ...siblings.map(m => m.gameOrder)) + 1
    }

    const match = await prisma.match.create({ data: { ...data, status: 'scheduled' } })
    revalidateLeague(ctx.season.league.slug)
    return NextResponse.json({ success: true, match })
  } catch (error) {
    console.error('Playoff match create error:', error)
    return NextResponse.json({ error: 'Failed to add match' }, { status: 500 })
  }
}
