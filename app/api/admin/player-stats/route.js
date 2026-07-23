// Admin endpoint for bulk-importing player stats from the league master sheet.
//
// POST  /api/admin/player-stats?action=preview
//   { leagueSlug, weekNumber, paste }  →  parses + matches teams/players,
//   returns a preview of rows so admin can review before committing.
//
// POST  /api/admin/player-stats?action=commit
//   { leagueSlug, weekNumber, rows }   →  upserts Player records, writes
//   PlayerStat rows (one per player per week), busts the cache tag.
//
// GET   /api/admin/player-stats?leagueSlug=…
//   Lists the season's teams + players + tracked weeks (used by admin UI
//   to populate the league/week selectors).

import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidateLeagueStats } from '@/lib/server/playerStats'
import { revalidateLeague } from '@/lib/server/leagues'

export const dynamic = 'force-dynamic'

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

// Match a team name from the pasted sheet to the canonical DB name.
// The sheet uses ALL-CAPS and short variants ("KNIGHT OWLS") that the DB
// stores as "The Knight Owls". Strip articles/common words and lower-case
// both sides before comparing.
function normalizeTeamName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function findMatchingTeam(pastedName, teams) {
  const target = normalizeTeamName(pastedName)
  if (!target) return null
  // Exact normalized match first, then substring (so "KNIGHT OWLS" → "The Knight Owls").
  let m = teams.find(t => normalizeTeamName(t.name) === target)
  if (m) return m
  m = teams.find(t => normalizeTeamName(t.name).includes(target) || target.includes(normalizeTeamName(t.name)))
  return m || null
}

// Parse the pasted blob. The sheet copies as tab-separated. Acceptable formats:
//   1. TSV with header row: Team\tPlayer\t#\tKills\tAssists\tDigs\tAces\tBlocks
//   2. Same as above, no header (first column = team, second = player, etc.)
// Lines starting with `#` or empty lines are skipped. The jersey column (#) is
// optional — if missing, we shift columns left.
function parsePaste(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  if (lines.length === 0) return { rows: [], errors: ['paste is empty'] }

  const rows = []
  const errors = []

  // Detect header: first row contains the word "player" or "kills" anywhere.
  const isHeader = /player|kills|assists|aces|blocks/i.test(lines[0])
  const dataLines = isHeader ? lines.slice(1) : lines

  for (const [i, line] of dataLines.entries()) {
    const cells = line.split('\t').map(c => c.trim())
    if (cells.length < 6) {
      errors.push(`row ${i + 1}: needs at least 6 columns (team, player, #, kills, assists, digs, aces, blocks)`)
      continue
    }
    let [team, player, jersey, kills, assists, digs, aces, blocks] = cells
    // If jersey isn't numeric, assume the column is missing.
    if (jersey && !/^\d+$/.test(jersey)) {
      blocks = aces; aces = digs; digs = assists; assists = kills; kills = jersey; jersey = ''
    }
    const num = (s) => {
      const n = parseInt(s, 10)
      return Number.isFinite(n) && n >= 0 ? n : 0
    }
    rows.push({
      team,
      player,
      jerseyNumber: jersey ? parseInt(jersey, 10) : null,
      kills: num(kills),
      assists: num(assists),
      digs: num(digs),
      aces: num(aces),
      blocks: num(blocks),
    })
  }

  return { rows, errors }
}

/* ──────────────────────────────────────────────────────────────
   GET — list teams + players + weeks for the admin UI selectors
   ────────────────────────────────────────────────────────────── */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const leagueSlug = searchParams.get('leagueSlug')
  if (!leagueSlug) return NextResponse.json({ error: 'leagueSlug required' }, { status: 400 })

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    include: {
      seasons: {
        where: { status: { in: ['active', 'playoffs'] } },
        orderBy: { seasonNumber: 'desc' },
        take: 1,
        include: {
          teams: { include: { players: { select: { id: true, name: true } } } },
          weeks: { orderBy: { weekNumber: 'asc' }, select: { id: true, weekNumber: true, status: true, date: true } },
        },
      },
    },
  })
  if (!league || !league.seasons[0]) {
    return NextResponse.json({ error: 'No active season for that league' }, { status: 404 })
  }
  const season = league.seasons[0]
  return NextResponse.json({
    league: { slug: league.slug, name: league.name },
    season: { id: season.id, name: season.name },
    teams: season.teams.map(t => ({ id: t.id, name: t.name, players: t.players })),
    weeks: season.weeks,
  })
}

