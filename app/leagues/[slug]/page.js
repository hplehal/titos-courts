import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import LeagueDetailClient from './LeagueDetailClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const league = await prisma.league.findUnique({ where: { slug } })
  if (!league) return { title: 'League Not Found' }
  return { title: league.name }
}

async function getLeagueData(slug) {
  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      seasons: {
        where: { status: { in: ['active', 'playoffs'] } },
        orderBy: { seasonNumber: 'desc' },
        take: 1,
        include: {
          teams: { orderBy: { name: 'asc' } },
          tiers: { orderBy: { tierNumber: 'asc' } },
          weeks: {
            orderBy: { weekNumber: 'asc' },
            include: {
              matches: {
                include: {
                  homeTeam: { select: { id: true, name: true, slug: true } },
                  awayTeam: { select: { id: true, name: true, slug: true } },
                  refTeam: { select: { id: true, name: true } },
                  scores: { orderBy: { setNumber: 'asc' } },
                },
                orderBy: [{ tierNumber: 'asc' }, { gameOrder: 'asc' }],
              },
              tierPlacements: {
                include: {
                  team: { select: { id: true, name: true, slug: true } },
                  tier: { select: { tierNumber: true, courtNumber: true, timeSlot: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!league) return null

  const season = league.seasons[0]
  if (!season) return { league, season: null, standings: [], weeks: [] }

  // Compute standings
  const teamStats = {}
  for (const team of season.teams) {
    teamStats[team.id] = { id: team.id, name: team.name, slug: team.slug, setsWon: 0, setsLost: 0, pointDiff: 0, totalPoints: 0, weeksPlayed: 0 }
  }

  for (const week of season.weeks) {
    if (week.status !== 'completed') continue
    const weekTeamSets = {}

    for (const match of week.matches) {
      if (match.status !== 'completed') continue
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
        const base = data.tierNumber <= 4 ? 10 : 9
        teamStats[teamId].totalPoints += base + data.sets
        teamStats[teamId].weeksPlayed++
      }
    }
  }

  const standings = Object.values(teamStats)
    .sort((a, b) => b.totalPoints - a.totalPoints || b.pointDiff - a.pointDiff)
    .map((t, i) => ({ ...t, rank: i + 1 }))

  return { league, season, standings, weeks: season.weeks }
}

export default async function LeagueDetailPage({ params }) {
  const { slug } = await params
  const data = await getLeagueData(slug)
  if (!data) notFound()
  return <LeagueDetailClient data={data} />
}
