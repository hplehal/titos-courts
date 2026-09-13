// Admin endpoint that builds the league playoff bracket draft for a season.
//
// POST   /api/admin/seasons/[id]/playoffs
//   Body: { positions?: number[] }  (division positions, 1=Diamond … 4=Silver)
//   1. Verifies the regular season is complete (W1-W9 all status=completed)
//   2. Computes end-of-season standings via the same logic the public
//      /standings page uses
//   3. Splits teams into the season's divisions — sizes set in Seasons →
//      Tiers & Divisions, or the automatic even split
//   4. Creates match shells in W10 (QFs) and W11 (SFs + Finals) with the
//      nextMatchId / nextSlot chain wired so winners auto-advance. Admins then
//      edit the draft on /admin/playoffs.
//   Without `positions`, refuses if playoff matches already exist (DELETE
//   first to regenerate). With `positions`, rebuilds just those divisions:
//   their existing playoff matches (and scores) are replaced.
//
// DELETE /api/admin/seasons/[id]/playoffs[?position=N]
//   Wipes every Match row in the season's playoff weeks (or one division's).
//   Cascades SetScores. Used for the "regenerate playoffs" workflow.

import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidateLeague } from '@/lib/server/leagues'
import { buildPlayoffPlan } from '@/lib/league/generatePlayoffBracket'
import { leagueTypeFor, resolveDivisions, tierFactor } from '@/lib/league/seasonConfig'
import { deletePlayoffMatches } from '@/lib/server/playoffMatches'

export const dynamic = 'force-dynamic'

const REGULAR_SEASON_WEEKS = 9
const PLAYOFF_WEEK_NUMBERS = [10, 11]

