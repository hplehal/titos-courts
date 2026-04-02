import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET: List all seasons with league info
export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        league: { select: { id: true, name: true, slug: true } },
        _count: { select: { teams: true } },
        teams: {
          include: {
            players: true,
            tierPlacements: {
              orderBy: { week: { weekNumber: 'desc' } },
              take: 1,
              include: { tier: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [{ league: { name: 'asc' } }, { seasonNumber: 'desc' }],
    })

    return NextResponse.json({ seasons })
  } catch (error) {
    console.error('Seasons GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 })
  }
}

// POST: Create new season OR bulk add teams
export async function POST(request) {
  try {
    const body = await request.json()

    // Add player action
    if (body.action === 'add-player') {
      const { teamId, playerName, jerseyNumber } = body
      if (!teamId || !playerName) {
        return NextResponse.json({ error: 'teamId and playerName required' }, { status: 400 })
      }
      const player = await prisma.player.create({
        data: {
          name: playerName,
          teamId,
          jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null,
        },
      })
      return NextResponse.json({ success: true, player })
    }

    // Bulk add teams action
    if (body.action === 'add-teams') {
      const { seasonId, teams } = body
      if (!seasonId || !teams || !Array.isArray(teams)) {
        return NextResponse.json({ error: 'seasonId and teams array required' }, { status: 400 })
      }

      let count = 0
      for (const t of teams) {
        if (!t.name) continue
        await prisma.team.create({
          data: {
            name: t.name,
            slug: slugify(t.name),
            seasonId,
            captainName: t.captainName || 'TBD',
            captainEmail: t.captainEmail || '',
          },
        })
        count++
      }

      return NextResponse.json({ success: true, count })
    }

    // Create new season
    const { leagueId, name, seasonNumber, startDate, endDate } = body
    if (!leagueId || !name || !seasonNumber || !startDate || !endDate) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const season = await prisma.season.create({
      data: {
        leagueId,
        name,
        seasonNumber: parseInt(seasonNumber),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalWeeks: 11,
        playoffWeeks: 1,
        status: 'registration',
      },
    })

    return NextResponse.json({ success: true, season })
  } catch (error) {
    console.error('Seasons POST error:', error)
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 })
  }
}

// PATCH: Update season status (archive) or update team details
export async function PATCH(request) {
  try {
    const body = await request.json()

    // Update team action
    if (body.action === 'update-team') {
      const { teamId, name, captainName, captainEmail } = body
      if (!teamId) {
        return NextResponse.json({ error: 'teamId required' }, { status: 400 })
      }
      const updateData = {}
      if (name !== undefined) {
        updateData.name = name
        updateData.slug = slugify(name)
      }
      if (captainName !== undefined) updateData.captainName = captainName
      if (captainEmail !== undefined) updateData.captainEmail = captainEmail

      await prisma.team.update({
        where: { id: teamId },
        data: updateData,
      })
      return NextResponse.json({ success: true })
    }

    // Archive season action (default)
    const { seasonId, status } = body
    if (!seasonId || !status) {
      return NextResponse.json({ error: 'seasonId and status required' }, { status: 400 })
    }

    await prisma.season.update({
      where: { id: seasonId },
      data: { status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Seasons PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE: Remove a player from a team
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const action = searchParams.get('action')

    if (action === 'remove-player' && playerId) {
      await prisma.player.delete({
        where: { id: playerId },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Seasons DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
