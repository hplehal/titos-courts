import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    include: { _count: { select: { tournamentTeams: true } } },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(tournaments)
}
