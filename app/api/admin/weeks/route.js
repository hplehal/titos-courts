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

// PATCH: Update week status or date
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { weekId, status, date } = body

    if (!weekId) {
      return NextResponse.json({ error: 'weekId required' }, { status: 400 })
    }

    const updateData = {}
    if (status) updateData.status = status
    if (date) updateData.date = new Date(date)

    const week = await prisma.week.update({
      where: { id: weekId },
      data: updateData,
    })

    // When activating a week, also set the season to active
    if (status === 'active') {
      const fullWeek = await prisma.week.findUnique({ where: { id: weekId }, select: { seasonId: true } })
      if (fullWeek) {
        await prisma.season.update({
          where: { id: fullWeek.seasonId },
          data: { status: 'active' },
        })
      }
    }

    return NextResponse.json({ success: true, week })
  } catch (error) {
    console.error('Week PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update week' }, { status: 500 })
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

    if (body.action === 'set-placements') {
      return await handleSetPlacements(body)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Weeks POST error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// ─── ADD NEXT WEEK ───

async function handleAddWeek({ seasonId, date }) {
  if (!seasonId) {
    return NextResponse.json({ error: 'seasonId required' }, { status: 400 })
  }

  // Get the latest week for this season
  const lastWeek = await prisma.week.findFirst({
    where: { seasonId },
    orderBy: { weekNumber: 'desc' },
  })

  const nextWeekNumber = lastWeek ? lastWeek.weekNumber + 1 : 1

  // Use provided date, or default to +7 days from last week
  const nextDate = date
    ? new Date(date + 'T12:00:00Z')
    : lastWeek
    ? (() => {
        const d = new Date(lastWeek.date)
        d.setDate(d.getDate() + 7)
        d.setUTCHours(12, 0, 0, 0)
        return d
      })()
    : (() => {
        const d = new Date()
        d.setUTCHours(12, 0, 0, 0)
        return d
      })()

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

  // Weeks 1-2: manual tier assignment (admin uses "Setup Tiers" button)
  // Weeks 3+: auto-generate from previous week's movements
  if (nextWeekNumber <= 2) {
    // Don't auto-assign tiers — admin will do it manually
    return NextResponse.json({ success: true, week: newWeek })
  }

  // Auto-copy tier placements from the most recent week that has placements
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
      // Schedule: A vs C, B vs A, C vs B (× 2 rounds)
      // 2nd team (B) refs sets 1,4 — plays sets 2,3,5,6
      const matchDefs = [
        { home: A, away: C, ref: B, round: r, order: baseOrder + 1 },
        { home: B, away: A, ref: C, round: r, order: baseOrder + 2 },
        { home: C, away: B, ref: A, round: r, order: baseOrder + 3 },
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

// ─── SET MANUAL TIER PLACEMENTS (Week 1 Placement) ───

async function handleSetPlacements({ weekId, tierAssignments }) {
  if (!weekId || !tierAssignments) {
    return NextResponse.json({ error: 'weekId and tierAssignments required' }, { status: 400 })
  }

  const week = await prisma.week.findUnique({
    where: { id: weekId },
    include: { season: { include: { tiers: true } } },
  })

  if (!week) {
    return NextResponse.json({ error: 'Week not found' }, { status: 404 })
  }

  // Clear any existing placements for this week
  await prisma.tierPlacement.deleteMany({ where: { weekId } })

  // Build a map of tierNumber -> tier record
  const tierMap = {}
  for (const t of week.season.tiers) {
    tierMap[t.tierNumber] = t
  }

  // Create placements
  let count = 0
  for (const [tierNumber, teamIds] of Object.entries(tierAssignments)) {
    const tier = tierMap[parseInt(tierNumber)]
    if (!tier) continue

    for (const teamId of teamIds) {
      await prisma.tierPlacement.create({
        data: {
          tierId: tier.id,
          teamId,
          weekId,
          finishPosition: null,
          movement: null,
        },
      })
      count++
    }
  }

  return NextResponse.json({ success: true, count })
}

// ─── DELETE WEEK OR MATCHES ───

export async function DELETE(request) {
  try {
    const body = await request.json()
    const { weekId, matchesOnly } = body

    if (!weekId) {
      return NextResponse.json({ error: 'weekId required' }, { status: 400 })
    }

    if (matchesOnly) {
      // Delete only matches and their scores for this week
      const matches = await prisma.match.findMany({ where: { weekId }, select: { id: true } })
      const matchIds = matches.map(m => m.id)
      if (matchIds.length > 0) {
        await prisma.setScore.deleteMany({ where: { matchId: { in: matchIds } } })
        await prisma.playerStat.deleteMany({ where: { matchId: { in: matchIds } } })
      }
      await prisma.match.deleteMany({ where: { weekId } })
      return NextResponse.json({ success: true, deleted: matchIds.length })
    }

    // Delete entire week: scores → matches → placements → week
    const matches = await prisma.match.findMany({ where: { weekId }, select: { id: true } })
    const matchIds = matches.map(m => m.id)
    if (matchIds.length > 0) {
      await prisma.setScore.deleteMany({ where: { matchId: { in: matchIds } } })
      await prisma.playerStat.deleteMany({ where: { matchId: { in: matchIds } } })
    }
    await prisma.match.deleteMany({ where: { weekId } })
    await prisma.tierPlacement.deleteMany({ where: { weekId } })
    await prisma.week.delete({ where: { id: weekId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Week delete error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
