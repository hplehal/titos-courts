// Server-only data layer for the league playoff bracket page.
// Wrapped in unstable_cache with tag-based invalidation so score writes
// (which call revalidateLeague) bust this immediately.

import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

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
                // Playoff matches live in isPlayoff weeks. Filtering by flag
                // (not hardcoded week numbers) keeps the COED two-week split
                // and the MENS single-night W11 playoff both correct, and
                // never pulls a regular round-robin week into the bracket.
                where: { isPlayoff: true },
                orderBy: { weekNumber: 'asc' },
                include: {
                  matches: {
                    orderBy: [{ tierNumber: 'asc' }, { roundNumber: 'asc' }, { gameOrder: 'asc' }],
                    include: {
                      homeTeam: { select: { id: true, name: true } },
                      awayTeam: { select: { id: true, name: true } },
                      refTeam: { select: { id: true, name: true } },
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

      // Week metadata for the legend strip + column subheaders.
      const weekMeta = {}
      for (const w of season.weeks) {
        weekMeta[w.weekNumber] = { id: w.id, weekNumber: w.weekNumber, date: w.date, status: w.status }
      }

      return {
        league: { slug: league.slug, name: league.name },
        season: { id: season.id, name: season.name },
        divisions,
        weeks: weekMeta,
        hasPlayoffs: allMatches.length > 0,
      }
    },
    ['league-playoffs', slug],
    { tags: [`league:${slug}:playoffs`, `league:${slug}`], revalidate: 60 },
  )()
}
