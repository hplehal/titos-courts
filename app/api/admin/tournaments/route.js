import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// POST: create a tournament
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, date, description, format, registrationFee, maxTeams, registrationDeadline } = body
    if (!name || !date) {
      return NextResponse.json({ error: 'Name and date are required' }, { status: 400 })
    }

    // Ensure slug uniqueness by suffixing if taken
    let slug = slugify(name)
    const existing = await prisma.tournament.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const tournament = await prisma.tournament.create({
      data: {
        name,
        slug,
        date: new Date(date + 'T12:00:00Z'),
        description: description || null,
        format: format || null,
        registrationFee: registrationFee ? parseInt(registrationFee) : null,
        maxTeams: maxTeams ? parseInt(maxTeams) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline + 'T12:00:00Z') : null,
        status: 'registration',
      },
    })
    return NextResponse.json({ success: true, tournament })
  } catch (error) {
    console.error('Tournaments POST error:', error)
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 })
  }
}

// PATCH: update tournament status or details
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { tournamentId, status, name, date } = body
    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId required' }, { status: 400 })
    }
    const data = {}
    if (status) data.status = status
    if (name) data.name = name
    if (date) data.date = new Date(date + 'T12:00:00Z')

    const tournament = await prisma.tournament.update({ where: { id: tournamentId }, data })
    return NextResponse.json({ success: true, tournament })
  } catch (error) {
    console.error('Tournaments PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 })
  }
}

// DELETE: remove a tournament and all its data
export async function DELETE(request) {
  try {
    const { tournamentId } = await request.json()
    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId required' }, { status: 400 })
    }
    // Clear dependents first (set scores cascade from matches)
    await prisma.tournamentMatch.deleteMany({
      where: {
        OR: [
          { pool: { tournamentId } },
          { bracket: { tournamentId } },
        ],
      },
    })
    await prisma.tournamentTeam.deleteMany({ where: { tournamentId } })
    await prisma.tournamentPool.deleteMany({ where: { tournamentId } })
    await prisma.tournamentBracket.deleteMany({ where: { tournamentId } })
    await prisma.tournament.delete({ where: { id: tournamentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tournaments DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
  }
}
