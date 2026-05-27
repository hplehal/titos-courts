// Server-only data layer for the league playoff bracket page.
// Wrapped in unstable_cache with tag-based invalidation so score writes
// (which call revalidateLeague) bust this immediately.

import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

const PLAYOFF_WEEK_NUMBERS = [10, 11]

const DIVISION_NAME_BY_TIER = {
  1: 'Diamond',
  2: 'Platinum',
  3: 'Gold',
  4: 'Silver',
}

export function getLeaguePlayoffs(slug) {
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
                where: { weekNumber: { in: PLAYOFF_WEEK_NUMBERS } },
                orderBy: { weekNumber: 'asc' },
                include: {
                  matches: {
                    orderBy: [{ tierNumber: 'asc' }, { roundNumber: 'asc' }, { gameOrder: 'asc' }],
                    include: {
                      homeTeam: { select: { id: true, name: true } },
                      awayTeam: { select: { id: true, name: true } },
                      scores: { orderBy: { setNumber: 'asc' } },
                    },
                  },
                },
              },
            },
          },
        },
      })
      if (!league || !league.seasons[0]) {
        return { league: null, season: null, divisions: [] }
      }
      const season = league.seasons[0]
      const allMatches = season.weeks.flatMap(w => w.matches.map(m => ({ ...m, weekNumber: w.weekNumber })))

      // Group by division (tierNumber 1-4). Each division gets its 5
      // bracket slots (2 QF, 2 SF, 1 Final) keyed by roundNumber+gameOrder.
      const divisions = [1, 2, 3, 4].map(tier => {
        const matches = allMatches.filter(m => m.tierNumber === tier)
        return {
          tier,
          name: DIVISION_NAME_BY_TIER[tier],
          court: matches[0]?.courtNumber ?? null,
          matches,
        }
      }).filter(d => d.matches.length > 0)

      return {
        league: { slug: league.slug, name: league.name },
        season: { id: season.id, name: season.name },
        divisions,
        hasPlayoffs: allMatches.length > 0,
      }
    },
    ['league-playoffs', slug],
    { tags: [`league:${slug}:playoffs`, `league:${slug}`], revalidate: 60 },
  )()
}
