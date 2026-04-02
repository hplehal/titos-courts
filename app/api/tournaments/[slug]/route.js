import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { slug } = await params
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      tournamentTeams: true,
      pools: {
        include: {
          teams: true,
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              scores: { orderBy: { setNumber: 'asc' } },
            },
          },
        },
      },
      brackets: {
        include: {
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              scores: { orderBy: { setNumber: 'asc' } },
            },
            orderBy: [{ bracketRound: 'asc' }, { bracketPosition: 'asc' }],
          },
        },
      },
    },
  })

  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tournament)
}
