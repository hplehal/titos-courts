// Server-only data layer for league queries. Used by both API routes (client
// fetch) and Server Components (initial SSR data). Wrapped in unstable_cache
// with tag-based invalidation so admin writes can bust the cache via
// revalidateTag('league:${slug}:schedule') etc.

import prisma from '@/lib/prisma'
import { unstable_cache, revalidateTag } from 'next/cache'

/* ─── Cache invalidation helpers — called by admin mutation endpoints ─── */

/**
 * Find the league slug for a given weekId (used by admin mutations that only
 * know weekId/matchId) and revalidate all per-league cache tags.
 */
export async function revalidateLeagueByWeek(weekId) {
  if (!weekId) return
  try {
    const week = await prisma.week.findUnique({
      where: { id: weekId },
      select: { season: { select: { league: { select: { slug: true } } } } },
    })
    const slug = week?.season?.league?.slug
    if (slug) revalidateLeague(slug)
  } catch (_error) {/* non-fatal */}
  revalidateTag('results:latest')
}

/**
 * Revalidate all caches tied to a league slug. Called after any write that
 * could change standings, schedules, or latest results.
 */
export function revalidateLeague(slug) {
  if (!slug) return
  revalidateTag(`league:${slug}`)
  revalidateTag(`league:${slug}:schedule`)
  revalidateTag(`league:${slug}:standings`)
  revalidateTag('results:latest')
}

/* ─── League list (homepage, nav, page shells) ─── */
export const getActiveLeagues = unstable_cache(
  async () => {
    return prisma.league.findMany({
      where: { isActive: true },
      select: { slug: true, name: true, dayOfWeek: true },
      orderBy: { createdAt: 'asc' },
    })
  },
  ['active-leagues'],
  { tags: ['leagues'], revalidate: 3600 }, // 1hr; rarely changes
)

/* ─── Schedule for a league (server-rendered on /schedule page) ─── */
export function getLeagueSchedule(slug) {
  return unstable_cache(
    async () => {
      const league = await prisma.league.findUnique({
        where: { slug },
        include: {
          seasons: {
            where: { status: { in: ['active', 'playoffs'] } },
            orderBy: { seasonNumber: 'desc' },
            take: 1,
            include: {
              weeks: {
                orderBy: { weekNumber: 'asc' },
                include: {
                  tierPlacements: {
                    include: {
                      team: { select: { id: true, name: true } },
                      tier: { select: { tierNumber: true, courtNumber: true, timeSlot: true } },
                    },
                  },
                  matches: {
                    include: {
                      homeTeam: { select: { name: true } },
                      awayTeam: { select: { name: true } },
                      refTeam: { select: { name: true } },
                      scores: { orderBy: { setNumber: 'asc' } },
                    },
                    orderBy: [{ tierNumber: 'asc' }, { gameOrder: 'asc' }],
                  },
                },
              },
            },
          },
        },
      })

      if (!league || !league.seasons[0]) return { weeks: [] }
      const season = league.seasons[0]

      const weeks = season.weeks.map(week => {
        const tierGroups = {}
        for (const p of week.tierPlacements) {
          const tn = p.tier.tierNumber
          if (!tierGroups[tn]) tierGroups[tn] = {
            tierNumber: tn,
            courtNumber: p.tier.courtNumber,
            timeSlot: p.tier.timeSlot,
            teams: [],
            matches: [],
          }
          tierGroups[tn].teams.push({ id: p.team.id, name: p.team.name, finishPosition: p.finishPosition, movement: p.movement })
        }
        for (const m of week.matches) {
          if (tierGroups[m.tierNumber]) {
            tierGroups[m.tierNumber].matches.push({
              homeTeam: m.homeTeam?.name,
              awayTeam: m.awayTeam?.name,
              refTeam: m.refTeam?.name,
              scores: m.scores.map(s => `${s.homeScore}-${s.awayScore}`).join(', '),
              status: m.status,
            })
          }
        }
        return {
          id: week.id,
          weekNumber: week.weekNumber,
          date: week.date,
          isPlayoff: week.isPlayoff,
          status: week.status,
          tiers: Object.values(tierGroups).sort((a, b) => a.tierNumber - b.tierNumber),
        }
      })

      return { weeks }
    },
    ['league-schedule', slug],
    { tags: [`league:${slug}:schedule`, `league:${slug}`], revalidate: 300 },
  )()
}

