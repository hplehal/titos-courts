import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'

export const dynamic = 'force-dynamic'

/**
 * PATCH — update bracket match metadata (court + ref).
 *
 * Separate from the scores endpoint because:
 *   - Scores are high-frequency during live play; metadata is low-frequency
 *     setup. Splitting the routes means saving a court number doesn't have
 *     to walk the computeMatchStatus + advanceBracketWinner path.
 *   - Court / ref are valid to set BEFORE any scores exist.
 *
 * Accepts any subset of { courtNumber, refTeamId } — omit a field to leave
 * it unchanged; pass `null` to clear it.
 */
export async function PATCH(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug, matchId } = await params
  try {
    const body = await request.json()

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, bracketId: true, bracket: { select: { tournamentId: true } } },
    })
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    if (!match.bracketId) {
      return NextResponse.json({ error: 'Not a bracket match' }, { status: 400 })
    }

    const data = {}

    if (Object.prototype.hasOwnProperty.call(body, 'courtNumber')) {
      const raw = body.courtNumber
      if (raw === null || raw === '') {
        data.courtNumber = null
      } else {
        const n = Number(raw)
        if (!Number.isFinite(n) || n < 1 || n > 99) {
          return NextResponse.json({ error: 'courtNumber must be 1–99 or null' }, { status: 400 })
        }
        data.courtNumber = Math.round(n)
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'refTeamId')) {
      const raw = body.refTeamId
      if (raw === null || raw === '') {
        data.refTeamId = null
      } else if (typeof raw !== 'string') {
        return NextResponse.json({ error: 'refTeamId must be a team id or null' }, { status: 400 })
      } else {
        // Validate the team belongs to this tournament — otherwise admins
        // could accidentally point at a team from another event.
        const team = await prisma.tournamentTeam.findUnique({
          where: { id: raw },
          select: { id: true, tournamentId: true },
        })
        if (!team || team.tournamentId !== match.bracket.tournamentId) {
          return NextResponse.json({ error: 'Ref team is not in this tournament' }, { status: 400 })
        }
        data.refTeamId = raw
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const updated = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data,
      select: {
        id: true,
        courtNumber: true,
        refTeamId: true,
        refTeam: { select: { id: true, name: true } },
      },
    })

    revalidateTournament(slug)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update bracket match metadata error:', error)
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}
