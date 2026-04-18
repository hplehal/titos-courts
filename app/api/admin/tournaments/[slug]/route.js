import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'

export const dynamic = 'force-dynamic'

/** GET full tournament record for the admin detail page. */
export async function GET(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      tournamentTeams: { orderBy: { name: 'asc' } },
      pools: {
        orderBy: { name: 'asc' },
        include: {
          teams: { select: { id: true, name: true } },
          _count: { select: { matches: true } },
        },
      },
      brackets: { include: { _count: { select: { matches: true } } } },
    },
  })
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ tournament })
}

/** PATCH tournament fields (name, venue, date, status, poolSize, poolCount, ...). */
export async function PATCH(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const body = await request.json()
    const allowed = [
      'name', 'venue', 'description', 'format', 'status',
      'registrationFee', 'maxTeams', 'poolSize', 'poolCount',
    ]
    const data = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }
    if (body.date) data.date = new Date(body.date)
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.registrationDeadline !== undefined) {
      data.registrationDeadline = body.registrationDeadline ? new Date(body.registrationDeadline) : null
    }
    // Coerce numeric-y strings
    for (const k of ['registrationFee', 'maxTeams', 'poolSize', 'poolCount']) {
      if (data[k] !== undefined && data[k] !== null) data[k] = Number(data[k])
    }

    const tournament = await prisma.tournament.update({ where: { slug }, data })
    revalidateTournament(slug)
    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Update tournament error:', error)
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 })
  }
}

/** DELETE the tournament and everything attached to it (cascade via app logic). */
export async function DELETE(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({ where: { slug }, select: { id: true } })
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Manual cascade — FKs in the existing schema don't all have onDelete: Cascade.
    await prisma.$transaction(async (tx) => {
      const matches = await tx.tournamentMatch.findMany({
        where: { OR: [{ pool: { tournamentId: t.id } }, { bracket: { tournamentId: t.id } }] },
        select: { id: true },
      })
      const matchIds = matches.map(m => m.id)
      if (matchIds.length) {
        await tx.tournamentSetScore.deleteMany({ where: { matchId: { in: matchIds } } })
        // Null out self-referential nextMatchId first to avoid FK blocks
        await tx.tournamentMatch.updateMany({ where: { id: { in: matchIds } }, data: { nextMatchId: null } })
        await tx.tournamentMatch.deleteMany({ where: { id: { in: matchIds } } })
      }
      await tx.tournamentBracket.deleteMany({ where: { tournamentId: t.id } })
      await tx.tournamentTeam.deleteMany({ where: { tournamentId: t.id } })
      await tx.tournamentPool.deleteMany({ where: { tournamentId: t.id } })
      await tx.tournament.delete({ where: { id: t.id } })
    })
    revalidateTournament(slug)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete tournament error:', error)
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
  }
}
