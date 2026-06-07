// Fix the Sunday MENS Week 9 within-tier ordering. The tier MEMBERSHIP is
// already correct, but the placements were inserted in the wrong order
// (display + match generation both rely on DB insertion order), so the
// seed-1/2/3 within each tier — and the round-robin home/away/ref rotation
// derived from it — were wrong.
//
// This recreates the W9 placements in the captain-confirmed order and
// regenerates the 36 matches using the same round-robin pattern the admin
// 'generate-matches' endpoint uses (A vs C, B vs A, C vs B × 3 MENS rounds).
//
// Safe: W9 is UPCOMING with no scores, so nothing is lost.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

// Captain-confirmed Week 9 order (seed 1 → 3 within each tier).
const DESIRED = {
  1: ['Tsunami Riptide', 'AkatsuKILL', 'Out of Your League'],
  2: ['Boys 2 Men', 'Schweiden', 'Sets on the Beach'],
  3: ['Block Party', 'United Nations', 'Glizzy Gobblers'],
  4: ['Friends', 'Spike Syndicate', "Ricky's Babics"],
}

const league = await prisma.league.findUnique({
  where: { slug: 'sunday-mens' },
  include: {
    seasons: {
      where: { status: { in: ['active', 'playoffs'] } },
      orderBy: { seasonNumber: 'desc' },
      take: 1,
      include: { tiers: true, teams: { select: { id: true, name: true } } },
    },
  },
})
const season = league.seasons[0]
const w9 = await prisma.week.findFirst({ where: { seasonId: season.id, weekNumber: 9 } })
if (!w9) { console.error('No W9'); process.exit(1) }

const teamByName = Object.fromEntries(season.teams.map(t => [t.name, t.id]))
const tierByNumber = Object.fromEntries(season.tiers.map(t => [t.tierNumber, t]))

// Validate every desired team resolves before we touch anything.
for (const [tn, names] of Object.entries(DESIRED)) {
  for (const name of names) {
    if (!teamByName[name]) { console.error(`Team not found: "${name}" (tier ${tn})`); process.exit(1) }
  }
  if (!tierByNumber[tn]) { console.error(`Tier ${tn} not found`); process.exit(1) }
}

// 1. Wipe W9 matches (+ any scores — none for upcoming) and placements.
const oldMatches = await prisma.match.findMany({ where: { weekId: w9.id }, select: { id: true } })
const oldIds = oldMatches.map(m => m.id)
if (oldIds.length) {
  await prisma.setScore.deleteMany({ where: { matchId: { in: oldIds } } })
  await prisma.playerStat.deleteMany({ where: { matchId: { in: oldIds } } })
  await prisma.match.deleteMany({ where: { weekId: w9.id } })
}
await prisma.tierPlacement.deleteMany({ where: { weekId: w9.id } })
console.log(`Cleared ${oldIds.length} matches + old placements`)

// 2. Recreate placements in the desired order (insertion order = display order).
let placed = 0
for (const [tn, names] of Object.entries(DESIRED)) {
  const tier = tierByNumber[tn]
  for (const name of names) {
    await prisma.tierPlacement.create({
      data: { tierId: tier.id, teamId: teamByName[name], weekId: w9.id, finishPosition: null, movement: null },
    })
    placed++
  }
}
console.log(`Created ${placed} placements in correct order`)

// 3. Regenerate matches — MENS = 3 rounds, round-robin A vs C / B vs A / C vs B.
const ROUNDS = 3
let matchCount = 0
for (const [tn, names] of Object.entries(DESIRED)) {
  const tier = tierByNumber[tn]
  const [A, B, C] = names.map(n => teamByName[n])
  for (let r = 1; r <= ROUNDS; r++) {
    const base = (r - 1) * 3
    const defs = [
      { home: A, away: C, ref: B, order: base + 1 },
      { home: B, away: A, ref: C, order: base + 2 },
      { home: C, away: B, ref: A, order: base + 3 },
    ]
    for (const d of defs) {
      await prisma.match.create({
        data: {
          weekId: w9.id,
          homeTeamId: d.home, awayTeamId: d.away, refTeamId: d.ref,
          courtNumber: tier.courtNumber, tierNumber: tier.tierNumber,
          roundNumber: r, gameOrder: d.order, status: 'scheduled',
        },
      })
      matchCount++
    }
  }
}
console.log(`Regenerated ${matchCount} matches`)
console.log('\nDone. Hard-refresh /schedule/sunday-mens to see W9 in the correct order.')
await prisma.$disconnect()
