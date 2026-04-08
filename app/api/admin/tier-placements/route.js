import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET: Fetch placements for a week
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const weekId = searchParams.get('weekId')

  if (!weekId) return NextResponse.json({ placements: [] })

  const placements = await prisma.tierPlacement.findMany({
    where: { weekId },
    include: {
      team: { select: { id: true, name: true } },
      tier: { select: { id: true, tierNumber: true, courtNumber: true, timeSlot: true } },
    },
  })

  return NextResponse.json({ placements })
}

// PATCH: Swap two teams between tiers for any week
export async function PATCH(request) {
  try {
    const { weekId, teamAId, teamBId } = await request.json()
    if (!weekId || !teamAId || !teamBId) {
      return NextResponse.json({ error: 'weekId, teamAId, and teamBId required' }, { status: 400 })
    }

    const placementA = await prisma.tierPlacement.findUnique({ where: { teamId_weekId: { teamId: teamAId, weekId } } })
    const placementB = await prisma.tierPlacement.findUnique({ where: { teamId_weekId: { teamId: teamBId, weekId } } })

    if (!placementA || !placementB) {
      return NextResponse.json({ error: 'One or both teams not found in this week' }, { status: 404 })
    }

    // Swap their tier assignments
    await prisma.tierPlacement.update({ where: { id: placementA.id }, data: { tierId: placementB.tierId } })
    await prisma.tierPlacement.update({ where: { id: placementB.id }, data: { tierId: placementA.tierId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tier swap error:', error)
    return NextResponse.json({ error: 'Failed to swap teams' }, { status: 500 })
  }
}

// POST: Save tier assignments OR ensure tiers exist for a season
export async function POST(request) {
  try {
    const body = await request.json()

    // Ensure tiers exist for a season (auto-create if missing)
    if (body.action === 'ensure-tiers') {
      const { seasonId } = body
      const existingTiers = await prisma.tier.findMany({ where: { seasonId } })
      if (existingTiers.length > 0) {
        return NextResponse.json({ success: true, message: 'Tiers already exist', count: existingTiers.length })
      }

      const season = await prisma.season.findUnique({
        where: { id: seasonId },
        include: { league: { select: { slug: true } } },
      })
      if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 })

      const isMens = season.league.slug.includes('sunday') || season.league.slug.includes('mens')
      const tierDefs = isMens
        ? [
            { tierNumber: 1, courtNumber: 7, timeSlot: 'single' },
            { tierNumber: 2, courtNumber: 6, timeSlot: 'single' },
            { tierNumber: 3, courtNumber: 8, timeSlot: 'single' },
            { tierNumber: 4, courtNumber: 9, timeSlot: 'single' },
            { tierNumber: 5, courtNumber: 10, timeSlot: 'single' },
          ]
        : [
            { tierNumber: 1, courtNumber: 7, timeSlot: 'early' },
            { tierNumber: 2, courtNumber: 6, timeSlot: 'early' },
            { tierNumber: 3, courtNumber: 8, timeSlot: 'early' },
            { tierNumber: 4, courtNumber: 9, timeSlot: 'early' },
            { tierNumber: 5, courtNumber: 7, timeSlot: 'late' },
            { tierNumber: 6, courtNumber: 6, timeSlot: 'late' },
            { tierNumber: 7, courtNumber: 8, timeSlot: 'late' },
            { tierNumber: 8, courtNumber: 9, timeSlot: 'late' },
          ]

      for (const t of tierDefs) {
        await prisma.tier.create({ data: { seasonId, ...t } })
      }
      return NextResponse.json({ success: true, count: tierDefs.length })
    }

    // Save tier assignments for a week
    const { weekId, assignments } = body

    if (!weekId || !assignments) {
      return NextResponse.json({ error: 'weekId and assignments required' }, { status: 400 })
    }

    // Delete existing placements for this week
    await prisma.tierPlacement.deleteMany({ where: { weekId } })

    // Create new placements
    let count = 0
    for (const [tierId, teamIds] of Object.entries(assignments)) {
      for (const teamId of teamIds) {
        await prisma.tierPlacement.create({
          data: {
            tierId,
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
  } catch (error) {
    console.error('Tier placements error:', error)
    return NextResponse.json({ error: 'Failed to save placements' }, { status: 500 })
  }
}
