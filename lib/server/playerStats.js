// Server-only data layer for player stats. Mirrors the lib/server/leagues.js
// pattern: unstable_cache wrapper with tag-based invalidation, so admin
// import writes can bust the public stats page via revalidateLeagueStats(slug).

import prisma from '@/lib/prisma'
import { unstable_cache, revalidateTag } from 'next/cache'

/* ─── Invalidation helper — called by the import API ─── */
export function revalidateLeagueStats(slug) {
  if (!slug) return
  revalidateTag(`league:${slug}:stats`)
}

/* ─── Stats roll-up for a league (server-rendered on /stats/[slug]) ─── */
export function getLeagueStats(slug) {
  return unstable_cache(
    async () => {
      const league = await prisma.league.findUnique({
        where: { slug },
        include: {
          seasons: {
            where: { status: { in: ['active', 'playoffs', 'completed'] } },
            orderBy: { seasonNumber: 'desc' },
            take: 1,
            include: {
              teams: {
                include: {
                  players: {
                    include: {
                      stats: {
                        where: { weekId: { not: null } },
                        include: {
                          week: { select: { id: true, weekNumber: true, status: true, date: true } },
                        },
                      },
                    },
                  },
                },
              },
              weeks: {
                orderBy: { weekNumber: 'asc' },
                select: { id: true, weekNumber: true, status: true, date: true },
              },
            },
          },
        },
      })

      if (!league || !league.seasons[0]) {
        return { league: null, season: null, weeks: [], players: [], teams: [] }
      }

      const season = league.seasons[0]

      // Flatten into player rows with totals + per-week breakdown.
      const players = []
      for (const team of season.teams) {
        for (const player of team.players) {
          const totals = { kills: 0, assists: 0, digs: 0, aces: 0, blocks: 0, errors: 0 }
          const byWeek = {}
          let gamesPlayed = 0
          for (const s of player.stats) {
            totals.kills += s.kills
            totals.assists += s.assists
            totals.digs += s.digs
            totals.aces += s.aces
            totals.blocks += s.blocks
            totals.errors += s.errors
            byWeek[s.week.weekNumber] = {
              kills: s.kills, assists: s.assists, digs: s.digs, aces: s.aces, blocks: s.blocks,
              status: s.week.status,
            }
            // A "game played" = any week where the player has at least one tracked stat.
            if (s.kills + s.assists + s.digs + s.aces + s.blocks > 0) gamesPlayed++
          }
          players.push({
            id: player.id,
            name: player.name,
            jerseyNumber: player.jerseyNumber,
            teamId: team.id,
            teamName: team.name,
            totals,
            byWeek,
            gamesPlayed,
          })
        }
      }

      // Roll up to team totals so the page can show team leaderboards too.
      const teamsMap = {}
      for (const t of season.teams) {
        teamsMap[t.id] = {
          id: t.id, name: t.name,
          kills: 0, assists: 0, digs: 0, aces: 0, blocks: 0,
        }
      }
      for (const p of players) {
        const t = teamsMap[p.teamId]
        if (!t) continue
        t.kills += p.totals.kills
        t.assists += p.totals.assists
        t.digs += p.totals.digs
        t.aces += p.totals.aces
        t.blocks += p.totals.blocks
      }

      return {
        league: { slug: league.slug, name: league.name },
        season: { id: season.id, name: season.name, seasonNumber: season.seasonNumber, status: season.status },
        weeks: season.weeks,
        players,
        teams: Object.values(teamsMap),
      }
    },
    ['league-stats', slug],
    { tags: [`league:${slug}:stats`, `league:${slug}`], revalidate: 300 },
  )()
}
