import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getDivisionInfo } from '@/lib/utils'

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
          teams: true,
          weeks: {
            where: { status: 'completed' },
            include: {
              matches: {
                where: { status: 'completed' },
                include: { scores: true },
              },
              tierPlacements: {
                include: {
                  team: { select: { id: true, name: true } },
                  tier: { select: { tierNumber: true, courtNumber: true, timeSlot: true } },
                },
              },
            },
            orderBy: { weekNumber: 'asc' },
          },
          tiers: { orderBy: { tierNumber: 'asc' } },
        },
      },
    },
  })

  if (!league || !league.seasons[0]) return NextResponse.json({ standings: [], currentTiers: [] })

  const season = league.seasons[0]
  const teamStats = {}
  for (const team of season.teams) {
    teamStats[team.id] = { id: team.id, name: team.name, setsWon: 0, setsLost: 0, pointDiff: 0, basePoints: 0, totalPoints: 0 }
  }

  for (const week of season.weeks) {
    // Skip Week 1 (placement) — doesn't count toward standings
    if (week.weekNumber === 1) continue
    const weekTeamSets = {}
    for (const match of week.matches) {
      for (const score of match.scores) {
        const homeWon = score.homeScore > score.awayScore
        const diff = score.homeScore - score.awayScore
        if (!weekTeamSets[match.homeTeamId]) weekTeamSets[match.homeTeamId] = { sets: 0, tierNumber: match.tierNumber }
        if (!weekTeamSets[match.awayTeamId]) weekTeamSets[match.awayTeamId] = { sets: 0, tierNumber: match.tierNumber }
        if (homeWon) {
          weekTeamSets[match.homeTeamId].sets++
          if (teamStats[match.homeTeamId]) { teamStats[match.homeTeamId].setsWon++; teamStats[match.homeTeamId].pointDiff += diff }
          if (teamStats[match.awayTeamId]) { teamStats[match.awayTeamId].setsLost++; teamStats[match.awayTeamId].pointDiff -= diff }
        } else {
          weekTeamSets[match.awayTeamId].sets++
          if (teamStats[match.awayTeamId]) { teamStats[match.awayTeamId].setsWon++; teamStats[match.awayTeamId].pointDiff += Math.abs(diff) }
          if (teamStats[match.homeTeamId]) { teamStats[match.homeTeamId].setsLost++; teamStats[match.homeTeamId].pointDiff -= Math.abs(diff) }
        }
      }
    }
    for (const [teamId, data] of Object.entries(weekTeamSets)) {
      if (teamStats[teamId]) {
        // Tier 1 = 8 base points, Tier 2 = 7, ... Tier 8 = 1
        const tierFactor = Math.max(1, 9 - data.tierNumber)
        teamStats[teamId].basePoints += tierFactor
        teamStats[teamId].totalPoints += tierFactor + data.sets
      }
    }
  }

  const standings = Object.values(teamStats)
    .sort((a, b) => b.totalPoints - a.totalPoints || b.pointDiff - a.pointDiff)
    .map((t, i) => ({ ...t, rank: i + 1 }))

  // Current tier view: last completed week's placements
  const lastWeek = season.weeks[season.weeks.length - 1]
  const tierMap = {}
  if (lastWeek) {
    for (const p of lastWeek.tierPlacements) {
      const tn = p.tier.tierNumber
      if (!tierMap[tn]) tierMap[tn] = { tierNumber: tn, courtNumber: p.tier.courtNumber, timeSlot: p.tier.timeSlot, teams: [] }
      tierMap[tn].teams.push({ id: p.team.id, name: p.team.name, finishPosition: p.finishPosition, movement: p.movement })
    }
  }
  const currentTiers = Object.values(tierMap).sort((a, b) => a.tierNumber - b.tierNumber)

  return NextResponse.json({ standings, currentTiers })
}
