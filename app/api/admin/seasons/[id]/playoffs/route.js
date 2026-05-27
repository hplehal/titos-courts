// Admin endpoint that generates the league playoff bracket for a season.
//
// POST   /api/admin/seasons/[id]/playoffs
//   Body: { kickoff?: ISO8601 string for W10 start time }
//   1. Verifies the regular season is complete (W1-W9 all status=completed)
//   2. Computes end-of-season standings via the same logic the public
//      /standings page uses
//   3. Partitions into 4 divisions (Diamond/Platinum/Gold/Silver, 6 each)
//   4. Creates 20 Match shells across W10 (8 QFs) and W11 (8 SFs + 4 Finals)
//      with the nextMatchId chain wired so winners auto-advance.
//   Refuses if playoff matches already exist for the season (admin must
//   DELETE first to regenerate).
//
// DELETE /api/admin/seasons/[id]/playoffs
//   Wipes every Match row in playoff weeks (W10 + W11) for the season.
//   Cascades SetScores. Used for "regenerate playoffs" workflow.

import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidateLeague } from '@/lib/server/leagues'
import { buildPlayoffPlan } from '@/lib/league/generatePlayoffBracket'

export const dynamic = 'force-dynamic'

const REGULAR_SEASON_WEEKS = 9
const PLAYOFF_WEEK_NUMBERS = [10, 11]

