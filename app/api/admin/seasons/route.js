import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET: List all seasons with league info
export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        league: { select: { id: true, name: true, slug: true } },
        _count: { select: { teams: true } },
        tiers: { orderBy: { tierNumber: 'asc' } },
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
        startDate: new Date(startDate + 'T12:00:00Z'),
        endDate: new Date(endDate + 'T12:00:00Z'),
        totalWeeks: 11,
        playoffWeeks: 1,
        status: 'registration',
      },
    })

    // Auto-create tiers based on league configuration
    const league = await prisma.league.findUnique({ where: { id: leagueId } })
    if (league) {
      const isMens = league.slug.includes('sunday') || league.slug.includes('mens')

      if (isMens) {
        // MENS: 5 tiers, 5 courts (6-10), single time slot
        const mensTiers = [
          { tierNumber: 1, courtNumber: 7, timeSlot: 'single' },
          { tierNumber: 2, courtNumber: 6, timeSlot: 'single' },
          { tierNumber: 3, courtNumber: 8, timeSlot: 'single' },
          { tierNumber: 4, courtNumber: 9, timeSlot: 'single' },
          { tierNumber: 5, courtNumber: 10, timeSlot: 'single' },
        ]
        for (const t of mensTiers) {
          await prisma.tier.create({ data: { seasonId: season.id, ...t } })
        }
      } else {
        // COED: 8 tiers, courts 6,8,9,10, early/late slots
        const coedTiers = [
          { tierNumber: 1, courtNumber: 6, timeSlot: 'early' },
          { tierNumber: 2, courtNumber: 8, timeSlot: 'early' },
          { tierNumber: 3, courtNumber: 9, timeSlot: 'early' },
          { tierNumber: 4, courtNumber: 10, timeSlot: 'early' },
          { tierNumber: 5, courtNumber: 6, timeSlot: 'late' },
          { tierNumber: 6, courtNumber: 8, timeSlot: 'late' },
          { tierNumber: 7, courtNumber: 9, timeSlot: 'late' },
          { tierNumber: 8, courtNumber: 10, timeSlot: 'late' },
        ]
        for (const t of coedTiers) {
          await prisma.tier.create({ data: { seasonId: season.id, ...t } })
        }
      }
    }

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

    // Update a single tier's court number. Propagates to existing Match
    // records ON UPCOMING WEEKS (date >= today) so the schedule view picks
    // up the new court immediately. Completed weeks keep their historical
    // court number — that's a record of where the games were actually played.
    if (body.action === 'update-tier-court') {
      const { tierId, courtNumber } = body
      const ct = parseInt(courtNumber, 10)
      if (!tierId || !Number.isFinite(ct)) {
        return NextResponse.json({ error: 'tierId and courtNumber required' }, { status: 400 })
      }
      const tier = await prisma.tier.findUnique({ where: { id: tierId } })
      if (!tier) return NextResponse.json({ error: 'Tier not found' }, { status: 404 })

      await prisma.tier.update({ where: { id: tierId }, data: { courtNumber: ct } })

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcomingWeeks = await prisma.week.findMany({
        where: { seasonId: tier.seasonId, date: { gte: today } },
        select: { id: true },
      })
      const result = await prisma.match.updateMany({
        where: {
          weekId: { in: upcomingWeeks.map(w => w.id) },
          tierNumber: tier.tierNumber,
        },
        data: { courtNumber: ct },
      })
      return NextResponse.json({ success: true, matchesUpdated: result.count })
    }

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

    // Remove a single player (query param based)
    if (action === 'remove-player' && playerId) {
      await prisma.player.delete({ where: { id: playerId } })
      return NextResponse.json({ success: true })
    }

    // Delete a team (body based)
    const body = await request.json().catch(() => ({}))

    // Delete a single tier — only allowed if it has no placements and no
    // matches reference it (via tierNumber + season). Use this to drop a
    // tier that exists in the DB but isn't actually being used.
    if (body.action === 'delete-tier') {
      const { tierId } = body
      if (!tierId) return NextResponse.json({ error: 'tierId required' }, { status: 400 })
      const tier = await prisma.tier.findUnique({ where: { id: tierId } })
      if (!tier) return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
      const placementCount = await prisma.tierPlacement.count({ where: { tierId } })
      if (placementCount > 0) {
        return NextResponse.json({ error: `Tier has ${placementCount} placement(s); remove them first.` }, { status: 409 })
      }
      const matchCount = await prisma.match.count({
        where: { tierNumber: tier.tierNumber, week: { seasonId: tier.seasonId } },
      })
      if (matchCount > 0) {
        return NextResponse.json({ error: `Tier has ${matchCount} match(es); cannot delete.` }, { status: 409 })
      }
      await prisma.tier.delete({ where: { id: tierId } })
      return NextResponse.json({ success: true })
    }
    if (body.teamId) {
      const teamId = body.teamId
      // Delete in order: playerStats → setScores (via matches) → matches → tierPlacements → players → team
      const matches = await prisma.match.findMany({
        where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }, { refTeamId: teamId }] },
        select: { id: true },
      })
      const matchIds = matches.map(m => m.id)
      if (matchIds.length > 0) {
        await prisma.setScore.deleteMany({ where: { matchId: { in: matchIds } } })
        await prisma.playerStat.deleteMany({ where: { matchId: { in: matchIds } } })
      }
      await prisma.match.deleteMany({ where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }, { refTeamId: teamId }] } })
      await prisma.tierPlacement.deleteMany({ where: { teamId } })
      await prisma.player.deleteMany({ where: { teamId } })
      await prisma.team.delete({ where: { id: teamId } })
      return NextResponse.json({ success: true })
    }

    // Delete an entire season (body based)
    if (body.seasonId) {
      const seasonId = body.seasonId

      // Delete in correct order due to foreign keys
      // 1. SetScores (via matches)
      const matches = await prisma.match.findMany({ where: { week: { seasonId } }, select: { id: true } })
      const matchIds = matches.map(m => m.id)
      if (matchIds.length > 0) {
        await prisma.setScore.deleteMany({ where: { matchId: { in: matchIds } } })
        await prisma.playerStat.deleteMany({ where: { matchId: { in: matchIds } } })
      }

      // 2. Matches
      await prisma.match.deleteMany({ where: { week: { seasonId } } })

      // 3. TierPlacements
      await prisma.tierPlacement.deleteMany({ where: { week: { seasonId } } })

      // 4. Weeks
      await prisma.week.deleteMany({ where: { seasonId } })

      // 5. Players (via teams)
      const teams = await prisma.team.findMany({ where: { seasonId }, select: { id: true } })
      const teamIds = teams.map(t => t.id)
      if (teamIds.length > 0) {
        await prisma.player.deleteMany({ where: { teamId: { in: teamIds } } })
      }

      // 6. Teams
      await prisma.team.deleteMany({ where: { seasonId } })

      // 7. Tiers
      await prisma.tier.deleteMany({ where: { seasonId } })

      // 8. Season
      await prisma.season.delete({ where: { id: seasonId } })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Seasons DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
