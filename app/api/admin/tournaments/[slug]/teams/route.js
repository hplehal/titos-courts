import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'

export const dynamic = 'force-dynamic'

async function findTournament(slug) {
  return prisma.tournament.findUnique({ where: { slug }, select: { id: true } })
}

/**
 * POST — add team(s) to the tournament roster.
 *
 * Accepts two payload shapes:
 *   Single: { name, captainName, captainEmail?, captainPhone? }
 *   Bulk:   { teams: [{ name, captainName?, captainEmail?, captainPhone? }, ...] }
 *
 * In bulk mode, captainName defaults to 'TBD' when missing (matches the
 * seasons bulk flow), and a summary `{ count, skipped, errors }` is returned.
 */
export async function POST(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await findTournament(slug)
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    const body = await request.json()

    // ─── Bulk path ───
    if (Array.isArray(body.teams)) {
      const rows = body.teams
        .map(row => ({
          name: (row?.name || '').trim(),
          captainName: (row?.captainName || '').trim() || 'TBD',
          captainEmail: (row?.captainEmail || '').trim() || null,
          captainPhone: (row?.captainPhone || '').trim() || null,
        }))
        .filter(row => row.name) // skip blank rows

      if (rows.length === 0) {
        return NextResponse.json({ error: 'No valid team names provided' }, { status: 400 })
      }

      let count = 0
      const errors = []
      for (const data of rows) {
        try {
          await prisma.tournamentTeam.create({ data: { tournamentId: t.id, ...data } })
          count++
        } catch (e) {
          errors.push(`${data.name}: ${e.message}`)
        }
      }
      revalidateTournament(slug)
      return NextResponse.json(
        { count, skipped: body.teams.length - rows.length, errors },
        { status: 201 },
      )
    }

    // ─── Single path ───
    const { name, captainName, captainEmail, captainPhone } = body
    if (!name || !captainName) {
      return NextResponse.json({ error: 'name and captainName required' }, { status: 400 })
    }
    const team = await prisma.tournamentTeam.create({
      data: {
        tournamentId: t.id,
        name: name.trim(),
        captainName: captainName.trim(),
        captainEmail: captainEmail?.trim() || null,
        captainPhone: captainPhone?.trim() || null,
      },
    })
    revalidateTournament(slug)
    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}

/** PATCH — edit a team. Requires teamId in body. */
export async function PATCH(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const body = await request.json()
    const { teamId, ...updates } = body
    if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

    const allowed = ['name', 'captainName', 'captainEmail', 'captainPhone', 'seed']
    const data = {}
    for (const k of allowed) if (updates[k] !== undefined) data[k] = updates[k]
    if (data.seed !== undefined && data.seed !== null) data.seed = Number(data.seed)

    const team = await prisma.tournamentTeam.update({ where: { id: teamId }, data })
    revalidateTournament(slug)
    return NextResponse.json({ team })
  } catch (error) {
    console.error('Update team error:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

/** DELETE — remove a team. Rejects if team has matches already played. */
export async function DELETE(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

    const matchCount = await prisma.tournamentMatch.count({
      where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
    })
    if (matchCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete — team has scheduled matches. Tear down pools first.' },
        { status: 409 },
      )
    }
    await prisma.tournamentTeam.delete({ where: { id: teamId } })
    revalidateTournament(slug)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete team error:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
