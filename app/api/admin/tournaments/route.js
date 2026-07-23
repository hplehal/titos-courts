import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { TOURNAMENT_STATUS } from '@/lib/tournament/constants'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/** GET /api/admin/tournaments — list all tournaments (admin-only). */
export async function GET(request) {
  if (!checkAdminPassword(request)) return unauthorized()
  const tournaments = await prisma.tournament.findMany({
    orderBy: { date: 'desc' },
    select: {
      id: true, slug: true, name: true, date: true, endDate: true, venue: true,
      status: true, poolSize: true, poolCount: true, courtCount: true, imageType: true,
      _count: { select: { tournamentTeams: true, pools: true, brackets: true } },
    },
  })
  return NextResponse.json({ tournaments })
}

/** POST /api/admin/tournaments — create a new tournament. */
export async function POST(request) {
  if (!checkAdminPassword(request)) return unauthorized()
  try {
    const body = await request.json()
    const {
      name, slug, date, endDate, venue, poolSize, poolCount, courtCount,
      description, format, registrationFee, maxTeams, registrationDeadline,
      imageBase64, imageType,
    } = body

    // Poster upload arrives as a base64 data payload (client downscales to
    // keep it small). Guard against oversized uploads: ~2MB decoded.
    let imageData = null
    if (imageBase64) {
      const b64 = imageBase64.replace(/^data:[^;]+;base64,/, '')
      imageData = Buffer.from(b64, 'base64')
      if (imageData.length > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image too large after compression (max 2MB)' }, { status: 400 })
      }
    }

    if (!name || !date) {
      return NextResponse.json({ error: 'name and date required' }, { status: 400 })
    }

    const finalSlug = slug?.trim() || slugify(name)
    const existing = await prisma.tournament.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      return NextResponse.json({ error: `Slug "${finalSlug}" already in use` }, { status: 409 })
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        slug: finalSlug,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        venue: venue || null,
        poolSize: poolSize ? Number(poolSize) : null,
        poolCount: poolCount ? Number(poolCount) : null,
        courtCount: courtCount ? Number(courtCount) : null,
        imageData,
        imageType: imageData ? (imageType || 'image/jpeg') : null,
        description: description || null,
        format: format || null,
        registrationFee: registrationFee ? Number(registrationFee) : null,
        maxTeams: maxTeams ? Number(maxTeams) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        status: TOURNAMENT_STATUS.REGISTRATION,
      },
    })
    revalidateTournament(tournament.slug)
    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error) {
    console.error('Create tournament error:', error)
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 })
  }
}
