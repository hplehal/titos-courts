// Server-only data layer for the league playoff bracket page.
// Wrapped in unstable_cache with tag-based invalidation so score writes
// (which call revalidateLeague) bust this immediately.

import prisma from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { DIVISION_NAMES } from '@/lib/league/seasonConfig'

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
              divisions: { select: { position: true, courtNumber: true } },
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
                    // refSeedLabel + seed labels come through automatically
                    // (scalar fields) — no explicit select needed with include.
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

      // Group by division (tierNumber = division position, 1=Diamond). Only
      // divisions with matches are returned, and each carries whatever
      // bracket the admin built — sizes can differ per division.
      const tiers = [...new Set(allMatches.map(m => m.tierNumber))].sort((a, b) => a - b)
      const divisions = tiers.map(tier => {
        const matches = allMatches.filter(m => m.tierNumber === tier)
        const stored = season.divisions.find(d => d.position === tier)
        return {
          tier,
          name: DIVISION_NAMES[tier - 1] || `Division ${tier}`,
          court: stored?.courtNumber ?? matches[0]?.courtNumber ?? null,
          matches,
        }
      })

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