/* ─── Standings + current-tier placements ─── */
export function getLeagueStandings(slug) {
  return unstable_cache(
    async () => {
      const league = await prisma.league.findUnique({
        where: { slug },
        include: {
          seasons: {
            where: { status: { in: ['active', 'playoffs'] } },
            orderBy: { seasonNumber: 'desc' },
            take: 1,
            include: {
              teams: true,
              weeks: {
                where: { status: 'completed' },
                include: {
                  matches: {
                    where: { status: 'completed' },
                    include: { scores: true },
                  },
                  tierPlacements: {
                    include: {
                      team: { select: { id: true, name: true } },
                      tier: { select: { tierNumber: true, courtNumber: true, timeSlot: true } },
                    },
                  },
                },
                orderBy: { weekNumber: 'asc' },
              },
              tiers: { orderBy: { tierNumber: 'asc' } },
            },
          },
        },
      })

      if (!league || !league.seasons[0]) return { standings: [], currentTiers: [] }
      const season = league.seasons[0]

      const teamStats = {}
      for (const team of season.teams) {
        teamStats[team.id] = { id: team.id, name: team.name, setsWon: 0, setsLost: 0, pointDiff: 0, basePoints: 0, totalPoints: 0 }
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
        for (const [teamId, data] of Object.entries(weekTeamSets)) {
          if (teamStats[teamId]) {
            const tierFactor = Math.max(1, 9 - data.tierNumber)
            teamStats[teamId].basePoints += tierFactor
            teamStats[teamId].totalPoints += tierFactor + data.sets
          }
        }
      }

      const standings = Object.values(teamStats)
        .sort((a, b) => b.totalPoints - a.totalPoints || b.pointDiff - a.pointDiff)
        .map((t, i) => ({ ...t, rank: i + 1 }))

      const lastWeek = season.weeks[season.weeks.length - 1]
      const tierMap = {}
      if (lastWeek) {
        for (const p of lastWeek.tierPlacements) {
          const tn = p.tier.tierNumber
          if (!tierMap[tn]) tierMap[tn] = { tierNumber: tn, courtNumber: p.tier.courtNumber, timeSlot: p.tier.timeSlot, teams: [] }
          tierMap[tn].teams.push({ id: p.team.id, name: p.team.name, finishPosition: p.finishPosition, movement: p.movement })
        }
      }
      const currentTiers = Object.values(tierMap).sort((a, b) => a.tierNumber - b.tierNumber)

      return { standings, currentTiers }
    },
    ['league-standings', slug],
    { tags: [`league:${slug}:standings`, `league:${slug}`], revalidate: 300 },
  )()
}

/* ─── Latest results (homepage widget, shared by all leagues) ─── */
export const getLatestResults = unstable_cache(
  async () => {
    const leagues = await prisma.league.findMany({
      where: { isActive: true },
      include: {
        seasons: {
          where: { status: { in: ['active', 'playoffs'] } },
          orderBy: { seasonNumber: 'desc' },
          take: 1,
          include: {
            weeks: {
              where: { status: 'completed' },
              orderBy: { weekNumber: 'desc' },
              take: 1,
              include: {
                tierPlacements: {
                  include: {
                    team: { select: { id: true, name: true } },
                    tier: { select: { tierNumber: true, courtNumber: true, timeSlot: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const results = []
    for (const league of leagues) {
      const season = league.seasons[0]
      if (!season) continue
      const week = season.weeks[0]
      if (!week) continue

      const tiers = {}
      for (const p of week.tierPlacements) {
        const tn = p.tier.tierNumber
        if (!tiers[tn]) tiers[tn] = { tierNumber: tn, courtNumber: p.tier.courtNumber, teams: [] }
        tiers[tn].teams.push({
          id: p.team.id,
          name: p.team.name,
          finishPosition: p.finishPosition,
          movement: p.movement,
        })
      }
      for (const t of Object.values(tiers)) {
        t.teams.sort((a, b) => (a.finishPosition || 99) - (b.finishPosition || 99))
      }

      results.push({
        slug: league.slug,
        name: league.name,
        seasonName: season.name,
        week: {
          weekNumber: week.weekNumber,
          date: week.date,
          tiers: Object.values(tiers).sort((a, b) => a.tierNumber - b.tierNumber),
        },
      })
    }
    return results
  },
  ['latest-results'],
  { tags: ['results:latest'], revalidate: 60 },
)
