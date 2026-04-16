import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidateLeagueByWeek } from '@/lib/server/leagues'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { weekId, action } = body

    if (!weekId) return NextResponse.json({ error: 'weekId required' }, { status: 400 })

    // Get the week with all matches and tier placements
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: {
        season: { include: { tiers: { orderBy: { tierNumber: 'asc' } } } },
        matches: {
          where: { status: 'completed' },
          include: { scores: true },
        },
        tierPlacements: {
          include: {
            team: { select: { id: true, name: true } },
            tier: true,
          },
        },
      },
    })

    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

    // Group placements by tier
    const tierData = {}
    for (const p of week.tierPlacements) {
      const tn = p.tier.tierNumber
      if (!tierData[tn]) tierData[tn] = { tierNumber: tn, teams: [] }
      tierData[tn].teams.push({ id: p.team.id, name: p.team.name, placementId: p.id })
    }

    // Compute stats per team — find ALL matches the team played in (regardless of tier number)
    for (const [tierNum, data] of Object.entries(tierData)) {
      for (const team of data.teams) {
        let setsWon = 0, setsLost = 0, pointDiff = 0
        for (const match of week.matches) {
          if (match.homeTeamId !== team.id && match.awayTeamId !== team.id) continue

          for (const score of match.scores) {
            const isHome = match.homeTeamId === team.id
            const myScore = isHome ? score.homeScore : score.awayScore
            const oppScore = isHome ? score.awayScore : score.homeScore
            pointDiff += myScore - oppScore
            if (myScore > oppScore) setsWon++
            else setsLost++
          }
        }
        team.setsWon = setsWon
        team.setsLost = setsLost
        team.pointDiff = pointDiff
      }

      // Sort: sets won desc, then point diff desc
      data.teams.sort((a, b) => b.setsWon - a.setsWon || b.pointDiff - a.pointDiff)

      // Assign positions
      data.teams.forEach((t, i) => { t.position = i + 1 })

      // Calculate movement
      const maxTier = Math.max(...Object.keys(tierData).map(Number))
      const tn = parseInt(tierNum)

      data.teams.forEach((t, i) => {
        if (tn === 1) {
          // Top tier: 1st stays, 2nd stays, 3rd drops
          t.movement = i === 2 ? 'down' : 'stay'
        } else if (tn === maxTier) {
          // Bottom tier: 1st goes up, 2nd stays, 3rd stays
          t.movement = i === 0 ? 'up' : 'stay'
        } else {
          // Middle tiers: 1st up, 2nd stays, 3rd down
          t.movement = i === 0 ? 'up' : i === 2 ? 'down' : 'stay'
        }
      })
    }

    const tiers = Object.values(tierData).sort((a, b) => a.tierNumber - b.tierNumber)

    if (action === 'preview') {
      return NextResponse.json({ tiers })
    }

    if (action === 'apply') {
      // Update finish positions and movement on existing placements
      for (const tier of tiers) {
        for (const team of tier.teams) {
          await prisma.tierPlacement.update({
            where: { id: team.placementId },
            data: {
              finishPosition: team.position,
              movement: team.movement,
            },
          })
        }
      }

      // Mark week as completed if not already
      await prisma.week.update({
        where: { id: weekId },
        data: { status: 'completed' },
      })

      // Create next week's tier placements based on movements
      const nextWeek = await prisma.week.findFirst({
        where: {
          seasonId: week.seasonId,
          weekNumber: week.weekNumber + 1,
        },
      })

      if (nextWeek) {
        // Build new tier compositions
        const newTierTeams = {}
        for (const tier of tiers) {
          for (const team of tier.teams) {
            let newTier = tier.tierNumber
            if (team.movement === 'up') newTier = Math.max(1, tier.tierNumber - 1)
            if (team.movement === 'down') newTier = Math.min(tiers.length, tier.tierNumber + 1)
            if (!newTierTeams[newTier]) newTierTeams[newTier] = []
            newTierTeams[newTier].push(team.id)
          }
        }

        // Create placements for next week
        const seasonTiers = week.season.tiers
        for (const [tierNum, teamIds] of Object.entries(newTierTeams)) {
          const tier = seasonTiers.find(t => t.tierNumber === parseInt(tierNum))
          if (!tier) continue
          for (const teamId of teamIds) {
            await prisma.tierPlacement.upsert({
              where: { teamId_weekId: { teamId, weekId: nextWeek.id } },
              update: { tierId: tier.id },
              create: { tierId: tier.id, teamId, weekId: nextWeek.id },
            })
          }
        }
      }

      // Bust cached schedule/standings/results for the league
      await revalidateLeagueByWeek(weekId)
      return NextResponse.json({ success: true, tiers })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Tier movement error:', error)
    return NextResponse.json({ error: 'Failed to process tier movement' }, { status: 500 })
  }
}
