import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    include: {
      seasons: {
        orderBy: { seasonNumber: 'desc' },
        take: 1,
        include: { _count: { select: { teams: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(leagues)
}
