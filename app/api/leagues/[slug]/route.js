import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { slug } = await params
  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      seasons: {
        where: { status: { in: ['active', 'playoffs'] } },
        orderBy: { seasonNumber: 'desc' },
        take: 1,
        include: {
          teams: { select: { id: true, name: true, slug: true, captainName: true } },
          tiers: { orderBy: { tierNumber: 'asc' } },
          _count: { select: { teams: true, weeks: true } },
        },
      },
    },
  })

  if (!league) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(league)
}