/* ──────────────────────────────────────────────────────────────
   POST — preview or commit
   ────────────────────────────────────────────────────────────── */
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'preview'
    const body = await request.json()
    const { leagueSlug, weekNumber } = body
    if (!leagueSlug || !weekNumber) {
      return NextResponse.json({ error: 'leagueSlug + weekNumber required' }, { status: 400 })
    }

    // Resolve season + week + teams.
    const league = await prisma.league.findUnique({
      where: { slug: leagueSlug },
      include: {
        seasons: {
          where: { status: { in: ['active', 'playoffs'] } },
          orderBy: { seasonNumber: 'desc' },
          take: 1,
          include: {
            teams: { include: { players: true } },
            weeks: { where: { weekNumber: parseInt(weekNumber, 10) }, take: 1 },
          },
        },
      },
    })
    const season = league?.seasons?.[0]
    const week = season?.weeks?.[0]
    if (!season) return NextResponse.json({ error: 'No active season' }, { status: 404 })
    if (!week) return NextResponse.json({ error: `Week ${weekNumber} not found in season` }, { status: 404 })

    if (action === 'preview') {
      const { rows, errors } = parsePaste(body.paste || '')
      // Try to match each row to a team + existing player.
      const matched = rows.map(r => {
        const team = findMatchingTeam(r.team, season.teams)
        const existingPlayer = team
          ? team.players.find(p => p.name.toLowerCase().trim() === r.player.toLowerCase().trim())
          : null
        return {
          ...r,
          teamMatch: team ? { id: team.id, name: team.name } : null,
          playerMatch: existingPlayer ? { id: existingPlayer.id, name: existingPlayer.name } : null,
          willCreate: !!team && !existingPlayer,
        }
      })
      return NextResponse.json({
        rows: matched,
        errors,
        unmatchedTeams: [...new Set(matched.filter(r => !r.teamMatch).map(r => r.team))],
        week: { id: week.id, weekNumber: week.weekNumber },
      })
    }

    if (action === 'commit') {
      const rows = Array.isArray(body.rows) ? body.rows : []
      if (!rows.length) return NextResponse.json({ error: 'no rows to commit' }, { status: 400 })

      let created = 0, updated = 0, skipped = 0
      const skippedReasons = []

      for (const row of rows) {
        // Re-resolve team by id (or by name if id missing) to be defensive.
        const team = row.teamMatch?.id
          ? season.teams.find(t => t.id === row.teamMatch.id)
          : findMatchingTeam(row.team, season.teams)
        if (!team) { skipped++; skippedReasons.push(`${row.player}: no team match`); continue }

        // Upsert the player.
        let player = team.players.find(p => p.name.toLowerCase().trim() === row.player.toLowerCase().trim())
        if (!player) {
          player = await prisma.player.create({
            data: {
              name: row.player.trim(),
              teamId: team.id,
              jerseyNumber: row.jerseyNumber || null,
            },
          })
          team.players.push(player)
        } else if (row.jerseyNumber && player.jerseyNumber !== row.jerseyNumber) {
          // Fill in jersey number if we didn't have it before.
          await prisma.player.update({
            where: { id: player.id },
            data: { jerseyNumber: row.jerseyNumber },
          })
        }

        // Upsert the per-week stat row.
        const stat = {
          kills: row.kills || 0,
          assists: row.assists || 0,
          digs: row.digs || 0,
          aces: row.aces || 0,
          blocks: row.blocks || 0,
        }
        const existing = await prisma.playerStat.findUnique({
          where: { playerId_weekId: { playerId: player.id, weekId: week.id } },
        })
        if (existing) {
          await prisma.playerStat.update({ where: { id: existing.id }, data: stat })
          updated++
        } else {
          await prisma.playerStat.create({
            data: { ...stat, playerId: player.id, weekId: week.id },
          })
          created++
        }
      }

      revalidateLeagueStats(leagueSlug)
      revalidateLeague(leagueSlug)

      return NextResponse.json({
        success: true,
        created, updated, skipped, skippedReasons,
        week: { weekNumber: week.weekNumber },
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('player-stats import error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

/* ──────────────────────────────────────────────────────────────
   DELETE — wipe stats for a given week (admin escape hatch)
   ────────────────────────────────────────────────────────────── */
export async function DELETE(request) {
  try {
    const { leagueSlug, weekNumber } = await request.json()
    if (!leagueSlug || !weekNumber) {
      return NextResponse.json({ error: 'leagueSlug + weekNumber required' }, { status: 400 })
    }
    const week = await prisma.week.findFirst({
      where: { weekNumber: parseInt(weekNumber, 10), season: { league: { slug: leagueSlug } } },
    })
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    const result = await prisma.playerStat.deleteMany({ where: { weekId: week.id } })
    revalidateLeagueStats(leagueSlug)
    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('player-stats delete error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
