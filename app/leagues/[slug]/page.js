import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import LeagueDetailClient from './LeagueDetailClient'
import { getActiveLeagues } from '@/lib/server/leagues'

// ISR — 5 minute revalidation. Admin mutations bust the cache via revalidateTag.
export const revalidate = 300

const LEAGUE_META = {
  'tuesday-coed': {
    label: 'Tuesday Coed',
    blurb: "Our flagship recreational coed volleyball league in Mississauga. 8 tiers, 24 teams, weekly Tuesday matches at Pakmen Courts.",
  },
  'sunday-mens': {
    label: "Sunday Men's",
    blurb: "Competitive men's volleyball league in Mississauga. Tier-based competition with 15 teams playing every Sunday at Pakmen Courts.",
  },
  'thursday-rec-coed': {
    label: 'Thursday Rec Coed',
    blurb: "Thursday recreational coed volleyball at Michael Power High School in Etobicoke. Beginner and intermediate friendly.",
  },
}

export async function generateStaticParams() {
  const leagues = await getActiveLeagues()
  return leagues.map(l => ({ slug: l.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const league = await prisma.league.findUnique({ where: { slug }, select: { name: true } })
  if (!league) return { title: 'League Not Found' }
  const meta = LEAGUE_META[slug]
  const label = meta?.label || league.name
  const title = `${label} Volleyball League Mississauga | Tito's Courts`
  const description = meta?.blurb || `${league.name} at Tito's Courts — recreational volleyball league in Mississauga with tier-based competition, weekly matches, and playoff championships.`
  return {
    title,
    description,
    alternates: { canonical: `https://titoscourts.com/leagues/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://titoscourts.com/leagues/${slug}`,
      type: 'website',
      images: ['/images/titosHero.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/titosHero.jpg'],
    },
  }
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
    teamStats[team.id] = { id: team.id, name: team.name, slug: team.slug, setsWon: 0, setsLost: 0, pointDiff: 0, basePoints: 0, totalPoints: 0, weeksPlayed: 0 }
  }

  for (const week of season.weeks) {
    if (week.status !== 'completed') continue
    // Skip Week 1 (placement) — doesn't count toward standings
    if (week.weekNumber === 1) continue
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
        // Tier 1 = 8 base points, Tier 2 = 7, ... Tier 8 = 1
        const tierFactor = Math.max(1, 9 - data.tierNumber)
        teamStats[teamId].basePoints += tierFactor
        teamStats[teamId].totalPoints += tierFactor + data.sets
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
