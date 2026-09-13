// Server helpers for the league playoff bracket: the admin draft builder
// (app/api/admin/seasons/[id]/playoffs) and the schedule editor
// (…/playoffs/matches). Validation lives here so both routes agree on what a
// playoff match may look like.

import prisma from '@/lib/prisma'
import { DIVISION_NAMES } from '@/lib/league/seasonConfig'

const SLOTS = ['home', 'away']
const MAX_LABEL = 40

/** Delete playoff matches: scores first, then every link into or out of them. */
export async function deletePlayoffMatches(matchIds) {
  if (!matchIds.length) return
  await prisma.$transaction([
    prisma.setScore.deleteMany({ where: { matchId: { in: matchIds } } }),
    // Keep any per-match player stats (they're also recorded per week).
    prisma.playerStat.updateMany({ where: { matchId: { in: matchIds } }, data: { matchId: null } }),
    prisma.match.updateMany({
      where: { OR: [{ id: { in: matchIds } }, { nextMatchId: { in: matchIds } }] },
      data: { nextMatchId: null, nextSlot: null },
    }),
    prisma.match.deleteMany({ where: { id: { in: matchIds } } }),
  ])
}

/**
 * Everything the schedule editor needs for one season: playoff weeks, the
 * season's teams, stored division rows and every playoff match.
 * Returns null when the season doesn't exist.
 */
export async function loadPlayoffContext(seasonId) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      league: { select: { slug: true, name: true } },
      teams: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
      divisions: { orderBy: { position: 'asc' } },
      weeks: {
        where: { isPlayoff: true },
        orderBy: { weekNumber: 'asc' },
        select: { id: true, weekNumber: true, date: true, status: true },
      },
    },
  })
  if (!season) return null
  const matches = await prisma.match.findMany({
    where: { weekId: { in: season.weeks.map(w => w.id) } },
    orderBy: [{ tierNumber: 'asc' }, { roundNumber: 'asc' }, { gameOrder: 'asc' }],
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      refTeam: { select: { id: true, name: true } },
      scores: { orderBy: { setNumber: 'asc' } },
    },
  })
  return { season, weeks: season.weeks, teams: season.teams, matches }
}

const toInt = v => (v === null || v === undefined || v === '' ? NaN : Number.parseInt(v, 10))
const blankToNull = v => (v === '' || v === undefined ? null : v)

/**
 * Validate an editor write against the season context. Only keys present in
 * `body` are returned, so a PATCH touches just what the admin changed.
 * @returns {{ data: object } | { error: string }}
 */
export function parsePlayoffMatchInput(body, ctx, { matchId = null } = {}) {
  const has = key => Object.prototype.hasOwnProperty.call(body, key)
  const data = {}

  if (has('tierNumber')) {
    const n = toInt(body.tierNumber)
    if (!(n >= 1 && n <= DIVISION_NAMES.length)) return { error: 'Pick a division' }
    data.tierNumber = n
  }
  if (has('weekId')) {
    if (!ctx.weeks.some(w => w.id === body.weekId)) return { error: 'Pick a playoff week' }
    data.weekId = body.weekId
  }
  if (has('roundNumber')) {
    const n = toInt(body.roundNumber)
    if (!(n >= 1 && n <= 3)) return { error: 'Round must be QF, SF or Final' }
    data.roundNumber = n
  }
  if (has('gameOrder')) {
    const n = toInt(body.gameOrder)
    if (!(n >= 1)) return { error: 'Game # must be 1 or more' }
    data.gameOrder = n
  }
  if (has('courtNumber')) {
    const v = blankToNull(body.courtNumber)
    const n = toInt(v)
    if (v !== null && !(n >= 1 && n <= 99)) return { error: 'Court must be a number' }
    data.courtNumber = v === null ? null : n
  }
  if (has('scheduledTime')) {
    const v = blankToNull(body.scheduledTime)
    const d = v === null ? null : new Date(v)
    if (d && Number.isNaN(d.getTime())) return { error: 'Invalid start time' }
    data.scheduledTime = d
  }
  for (const key of ['homeTeamId', 'awayTeamId', 'refTeamId']) {
    if (!has(key)) continue
    const v = blankToNull(body[key])
    if (v !== null && !ctx.teams.some(t => t.id === v)) return { error: 'That team is not in this season' }
    data[key] = v
  }
  for (const key of ['homeSeedLabel', 'awaySeedLabel', 'refSeedLabel']) {
    if (!has(key)) continue
    const v = body[key] == null ? '' : String(body[key]).trim()
    if (v.length > MAX_LABEL) return { error: `Labels must be ${MAX_LABEL} characters or fewer` }
    data[key] = v || null
  }
  // Winner wiring. nextSlot null = "auto" (legacy QF→SF reseed / first empty side).
  if (has('nextMatchId')) {
    const next = blankToNull(body.nextMatchId)
    const slot = blankToNull(body.nextSlot) ?? null
    if (next === null) {
      data.nextMatchId = null
      data.nextSlot = null
    } else {
      if (next === matchId || !ctx.matches.some(m => m.id === next)) {
        return { error: 'The winner must go to another playoff match in this season' }
      }
      if (slot !== null && !SLOTS.includes(slot)) return { error: 'Winner side must be home, away or auto' }
      data.nextMatchId = next
      data.nextSlot = slot
    }
  }
  return { data }
}
