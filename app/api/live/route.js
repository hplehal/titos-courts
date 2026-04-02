import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const include = {
    homeTeam: { select: { id: true, name: true } },
    awayTeam: { select: { id: true, name: true } },
    refTeam: { select: { id: true, name: true } },
    scores: { orderBy: { setNumber: 'asc' } },
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

  const [active, recent] = await Promise.all([
    prisma.match.findMany({ where: { status: 'live' }, include, orderBy: { createdAt: 'asc' } }),
    prisma.match.findMany({
      where: { status: 'completed', createdAt: { gte: twoHoursAgo } },
      include,
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return NextResponse.json({ active, recent })
}
