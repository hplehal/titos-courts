// Fix Sunday MENS Week 10 within-tier ordering to the captain-confirmed
// schedule. Same fragility as W9 — display + match generation rely on DB
// insertion order, and the placements landed in the wrong order for
// Tier 1 and Tier 2. Recreates all W10 placements in the correct order
// and regenerates the 36 matches (MENS round-robin, 3 rounds).
//
// Safe: W10 is UPCOMING with no scores.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const DESIRED = {
  1: ['Out of Your League', 'Tsunami Riptide', 'Sets on the Beach'],
  2: ['AkatsuKILL', 'Boys 2 Men', 'Glizzy Gobblers'],
  3: ['Schweiden', 'Block Party', "Ricky's Babics"],
  4: ['United Nations', 'Spike Syndicate', 'Friends'],
}

const league = await prisma.league.findUnique({
  where: { slug: 'sunday-mens' },
  include: {
    seasons: {
      where: { status: { in: ['active', 'playoffs'] } },
      orderBy: { seasonNumber: 'desc' }, take: 1,
      include: { tiers: true, teams: { select: { id: true, name: true } } },
    },
  },
})
const season = league.seasons[0]
const w10 = await prisma.week.findFirst({ where: { seasonId: season.id, weekNumber: 10 } })
if (!w10) { console.error('No W10'); process.exit(1) }

const teamByName = Object.fromEntries(season.teams.map(t => [t.name, t.id]))
const tierByNumber = Object.fromEntries(season.tiers.map(t => [t.tierNumber, t]))

for (const [tn, names] of Object.entries(DESIRED)) {
  for (const name of names) if (!teamByName[name]) { console.error(`Team not found: "${name}"`); process.exit(1) }
  if (!tierByNumber[tn]) { console.error(`Tier ${tn} not found`); process.exit(1) }
}

// Wipe W10 matches + placements.
const old = await prisma.match.findMany({ where: { weekId: w10.id }, select: { id: true } })
const oldIds = old.map(m => m.id)
if (oldIds.length) {
  await prisma.setScore.deleteMany({ where: { matchId: { in: oldIds } } })
  await prisma.playerStat.deleteMany({ where: { matchId: { in: oldIds } } })
  await prisma.match.deleteMany({ where: { weekId: w10.id } })
}
await prisma.tierPlacement.deleteMany({ where: { weekId: w10.id } })
console.log(`Cleared ${oldIds.length} matches + old placements`)

// Recreate placements in correct order.
let placed = 0
for (const [tn, names] of Object.entries(DESIRED)) {
  const tier = tierByNumber[tn]
  for (const name of names) {
    await prisma.tierPlacement.create({ data: { tierId: tier.id, teamId: teamByName[name], weekId: w10.id, finishPosition: null, movement: null } })
    placed++
  }
}
console.log(`Created ${placed} placements in correct order`)

// Regenerate matches — MENS = 3 rounds, A vs C / B vs A / C vs B.
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
      await prisma.match.create({ data: {
        weekId: w10.id, homeTeamId: d.home, awayTeamId: d.away, refTeamId: d.ref,
        courtNumber: tier.courtNumber, tierNumber: tier.tierNumber,
        roundNumber: r, gameOrder: d.order, status: 'scheduled',
      } })
      matchCount++
    }
  }
}
console.log(`Regenerated ${matchCount} matches`)
console.log('\nDone. Hard-refresh /schedule/sunday-mens (or save a score to bust the cache).')
await prisma.$disconnect()
