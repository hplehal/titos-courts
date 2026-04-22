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
        season: {
          include: {
            tiers: { orderBy: { tierNumber: 'asc' } },
            // League slug decides which tiebreaker cascade to apply.
            league: { select: { slug: true } },
          },
        },
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

    // Head-to-head point diff, built once per week from the raw scores.
    // h2h[a][b] = A's net points across every set A played against B this week.
    // Only consulted as a tiebreaker for Sunday MENS (3 sets per matchup gives
    // a meaningful sample — see lib/server/leagues.js for the matching rule on
    // season standings).
    const h2h = {}
    for (const match of week.matches) {
      for (const score of match.scores) {
        const diff = score.homeScore - score.awayScore
        if (!h2h[match.homeTeamId]) h2h[match.homeTeamId] = {}
        if (!h2h[match.awayTeamId]) h2h[match.awayTeamId] = {}
        h2h[match.homeTeamId][match.awayTeamId] = (h2h[match.homeTeamId][match.awayTeamId] || 0) + diff
        h2h[match.awayTeamId][match.homeTeamId] = (h2h[match.awayTeamId][match.homeTeamId] || 0) - diff
      }
    }
    const useHeadToHead = week.season.league?.slug === 'sunday-mens'

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

      // Sort: sets won desc, then (Sunday MENS only) head-to-head, then point diff desc.
      // COED leagues stick with the legacy setsWon → pointDiff rule on purpose.
      data.teams.sort((a, b) => {
        if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon
        if (useHeadToHead) {
          const h = (h2h[b.id]?.[a.id] ?? 0) - (h2h[a.id]?.[b.id] ?? 0)
          if (h !== 0) return h
        }
        return b.pointDiff - a.pointDiff
      })

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
