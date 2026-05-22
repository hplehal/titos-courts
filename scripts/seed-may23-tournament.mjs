// Seeds the "Titos REC Tournament" (May 23, 2026) end-to-end:
//   - Tournament row with bracketFormat='crossover-single-elim' and
//     pool-play matchFormat='pool-1set-25-cap-27'.
//   - 2 pools (A, B) with 5 teams each (positions A1-A5, B1-B5 via the
//     `seed` field — these labels appear in the public schedule).
//   - 20 pool-play matches with explicit start times (9:10 → 12:10 every
//     20 min) and the ref-rotation from the captain's package.
//
// Idempotent: re-running deletes the existing tournament and rebuilds it.
// Safe to run against production once.

import 'dotenv/config'
import prisma from '../lib/prisma.js'

const SLUG = 'titos-rec-tournament-may-2026'
const NAME = "Titos REC Tournament"
const DATE = new Date('2026-05-23T09:00:00-04:00')
const END_DATE = new Date('2026-05-23T16:00:00-04:00')

// Pool A teams in seed order (positions A1..A5). Seed = position from
// the captain's package; refs use the same numbering.
const POOL_A = [
  { name: 'Pho King Shrek',         captain: 'Justin',  seed: 1 },
  { name: 'Sheriefs Our Carry',     captain: 'Mo',      seed: 2 },
  { name: 'TTC',                    captain: 'Rebecca', seed: 3 },
  { name: 'Goofy Gooners',          captain: 'Emily',   seed: 4 },
  { name: 'Spikes? In This Economy', captain: 'Ruth',   seed: 5 },
]

const POOL_B = [
  { name: 'Bolo Bao Baos',     captain: 'KS',      seed: 1 },
  { name: 'Pinoy Pancakes',    captain: 'John',    seed: 2 },
  { name: 'T1',                captain: 'Nick',    seed: 3 },
  { name: 'Rhaymen Noodles',   captain: 'Yuka',    seed: 4 },
  { name: 'Sonion',            captain: 'Patrick', seed: 5 },
]

// Pool play schedule — per captain's package:
//   [time, home seed, away seed, ref seed] — ref seed is the team
//   sitting off (1-5 within the pool).
const POOL_PLAY = [
  // 9:10 AM
  { time: '09:10', home: 1, away: 2, ref: 3 },
  // 9:30
  { time: '09:30', home: 3, away: 4, ref: 5 },
  // 9:50
  { time: '09:50', home: 1, away: 5, ref: 4 },
  // 10:10
  { time: '10:10', home: 2, away: 3, ref: 1 },
  // 10:30
  { time: '10:30', home: 4, away: 5, ref: 2 },
  // 10:50
  { time: '10:50', home: 1, away: 3, ref: 5 },
  // 11:10
  { time: '11:10', home: 2, away: 4, ref: 3 },
  // 11:30
  { time: '11:30', home: 3, away: 5, ref: 1 },
  // 11:50
  { time: '11:50', home: 1, away: 4, ref: 2 },
  // 12:10
  { time: '12:10', home: 2, away: 5, ref: 4 },
]

const RULES = `## Check-In
- Captains must check in at the Command Center (front table by the main entrance) **before 9:00 AM**.
- Pool play starts at **9:10 AM**. Doors open 8:45 AM for warm-up.

## COED 4:2 Roster Rules
- All games follow [official FIVB rules](https://www.fivb.com/en/volleyball/thegame_glossary/officialrulesofthegames).
- Minimum **2 female athletes on the court at all times**. Failure to meet this requirement may result in forfeit of the set or match.
- Each team maintains a **4 male / 2 female** ratio during active play. No exceptions.
- A female libero must stay in rotation — no playing with 5 male players while she's off court.

## Gameplay
- Jump serves are permitted. Service-line foot faults are called.
- Unsportsmanlike conduct is not tolerated and may result in expulsion from the match or tournament without refund.
- Respect officials and their calls.

## Officiating
- The sitting team in each pool refs the live match.
- Bring a lead official to the ref stand, a scorekeeper, and 2 line judges on opposite corners.
- Whistles, scoreboards, and flags are in the Officiating Basket at the Command Center.
- Lead official calls captains for serve/side. Scores must be **acknowledged and signed by both captains**.
- We will call the last 2 minutes of each pool match to help refs call the final serve.

## Pool Play Format
- 1 set to 25 (capped at 27)
- No timeouts
- 20-minute hard time cap — if tied at the cap, play the next point.
- Every player on the roster must play during round robin to be eligible for playoffs (teams with >6 players).
- **For every minute your full team is not on the court at the scheduled time, the opposing team is awarded 1 point.**

## Play-In + Playoffs
- After pool play, 4th-vs-5th in each pool plays a 1-set elimination — winners take the last bracket spots.
- Quarter-finals, semi-finals, and finals are **best of 3** (25 / 25 / 15 to a deciding set, no cap, 3 timeouts each).
- Playoffs are officiated by a certified referee with support from the scheduled team (2 line judges + scoreboard).
- The losing team officiates the next game on the same court.

Any rules questions or disputes: contact us immediately at **info@titoscourts.com**.

**GOOD LUCK AND HAVE FUN!**`