export async function POST(request, { params }) {
  const { id: seasonId } = await params
  try {
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        league: { select: { slug: true } },
        weeks: { orderBy: { weekNumber: 'asc' } },
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
    const existing = await prisma.match.count({
      where: { weekId: { in: [w10.id, w11.id] } },
    })
    if (existing > 0) {
      return NextResponse.json(
        { error: 'Playoff matches already exist — DELETE first to regenerate.', existing },
        { status: 409 },
      )
    }

    // End-of-season standings (rank 1..N, includes all 24 teams)
    const standings = await computeEndOfSeasonStandings(seasonId)
    if (standings.length < 6) {
      return NextResponse.json(
        { error: `Need at least 6 teams in the season; have ${standings.length}.` },
        { status: 400 },
      )
    }

    // Build the plan
    const plan = buildPlayoffPlan(
      standings.map(s => ({ teamId: s.id, name: s.name, rank: s.rank })),
    )

    // Schedule times — Tuesday COED runs 10 PM-12 AM. W10 matches play
    // sequentially on their division court (one QF per hour). W11 squeezes
    // SF1, SF2, and Final into the same 2-hour window; Final tips at
    // 11 PM-12 AM per the captain's spec.
    const scheduledFor = (weekDate, hhmm) => {
      const [h, m] = hhmm.split(':').map(Number)
      const d = new Date(weekDate)
      d.setHours(h, m, 0, 0)
      return d
    }
    const w10Time = (gameOrder) => scheduledFor(w10.date, gameOrder === 1 ? '22:00' : '23:00')
    const w11Time = (stage, _gameOrder) => {
      // W11 schedule: BOTH SFs tip at 10:00 PM on separate courts so they
      // can both finish before the Final at 11:00 PM. Admin assigns the
      // SF2 court once the extra W11 booking is confirmed.
      if (stage === 'final') return scheduledFor(w11.date, '23:00')
      return scheduledFor(w11.date, '22:00')
    }

    // Persist in dependency order: Finals first, then SFs (pointing at
    // Finals), then QFs (pointing at SFs by gameOrder — advancement
    // re-balances SF assignment at runtime via the reseed rule).
    const created = { qfs: [], sfs: [], finals: [] }

    // Group plan by division (in original order: Diamond, Platinum, Gold, Silver)
    const byDivision = {}
    for (const m of plan) {
      if (!byDivision[m.divisionName]) byDivision[m.divisionName] = []
      byDivision[m.divisionName].push(m)
    }

    for (const [divName, matches] of Object.entries(byDivision)) {
      // Final first
      const finalPlan = matches.find(m => m.stage === 'final')
      const finalRow = await prisma.match.create({
        data: {
          weekId: w11.id,
          tierNumber: finalPlan.tierNumber,
          roundNumber: finalPlan.roundNumber,
          gameOrder: finalPlan.gameOrder,
          courtNumber: finalPlan.courtNumber,
          scheduledTime: w11Time('final', finalPlan.gameOrder),
          homeTeamId: null,
          awayTeamId: null,
          homeSeedLabel: finalPlan.homeSeedLabel,
          awaySeedLabel: finalPlan.awaySeedLabel,
          status: 'scheduled',
        },
      })
      created.finals.push(finalRow.id)

      // Two SFs pointing at the Final
      const sfPlans = matches.filter(m => m.stage === 'sf').sort((a, b) => a.gameOrder - b.gameOrder)
      const sfIds = []
      for (const sfp of sfPlans) {
        const sfRow = await prisma.match.create({
          data: {
            weekId: w11.id,
            tierNumber: sfp.tierNumber,
            roundNumber: sfp.roundNumber,
            gameOrder: sfp.gameOrder,
            courtNumber: sfp.courtNumber,
            scheduledTime: w11Time('sf', sfp.gameOrder),
            homeTeamId: sfp.homeTeamId,
            awayTeamId: sfp.awayTeamId,
            homeSeedLabel: sfp.homeSeedLabel,
            awaySeedLabel: sfp.awaySeedLabel,
            nextMatchId: finalRow.id,
            status: 'scheduled',
          },
        })
        sfIds.push(sfRow.id)
        created.sfs.push(sfRow.id)
      }

      // Two QFs each wired to one SF (by gameOrder, will rebalance at advance)
      const qfPlans = matches.filter(m => m.stage === 'qf').sort((a, b) => a.gameOrder - b.gameOrder)
      for (let i = 0; i < qfPlans.length; i++) {
        const qp = qfPlans[i]
        const qfRow = await prisma.match.create({
          data: {
            weekId: w10.id,
            tierNumber: qp.tierNumber,
            roundNumber: qp.roundNumber,
            gameOrder: qp.gameOrder,
            courtNumber: qp.courtNumber,
            scheduledTime: w10Time(qp.gameOrder),
            homeTeamId: qp.homeTeamId,
            awayTeamId: qp.awayTeamId,
            homeSeedLabel: qp.homeSeedLabel,
            awaySeedLabel: qp.awaySeedLabel,
            nextMatchId: sfIds[i] ?? null,
            status: 'scheduled',
          },
        })
        created.qfs.push(qfRow.id)
      }
    }

    revalidateLeague(season.league.slug)
    return NextResponse.json({
      success: true,
      counts: { qfs: created.qfs.length, sfs: created.sfs.length, finals: created.finals.length },
    })
  } catch (error) {
    console.error('Generate playoffs error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate' }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  const { id: seasonId } = await params
  try {
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        league: { select: { slug: true } },
        weeks: { where: { weekNumber: { in: PLAYOFF_WEEK_NUMBERS } }, select: { id: true } },
      },
    })
    if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    const weekIds = season.weeks.map(w => w.id)
    if (!weekIds.length) return NextResponse.json({ success: true, deleted: 0 })

    const matches = await prisma.match.findMany({ where: { weekId: { in: weekIds } }, select: { id: true } })
    const matchIds = matches.map(m => m.id)
    if (matchIds.length) {
      await prisma.$transaction([
        prisma.setScore.deleteMany({ where: { matchId: { in: matchIds } } }),
        // Null nextMatchId before delete so self-FK doesn't bite
        prisma.match.updateMany({ where: { id: { in: matchIds } }, data: { nextMatchId: null } }),
        prisma.match.deleteMany({ where: { id: { in: matchIds } } }),
      ])
    }
    revalidateLeague(season.league.slug)
    return NextResponse.json({ success: true, deleted: matchIds.length })
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
          weekNumber: { lte: REGULAR_SEASON_WEEKS },
          status: 'completed',
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
    // Tier-factor scoring: bottom tier = 1 point, each tier up adds the
    // total tier count.
    const maxTier = Math.max(...Object.values(weekTeamSets).map(d => d.tierNumber || 1), 1)
    for (const [teamId, data] of Object.entries(weekTeamSets)) {
      if (!teamStats[teamId]) continue
      const tierFactor = (maxTier - (data.tierNumber || 1)) + 1
      teamStats[teamId].basePoints += tierFactor
      teamStats[teamId].totalPoints += tierFactor + data.sets
    }
  }

  return Object.values(teamStats)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      return b.pointDiff - a.pointDiff
    })
    .map((t, i) => ({ ...t, rank: i + 1 }))
}
