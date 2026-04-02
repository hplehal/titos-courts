import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET: List weeks for a season with match counts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')

    if (!seasonId) {
      return NextResponse.json({ error: 'seasonId required' }, { status: 400 })
    }

    const weeks = await prisma.week.findMany({
      where: { seasonId },
      include: {
        _count: { select: { matches: true, tierPlacements: true } },
      },
      orderBy: { weekNumber: 'asc' },
    })

    return NextResponse.json({ weeks })
  } catch (error) {
    console.error('Weeks GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch weeks' }, { status: 500 })
  }
}

// POST: Add a week or generate matches
export async function POST(request) {
  try {
    const body = await request.json()

    if (body.action === 'add-week') {
      return await handleAddWeek(body)
    }

    if (body.action === 'generate-matches') {
      return await handleGenerateMatches(body)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Weeks POST error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// ─── ADD NEXT WEEK ───

async function handleAddWeek({ seasonId }) {
  if (!seasonId) {
    return NextResponse.json({ error: 'seasonId required' }, { status: 400 })
  }

  // Get the latest week for this season
  const lastWeek = await prisma.week.findFirst({
    where: { seasonId },
    orderBy: { weekNumber: 'desc' },
  })

  const nextWeekNumber = lastWeek ? lastWeek.weekNumber + 1 : 1
  const nextDate = lastWeek
    ? new Date(new Date(lastWeek.date).getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date()

  // Create the new week
  const newWeek = await prisma.week.create({
    data: {
      seasonId,
      weekNumber: nextWeekNumber,
      date: nextDate,
      status: 'upcoming',
      isPlayoff: false,
    },
  })

  // Copy tier placements from the most recent week that has placements
  // If the last completed week has movements, use those to determine new placements
  const latestWeekWithPlacements = await prisma.week.findFirst({
    where: {
      seasonId,
      tierPlacements: { some: {} },
      id: { not: newWeek.id },
    },
    orderBy: { weekNumber: 'desc' },
    include: {
      tierPlacements: {
        include: {
          tier: true,
        },
      },
    },
  })

  if (latestWeekWithPlacements) {
    // Get the season's tiers
    const tiers = await prisma.tier.findMany({
      where: { seasonId },
      orderBy: { tierNumber: 'asc' },
    })
    const tierMap = {}
    for (const t of tiers) {
      tierMap[t.tierNumber] = t
    }

    const totalTiers = tiers.length

    // Check if movements have been calculated
    const hasMovements = latestWeekWithPlacements.tierPlacements.some(p => p.movement)

    if (hasMovements) {
      // Apply movements to determine new tier compositions
      const currentComps = {}
      for (let t = 1; t <= totalTiers; t++) {
        currentComps[t] = []
      }
      for (const p of latestWeekWithPlacements.tierPlacements) {
        const tn = p.tier.tierNumber
        if (currentComps[tn]) currentComps[tn].push(p)
      }

      const newComps = {}
      for (let t = 1; t <= totalTiers; t++) {
        newComps[t] = []
      }

      for (let t = 1; t <= totalTiers; t++) {
        for (const p of (currentComps[t] || [])) {
          if (p.movement === 'up' && t > 1) {
            newComps[t - 1].push(p.teamId)
          } else if (p.movement === 'down' && t < totalTiers) {
            newComps[t + 1].push(p.teamId)
          } else {
            newComps[t].push(p.teamId)
          }
        }
      }

      // Create new tier placements
      for (let t = 1; t <= totalTiers; t++) {
        const tier = tierMap[t]
        if (!tier) continue
        for (const teamId of newComps[t]) {
          await prisma.tierPlacement.create({
            data: {
              tierId: tier.id,
              teamId,
              weekId: newWeek.id,
              finishPosition: null,
              movement: null,
            },
          })
        }
      }
    } else {
      // No movements — just copy current placements as-is
      for (const p of latestWeekWithPlacements.tierPlacements) {
        await prisma.tierPlacement.create({
          data: {
            tierId: p.tierId,
            teamId: p.teamId,
            weekId: newWeek.id,
            finishPosition: null,
            movement: null,
          },
        })
      }
    }
  }

  return NextResponse.json({ success: true, week: newWeek })
}

// ─── GENERATE MATCHES FOR A WEEK ───

async function handleGenerateMatches({ weekId }) {
  if (!weekId) {
    return NextResponse.json({ error: 'weekId required' }, { status: 400 })
  }

  // Get the week with season and league info
  const week = await prisma.week.findUnique({
    where: { id: weekId },
    include: {
      season: {
        include: {
          league: { select: { slug: true } },
        },
      },
      matches: true,
    },
  })

  if (!week) {
    return NextResponse.json({ error: 'Week not found' }, { status: 404 })
  }

  if (week.matches.length > 0) {
    return NextResponse.json({ error: 'Matches already exist for this week. Delete them first to regenerate.' }, { status: 400 })
  }

  // Determine COED vs MENS
  const leagueSlug = week.season.league.slug
  const isMens = leagueSlug.includes('sunday') || leagueSlug.includes('mens')
  const rounds = isMens ? 3 : 2

  // Get tier placements for this week
  const placements = await prisma.tierPlacement.findMany({
    where: { weekId },
    include: { tier: true },
  })

  if (placements.length === 0) {
    return NextResponse.json({ error: 'No tier placements found for this week. Add a week with placements first.' }, { status: 400 })
  }

  // Group teams by tier
  const tierGroups = {}
  for (const p of placements) {
    const tn = p.tier.tierNumber
    if (!tierGroups[tn]) {
      tierGroups[tn] = { tier: p.tier, teamIds: [] }
    }
    tierGroups[tn].teamIds.push(p.teamId)
  }

  let matchCount = 0

  for (const tn of Object.keys(tierGroups).sort((a, b) => a - b)) {
    const { tier, teamIds } = tierGroups[tn]
    if (teamIds.length < 3) continue

    const [A, B, C] = teamIds

    for (let r = 1; r <= rounds; r++) {
      const baseOrder = (r - 1) * 3
      const matchDefs = [
        { home: A, away: B, ref: C, round: r, order: baseOrder + 1 },
        { home: C, away: A, ref: B, round: r, order: baseOrder + 2 },
        { home: B, away: C, ref: A, round: r, order: baseOrder + 3 },
      ]

      for (const md of matchDefs) {
        await prisma.match.create({
          data: {
            weekId: week.id,
            homeTeamId: md.home,
            awayTeamId: md.away,
            refTeamId: md.ref,
            courtNumber: tier.courtNumber,
            tierNumber: tier.tierNumber,
            roundNumber: md.round,
            gameOrder: md.order,
            status: 'scheduled',
          },
        })
        matchCount++
      }
    }
  }

  return NextResponse.json({ success: true, matchCount })
}
