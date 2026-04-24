// Server-only data layer for tournament queries. Mirrors lib/server/leagues.js
// pattern: unstable_cache + tag-based revalidation. Admin mutations call
// revalidateTournament(slug) after any write to bust stale caches.

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import prisma from '@/lib/prisma'
import { unstable_cache, revalidateTag } from 'next/cache'
import { MATCH_STATUS } from '@/lib/tournament/constants'
import { computeStandingsFromMatches } from '@/lib/tournament/calculateStandings'

/**
 * Look up a slug-conventioned hero image at `public/images/tournaments/<slug>.{jpg,jpeg,png,webp}`.
 * Returns the public URL (e.g. "/images/tournaments/easter-classic.jpg") or null if
 * no matching file is on disk. Cheap filesystem stat — acceptable in server components
 * and inside `unstable_cache` (which memoizes the result).
 */
function findTournamentImage(slug) {
  if (!slug) return null
  const dir = join(process.cwd(), 'public', 'images', 'tournaments')
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const rel = `${slug}.${ext}`
    if (existsSync(join(dir, rel))) return `/images/tournaments/${rel}`
  }
  return null
}

/* ─── Cache invalidation helpers ─── */

/**
 * Revalidate all caches tied to a tournament slug.
 * Called after any admin write (score entry, team assignment, bracket gen).
 */
export function revalidateTournament(slug) {
  if (!slug) return
  revalidateTag(`tournament:${slug}`)
  revalidateTag(`tournament:${slug}:bracket`)
  revalidateTag('tournaments')
}

/** Look up slug from a matchId and revalidate — used when mutations only know the match id. */
export async function revalidateTournamentByMatch(matchId) {
  if (!matchId) return
  try {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: {
        pool: { select: { tournament: { select: { slug: true } } } },
        bracket: { select: { tournament: { select: { slug: true } } } },
      },
    })
    const slug = match?.pool?.tournament?.slug ?? match?.bracket?.tournament?.slug
    if (slug) revalidateTournament(slug)
  } catch (_error) { /* non-fatal */ }
}

/* ─── Tournament list (public /tournaments page + nav) ─── */

export const getAllTournaments = unstable_cache(
  async () => {
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        date: true,
        endDate: true,
        venue: true,
        status: true,
        description: true,
        pools: {
          select: {
            matches: { select: { status: true } },
          },
        },
        brackets: {
          select: {
            matches: { select: { status: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Derive a "hasLiveMatch" rollup so the list page can show a LIVE badge.
    return tournaments.map(t => {
      const poolMatches = t.pools.flatMap(p => p.matches)
      const bracketMatches = t.brackets.flatMap(b => b.matches)
      const allMatches = [...poolMatches, ...bracketMatches]
      const hasLiveMatch = allMatches.some(m => m.status === MATCH_STATUS.LIVE)
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        date: t.date,
        endDate: t.endDate,
        venue: t.venue,
        status: t.status,
        description: t.description,
        imageUrl: findTournamentImage(t.slug),
        hasLiveMatch,
      }
    })
  },
  ['all-tournaments'],
  { tags: ['tournaments'], revalidate: 60 },
)

/* ─── Tournament hub (public /tournaments/[slug]) ─── */

export function getTournamentHub(slug) {
  return unstable_cache(
    async () => {
      const t = await prisma.tournament.findUnique({
        where: { slug },
        include: {
          tournamentTeams: { orderBy: { name: 'asc' } },
          pools: {
            orderBy: { name: 'asc' },
            include: {
              teams: { select: { id: true, name: true, seed: true } },
              matches: {
                orderBy: [{ roundNumber: 'asc' }, { gameOrder: 'asc' }, { id: 'asc' }],
                include: {
                  homeTeam: { select: { id: true, name: true } },
                  awayTeam: { select: { id: true, name: true } },
                  refTeam: { select: { id: true, name: true } },
                  scores: { orderBy: { setNumber: 'asc' } },
                },
              },
            },
          },
          // Brackets are rendered inline on the hub once generated — so
          // pull them with the same shape the standalone bracket page uses.
          brackets: {
            orderBy: { division: 'asc' },
            include: {
              matches: {
                orderBy: [{ bracketRound: 'asc' }, { bracketPosition: 'asc' }],
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
      })
      if (!t) return null

      // Attach computed standings to each pool
      const poolsWithStandings = t.pools.map(pool => ({
        ...pool,
        standings: computeStandingsFromMatches(pool.teams, pool.matches),
      }))

      // Find a live match to spotlight, if any
      const liveMatch = poolsWithStandings
        .flatMap(p => p.matches.map(m => ({ ...m, poolName: p.name })))
        .find(m => m.status === MATCH_STATUS.LIVE) ?? null

      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        date: t.date,
        endDate: t.endDate,
        venue: t.venue,
        description: t.description,
        status: t.status,
        poolSize: t.poolSize,
        poolCount: t.poolCount,
        imageUrl: findTournamentImage(t.slug),
        tournamentTeams: t.tournamentTeams,
        pools: poolsWithStandings,
        brackets: t.brackets,
        liveMatch,
      }
    },
    ['tournament-hub', slug],
    { tags: [`tournament:${slug}`, 'tournaments'], revalidate: 30 },
  )()
}

/* ─── Tournament bracket (public /tournaments/[slug]/bracket) ─── */

export function getTournamentBracket(slug) {
  return unstable_cache(
    async () => {
      const t = await prisma.tournament.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          brackets: {
            orderBy: { division: 'asc' },
            include: {
              matches: {
                orderBy: [{ bracketRound: 'asc' }, { bracketPosition: 'asc' }],
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
      })
      if (!t) return null
      return t
    },
    ['tournament-bracket', slug],
    { tags: [`tournament:${slug}:bracket`, `tournament:${slug}`, 'tournaments'], revalidate: 30 },
  )()
}
