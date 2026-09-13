import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { slugify } from '@/lib/utils'
import { revalidateLeague } from '@/lib/server/leagues'
import { DIVISION_NAMES, defaultTierLayout, leagueRules, tierLayout } from '@/lib/league/seasonConfig'

const MAX_TIERS = 20

// Resolve a tier's league slug so we can bust public schedule/standings
// caches after a write. Returns null if the tier was deleted in the same
// request — caller should fall back gracefully.
async function leagueSlugForTier(tierId) {
  const tier = await prisma.tier.findUnique({
    where: { id: tierId },
    select: { season: { select: { league: { select: { slug: true } } } } },
  })
  return tier?.season?.league?.slug || null
}

export const dynamic = 'force-dynamic'

// GET: List all seasons with league info
export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        league: { select: { id: true, name: true, slug: true, divisionCount: true } },
        _count: { select: { teams: true } },
        tiers: { orderBy: { tierNumber: 'asc' } },
        divisions: { orderBy: { position: 'asc' } },
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
    const { leagueId, name, seasonNumber, startDate, endDate, tierCount } = body
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

    // Auto-create tiers. The count comes from the create form (pre-filled from
    // the league's default tier count); courts and time slots come from the
    // league's rules and stay editable on /admin/courts.
    const league = await prisma.league.findUnique({ where: { id: leagueId } })
    if (league) {
      const requested = parseInt(tierCount, 10)
      const count = requested > 0 ? Math.min(requested, MAX_TIERS) : leagueRules(league).defaultTierCount
      await prisma.tier.createMany({
        data: defaultTierLayout(league, count).map(t => ({ seasonId: season.id, ...t })),
      })
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

    // Rename a season. Public pages show the name, so bust league caches.
    if (body.action === 'update-season') {
      const { seasonId } = body
      const name = String(body.name ?? '').trim()
      if (!seasonId || !name) {
        return NextResponse.json({ error: 'seasonId and a non-empty name required' }, { status: 400 })
      }
      const season = await prisma.season.update({
        where: { id: seasonId },
        data: { name },
        include: { league: { select: { slug: true } } },
      })
      revalidateLeague(season.league.slug)
      return NextResponse.json({ success: true })
    }

    // Append a tier below the current bottom tier. Court + time slot come
    // from the league preset; existing weeks are untouched.
    if (body.action === 'add-tier') {
      const { seasonId } = body
      if (!seasonId) return NextResponse.json({ error: 'seasonId required' }, { status: 400 })
      const season = await prisma.season.findUnique({
        where: { id: seasonId },
        include: { league: true, tiers: { select: { tierNumber: true } } },
      })
      if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 })
      if (season.tiers.length >= MAX_TIERS) {
        return NextResponse.json({ error: `A season can have at most ${MAX_TIERS} tiers.` }, { status: 400 })
      }
      const nextNumber = Math.max(0, ...season.tiers.map(t => t.tierNumber)) + 1
      const tier = await prisma.tier.create({
        data: { seasonId, ...tierLayout(season.league, nextNumber) },
      })
      revalidateLeague(season.league.slug)
      return NextResponse.json({ success: true, tier })
    }

    // Replace a season's playoff division sizes. Allowed any time — sizes
    // shift with team strength during the season. Standings pick it up
    // immediately; an already-built playoff bracket is NOT rewritten (the
    // playoffs editor flags the mismatch). An empty list deletes the rows and
    // restores the automatic even split.
    if (body.action === 'set-divisions') {
      const { seasonId, divisions } = body
      if (!seasonId || !Array.isArray(divisions)) {
        return NextResponse.json({ error: 'seasonId and divisions array required' }, { status: 400 })
      }
      const rows = []
      for (const d of divisions) {
        const position = parseInt(d.position, 10)
        const teamCount = parseInt(d.teamCount, 10)
        const courtNumber = d.courtNumber === '' || d.courtNumber == null ? null : parseInt(d.courtNumber, 10)
        if (!(position >= 1 && position <= DIVISION_NAMES.length)) {
          return NextResponse.json({ error: 'Invalid division position' }, { status: 400 })
        }
        if (!(teamCount >= 0)) {
          return NextResponse.json({ error: 'Team counts must be 0 or more' }, { status: 400 })
        }
        if (courtNumber !== null && !Number.isFinite(courtNumber)) {
          return NextResponse.json({ error: 'Court must be a number' }, { status: 400 })
        }
        if (teamCount > 0) rows.push({ seasonId, position, teamCount, courtNumber })
      }
      if (new Set(rows.map(r => r.position)).size !== rows.length) {
        return NextResponse.json({ error: 'Each division can only appear once' }, { status: 400 })
      }
      const season = await prisma.season.findUnique({
        where: { id: seasonId },
        select: { league: { select: { slug: true } } },
      })
      if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 })
      await prisma.$transaction([
        prisma.division.deleteMany({ where: { seasonId } }),
        prisma.division.createMany({ data: rows }),
      ])
      revalidateLeague(season.league.slug)
      return NextResponse.json({ success: true, count: rows.length })
    }

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
      const slug = await leagueSlugForTier(tierId)
      if (slug) revalidateLeague(slug)
      return NextResponse.json({ success: true, matchesUpdated: result.count })
    }

    // Update a single tier's timeSlot ('early' | 'late' | 'single').
    // Tier.timeSlot is metadata used to group tiers in the schedule view —
    // doesn't propagate to Match records (matches don't carry timeSlot).
    if (body.action === 'update-tier-slot') {
      const { tierId, timeSlot } = body
      const allowed = ['early', 'late', 'single']
      if (!tierId || !allowed.includes(timeSlot)) {
        return NextResponse.json({ error: 'tierId and valid timeSlot required' }, { status: 400 })
      }
      const tier = await prisma.tier.findUnique({ where: { id: tierId } })
      if (!tier) return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
      await prisma.tier.update({ where: { id: tierId }, data: { timeSlot } })
      const slug = await leagueSlugForTier(tierId)
      if (slug) revalidateLeague(slug)
      return NextResponse.json({ success: true })
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
      // Only the bottom tier can go: weekly placement copying and up/down
      // movement assume tiers are numbered 1..N with no gaps.
      const bottom = await prisma.tier.findFirst({
        where: { seasonId: tier.seasonId },
        orderBy: { tierNumber: 'desc' },
        select: { tierNumber: true },
      })
      if (bottom && bottom.tierNumber !== tier.tierNumber) {
        return NextResponse.json({ error: `Only the bottom tier (Tier ${bottom.tierNumber}) can be removed — tiers must stay numbered 1 to ${bottom.tierNumber}.` }, { status: 409 })
      }
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
      const slug = await leagueSlugForTier(tierId)
      await prisma.tier.delete({ where: { id: tierId } })
      if (slug) revalidateLeague(slug)
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

      // 7. Tiers + divisions
      await prisma.tier.deleteMany({ where: { seasonId } })
      await prisma.division.deleteMany({ where: { seasonId } })

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