async function main() {
  // 1. Clean slate if the tournament already exists (idempotent re-runs).
  const existing = await prisma.tournament.findUnique({ where: { slug: SLUG } })
  if (existing) {
    console.log(`Deleting existing tournament: ${existing.name}`)
    // Match → SetScore cascade; manually clear matches first to avoid FK pain.
    await prisma.tournamentSetScore.deleteMany({ where: { match: { OR: [{ pool: { tournamentId: existing.id } }, { bracket: { tournamentId: existing.id } }] } } })
    await prisma.tournamentMatch.deleteMany({ where: { OR: [{ pool: { tournamentId: existing.id } }, { bracket: { tournamentId: existing.id } }] } })
    await prisma.tournamentBracket.deleteMany({ where: { tournamentId: existing.id } })
    await prisma.tournamentTeam.deleteMany({ where: { tournamentId: existing.id } })
    await prisma.tournamentPool.deleteMany({ where: { tournamentId: existing.id } })
    await prisma.tournament.delete({ where: { id: existing.id } })
  }

  // 2. Create the tournament.
  const tournament = await prisma.tournament.create({
    data: {
      name: NAME,
      slug: SLUG,
      date: DATE,
      endDate: END_DATE,
      venue: 'James Cardinal McGuigan',
      venueAddress: '1440 Finch Ave W, North York, ON M3J 3G3',
      poolSize: 5,
      poolCount: 2,
      format: 'COED 4M/2F',
      bracketFormat: 'crossover-single-elim',
      poolMatchFormat: 'pool-1set-25-cap-27',
      bracketMatchFormat: 'bo3-25-15-no-cap',
      prizePool: 400,
      status: 'active',
      rules: RULES,
      description: '10-team single-day COED 4:2 tournament at James Cardinal McGuigan. Pool play to 25 (1 set, 20-min cap) then a crossover single-elim playoff (best of 3).',
    },
  })
  console.log(`Created tournament: ${tournament.name} (${tournament.id})`)

  // 3. Create the two pools.
  const poolA = await prisma.tournamentPool.create({
    data: { tournamentId: tournament.id, name: 'A' },
  })
  const poolB = await prisma.tournamentPool.create({
    data: { tournamentId: tournament.id, name: 'B' },
  })
  console.log('Created pools A and B')

  // 4. Create teams in their pools with seeds.
  const teamsA = []
  for (const t of POOL_A) {
    const row = await prisma.tournamentTeam.create({
      data: {
        tournamentId: tournament.id,
        poolId: poolA.id,
        name: t.name,
        captainName: t.captain,
        seed: t.seed,
      },
    })
    teamsA.push(row)
  }
  const teamsB = []
  for (const t of POOL_B) {
    const row = await prisma.tournamentTeam.create({
      data: {
        tournamentId: tournament.id,
        poolId: poolB.id,
        name: t.name,
        captainName: t.captain,
        seed: t.seed,
      },
    })
    teamsB.push(row)
  }
  console.log(`Created ${teamsA.length + teamsB.length} teams`)

  // 5. Create pool-play matches with explicit start times + refs.
  const scheduledAtFor = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    const d = new Date(DATE)
    d.setHours(h, m, 0, 0)
    return d
  }

  // Each 20-minute time slot becomes one round. roundNumber is what the
  // admin scores page uses to group matches across courts, so without this
  // every match would collapse into a single round 0.
  let gameOrder = 1
  for (let roundIdx = 0; roundIdx < POOL_PLAY.length; roundIdx++) {
    const slot = POOL_PLAY[roundIdx]
    const roundNumber = roundIdx + 1
    const teamByPoolSeed = (teams, seed) => teams.find(x => x.seed === seed)

    // Pool A match on Court 1
    await prisma.tournamentMatch.create({
      data: {
        poolId: poolA.id,
        stage: 'pool',
        matchFormat: 'pool-1set-25-cap-27',
        homeTeamId: teamByPoolSeed(teamsA, slot.home).id,
        awayTeamId: teamByPoolSeed(teamsA, slot.away).id,
        refTeamId: teamByPoolSeed(teamsA, slot.ref).id,
        homeSeedLabel: `A${slot.home}`,
        awaySeedLabel: `A${slot.away}`,
        courtNumber: 1,
        scheduledTime: scheduledAtFor(slot.time),
        roundNumber,
        gameOrder: gameOrder++,
        status: 'scheduled',
      },
    })

    // Pool B match on Court 2 (same time slot)
    await prisma.tournamentMatch.create({
      data: {
        poolId: poolB.id,
        stage: 'pool',
        matchFormat: 'pool-1set-25-cap-27',
        homeTeamId: teamByPoolSeed(teamsB, slot.home).id,
        awayTeamId: teamByPoolSeed(teamsB, slot.away).id,
        refTeamId: teamByPoolSeed(teamsB, slot.ref).id,
        homeSeedLabel: `B${slot.home}`,
        awaySeedLabel: `B${slot.away}`,
        courtNumber: 2,
        scheduledTime: scheduledAtFor(slot.time),
        roundNumber,
        gameOrder: gameOrder++,
        status: 'scheduled',
      },
    })
  }
  console.log(`Created ${(gameOrder - 1)} pool-play matches across ${POOL_PLAY.length} rounds`)

  console.log('\nDone. Tournament is live at:')
  console.log(`  /tournaments/${SLUG}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
