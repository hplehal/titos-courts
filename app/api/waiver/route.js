import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'

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

// Admin only: waivers hold players' contact details, birth dates and emergency
// contacts. Signing a waiver (POST) stays public.
export async function GET(request) {
  if (!checkAdminPassword(request)) return unauthorized()
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