export async function POST(request, { params }) {
  const { id: seasonId } = await params
  try {
    const body = await request.json().catch(() => ({}))
    const positions = Array.isArray(body.positions)
      ? body.positions.map(Number).filter(Number.isInteger)
      : null

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        league: { select: { slug: true } },
        weeks: { orderBy: { weekNumber: 'asc' } },
        divisions: { orderBy: { position: 'asc' } },
      },
    })
    if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 })

    // Regular season completeness check
    const regularWeeks = season.weeks.filter(w => w.weekNumber <= REGULAR_SEASON_WEEKS)
    if (regularWeeks.length < REGULAR_SEASON_WEEKS) {
      return NextResponse.json(
        { error: `Regular season has only ${regularWeeks.length}/${REGULAR_SEASON_WEEKS} weeks created. Finish creating weeks first.` },
        { status: 400 },
      )
    }
    const incompleteWeek = regularWeeks.find(w => w.status !== 'completed')
    if (incompleteWeek) {
      return NextResponse.json(
        { error: `Week ${incompleteWeek.weekNumber} isn't completed yet — finalize scores before generating playoffs.` },
        { status: 400 },
      )
    }

    // Build the plan BEFORE touching any rows so a bad division setup never
    // leaves the season half-wiped.
    const standings = await computeEndOfSeasonStandings(seasonId)
    const divisions = resolveDivisions(season.divisions, standings.length, leagueTypeFor(season.league.slug))
    const placed = divisions.reduce((sum, d) => sum + d.teamCount, 0)
    if (season.divisions.length && placed !== standings.length) {
      return NextResponse.json(
        { error: `Division sizes add up to ${placed} but the season has ${standings.length} teams — fix them in Seasons → Tiers & Divisions.` },
        { status: 400 },
      )
    }
    let plan
    try {
      plan = buildPlayoffPlan(
        standings.map(s => ({ teamId: s.id, name: s.name, rank: s.rank })),
        divisions,
      )
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (positions) plan = plan.filter(m => positions.includes(m.tierNumber))
    if (!plan.length) {
      return NextResponse.json({ error: 'Nothing to build — a division needs at least 2 teams.' }, { status: 400 })
    }

    // Auto-create W10 and W11 if missing. Both are flagged isPlayoff=true
    // and dated one week apart starting from W9's date. Admin can edit
    // the dates afterwards via the seasons editor if those defaults don't
    // line up with the actual booking calendar.
    const w9 = season.weeks.find(w => w.weekNumber === 9)
    const baseDate = w9?.date ? new Date(w9.date) : new Date()
    let w10 = season.weeks.find(w => w.weekNumber === 10)
    if (!w10) {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + 7)
      w10 = await prisma.week.create({
        data: { seasonId: season.id, weekNumber: 10, date: d, isPlayoff: true, status: 'upcoming' },
      })
    }
    let w11 = season.weeks.find(w => w.weekNumber === 11)
    if (!w11) {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + 14)
      w11 = await prisma.week.create({
        data: { seasonId: season.id, weekNumber: 11, date: d, isPlayoff: true, status: 'upcoming' },
      })
    }
    // Weeks added by hand start as regular weeks. The public bracket and the
    // schedule editor only read isPlayoff weeks, so flag them before use.
    if (!w10.isPlayoff) w10 = await prisma.week.update({ where: { id: w10.id }, data: { isPlayoff: true } })
    if (!w11.isPlayoff) w11 = await prisma.week.update({ where: { id: w11.id }, data: { isPlayoff: true } })

    const playoffWeekIds = [...new Set([w10.id, w11.id, ...season.weeks.filter(w => w.isPlayoff).map(w => w.id)])]
    const existing = await prisma.match.findMany({
      where: { weekId: { in: playoffWeekIds }, ...(positions ? { tierNumber: { in: positions } } : {}) },
      select: { id: true },
    })
    if (existing.length && !positions) {
      return NextResponse.json(
        { error: 'Playoff matches already exist — DELETE first to regenerate.', existing: existing.length },
        { status: 409 },
      )
    }
    await deletePlayoffMatches(existing.map(m => m.id))

    // Draft start times. Uses the server clock's local hours, same as the
    // original generator — admins correct times in the schedule editor.
    const scheduledFor = (weekDate, hhmm) => {
      const [h, m] = hhmm.split(':').map(Number)
      const d = new Date(weekDate)
      d.setHours(h, m, 0, 0)
      return d
    }
    const weekByKey = { 10: w10, 11: w11 }

    const counts = { qf: 0, sf: 0, final: 0 }
    const byDivision = new Map()
    for (const m of plan) {
      if (!byDivision.has(m.tierNumber)) byDivision.set(m.tierNumber, [])
      byDivision.get(m.tierNumber).push(m)
    }
    for (const shells of byDivision.values()) {
      // Later rounds first so every nextMatchId points at a row that exists.
      const idByKey = {}
      for (const s of [...shells].sort((a, b) => b.roundNumber - a.roundNumber)) {
        const week = weekByKey[s.weekKey]
        const row = await prisma.match.create({
          data: {
            weekId: week.id,
            tierNumber: s.tierNumber,
            roundNumber: s.roundNumber,
            gameOrder: s.gameOrder,
            courtNumber: s.courtNumber,
            scheduledTime: scheduledFor(week.date, s.startTime),
            homeTeamId: s.homeTeamId,
            awayTeamId: s.awayTeamId,
            homeSeedLabel: s.homeSeedLabel,
            awaySeedLabel: s.awaySeedLabel,
            nextMatchId: s.next ? idByKey[s.next.key] : null,
            nextSlot: s.next?.slot ?? null,
            status: 'scheduled',
          },
        })
        idByKey[s.key] = row.id
        counts[s.stage]++
      }
    }

    revalidateLeague(season.league.slug)
    return NextResponse.json({
      success: true,
      counts: { qfs: counts.qf, sfs: counts.sf, finals: counts.final },
    })
  } catch (error) {
    console.error('Generate playoffs error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { id: seasonId } = await params
  try {
    const position = Number.parseInt(new URL(request.url).searchParams.get('position'), 10)
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        league: { select: { slug: true } },
        weeks: {
          where: { OR: [{ weekNumber: { in: PLAYOFF_WEEK_NUMBERS } }, { isPlayoff: true }] },
          select: { id: true },
        },
      },
    })
    if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    const weekIds = season.weeks.map(w => w.id)
    if (!weekIds.length) return NextResponse.json({ success: true, deleted: 0 })

    const matches = await prisma.match.findMany({
      where: { weekId: { in: weekIds }, ...(Number.isInteger(position) ? { tierNumber: position } : {}) },
      select: { id: true },
    })
    await deletePlayoffMatches(matches.map(m => m.id))
    revalidateLeague(season.league.slug)
    return NextResponse.json({ success: true, deleted: matches.length })
  } catch (error) {
    console.error('Delete playoffs error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

/**
 * End-of-season standings — mirrors the logic in lib/server/leagues.js
 * getLeagueStandings, but inlined here so we don't go through the cached
 * wrapper (which we'd want to bust right after). Computes from regular-
 * season weeks 1..9 only, ignoring any playoff weeks.
 */
async function computeEndOfSeasonStandings(seasonId) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      teams: true,
      tiers: { orderBy: { tierNumber: 'asc' } },
      weeks: {
        where: {
          // Defense in depth: weekNumber filter is the authoritative bound,
          // but isPlayoff:false guards against any future week-renumbering
          // that might let a playoff week slip into the standings input.
          weekNumber: { lte: REGULAR_SEASON_WEEKS },
          status: 'completed',
          isPlayoff: false,
        },
        include: {
          matches: {
            where: { status: 'completed' },
            include: { scores: true },
          },
          tierPlacements: { include: { team: true, tier: true } },
        },
      },
    },
  })
  if (!season) return []

  const teamStats = {}
  for (const team of season.teams) {
    teamStats[team.id] = {
      id: team.id, name: team.name,
      setsWon: 0, setsLost: 0, pointDiff: 0,
      basePoints: 0, totalPoints: 0,
    }
  }

  for (const week of season.weeks) {
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
    // Same tier points as the public standings page so playoff seeding always
    // matches what captains see.
    for (const [teamId, data] of Object.entries(weekTeamSets)) {
      if (!teamStats[teamId]) continue
      const factor = tierFactor(data.tierNumber, season.tiers.length)
      teamStats[teamId].basePoints += factor
      teamStats[teamId].totalPoints += factor + data.sets
    }
  }

  return Object.values(teamStats)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      return b.pointDiff - a.pointDiff
    })
    .map((t, i) => ({ ...t, rank: i + 1 }))
}
