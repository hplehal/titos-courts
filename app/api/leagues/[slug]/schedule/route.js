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
          weeks: {
            orderBy: { weekNumber: 'asc' },
            include: {
              tierPlacements: {
                include: {
                  team: { select: { id: true, name: true } },
                  tier: { select: { tierNumber: true, courtNumber: true, timeSlot: true } },
                },
              },
              matches: {
                include: {
                  homeTeam: { select: { name: true } },
                  awayTeam: { select: { name: true } },
                  refTeam: { select: { name: true } },
                  scores: { orderBy: { setNumber: 'asc' } },
                },
                orderBy: [{ tierNumber: 'asc' }, { gameOrder: 'asc' }],
              },
            },
          },
        },
      },
    },
  })

  if (!league || !league.seasons[0]) return NextResponse.json({ weeks: [] })

  const season = league.seasons[0]

  // Format weeks with tier groupings
  const weeks = season.weeks.map(week => {
    const tierGroups = {}
    for (const p of week.tierPlacements) {
      const tn = p.tier.tierNumber
      if (!tierGroups[tn]) tierGroups[tn] = {
        tierNumber: tn,
        courtNumber: p.tier.courtNumber,
        timeSlot: p.tier.timeSlot,
        teams: [],
        matches: [],
      }
      tierGroups[tn].teams.push({ id: p.team.id, name: p.team.name, finishPosition: p.finishPosition, movement: p.movement })
    }

    for (const m of week.matches) {
      if (tierGroups[m.tierNumber]) {
        tierGroups[m.tierNumber].matches.push({
          homeTeam: m.homeTeam?.name,
          awayTeam: m.awayTeam?.name,
          refTeam: m.refTeam?.name,
          scores: m.scores.map(s => `${s.homeScore}-${s.awayScore}`).join(', '),
          status: m.status,
        })
      }
    }

    return {
      id: week.id,
      weekNumber: week.weekNumber,
      date: week.date,
      isPlayoff: week.isPlayoff,
      status: week.status,
      tiers: Object.values(tierGroups).sort((a, b) => a.tierNumber - b.tierNumber),
    }
  })

  return NextResponse.json({ weeks })
}
