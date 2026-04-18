import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()

    const waiver = await prisma.waiver.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone || null,
        dateOfBirth: body.dateOfBirth || null,
        emergencyName: body.emergencyName || null,
        emergencyPhone: body.emergencyPhone || null,
        leagueDay: body.leagueDay || null,
        tournamentName: body.tournamentName || null,
        teamName: body.teamName || null,
        agreedToTerms: body.agreedToTerms || false,
        agreedToLiability: body.agreedToLiability || false,
        agreedToMedia: body.agreedToMedia || false,
        signatureName: body.signatureName,
      },
    })

    return NextResponse.json({ success: true, id: waiver.id })
  } catch (error) {
    console.error('Waiver submission error:', error)
    return NextResponse.json({ error: 'Failed to submit waiver' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const waivers = await prisma.waiver.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ waivers })
  } catch (error) {
    console.error('Waiver fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch waivers' }, { status: 500 })
  }
}
