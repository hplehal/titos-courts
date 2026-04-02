import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()

    const registration = await prisma.registration.create({
      data: {
        type: body.type || 'league',
        leagueSlug: body.leagueSlug || null,
        tournamentId: body.tournamentId || null,
        teamName: body.teamName || null,
        captainName: body.captainName,
        captainEmail: body.captainEmail,
        captainPhone: body.captainPhone || null,
        playerCount: body.playerCount ? parseInt(body.playerCount) : null,
        playerNames: body.playerNames || null,
        skillLevel: body.skillLevel || null,
        preferredDay: body.preferredDay || null,
        heardAboutUs: body.heardAboutUs || null,
      },
    })

    return NextResponse.json({ success: true, id: registration.id })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to submit registration' }, { status: 500 })
  }
}
