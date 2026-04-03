import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // For each active league, get the most recently completed week with tier placements
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    include: {
      seasons: {
        where: { status: { in: ['active', 'playoffs'] } },
        orderBy: { seasonNumber: 'desc' },
        take: 1,
        include: {
          weeks: {
            where: { status: 'completed', weekNumber: { gt: 1 } }, // Skip placement week
            orderBy: { weekNumber: 'desc' },
            take: 1,
            include: {
              tierPlacements: {
                include: {
                  team: { select: { id: true, name: true } },
                  tier: { select: { tierNumber: true, courtNumber: true, timeSlot: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const results = []
  for (const league of leagues) {
    const season = league.seasons[0]
    if (!season) continue
    const week = season.weeks[0]
    if (!week) continue

    // Group placements by tier
    const tiers = {}
    for (const p of week.tierPlacements) {
      const tn = p.tier.tierNumber
      if (!tiers[tn]) tiers[tn] = { tierNumber: tn, courtNumber: p.tier.courtNumber, teams: [] }
      tiers[tn].teams.push({
        id: p.team.id,
        name: p.team.name,
        finishPosition: p.finishPosition,
        movement: p.movement,
      })
    }

    // Sort teams within each tier by finish position
    for (const t of Object.values(tiers)) {
      t.teams.sort((a, b) => (a.finishPosition || 99) - (b.finishPosition || 99))
    }

    results.push({
      slug: league.slug,
      name: league.name,
      seasonName: season.name,
      week: {
        weekNumber: week.weekNumber,
        date: week.date,
        tiers: Object.values(tiers).sort((a, b) => a.tierNumber - b.tierNumber),
      },
    })
  }

  return NextResponse.json({ results })
}
