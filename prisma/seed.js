import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ─── HELPERS ───

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Seeded random for reproducibility
let rngState = 42
function seededRandom() {
  rngState = (rngState * 1664525 + 1013904223) & 0x7fffffff
  return rngState / 0x7fffffff
}

function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateSetScore() {
  // Generate a realistic volleyball set score
  const roll = seededRandom()
  if (roll < 0.15) {
    // Blowout: 25 vs 15-18
    const loser = randomInt(15, 18)
    return seededRandom() > 0.5 ? [25, loser] : [loser, 25]
  } else if (roll < 0.35) {
    // Comfortable win: 25 vs 19-21
    const loser = randomInt(19, 21)
    return seededRandom() > 0.5 ? [25, loser] : [loser, 25]
  } else if (roll < 0.7) {
    // Competitive: 25 vs 22-24
    const loser = randomInt(22, 24)
    return seededRandom() > 0.5 ? [25, loser] : [loser, 25]
  } else if (roll < 0.85) {
    // Deuce scenario: 26-24 or 27-25
    const winner = seededRandom() > 0.5 ? 26 : 27
    const loser = winner - 2
    return seededRandom() > 0.5 ? [winner, loser] : [loser, winner]
  } else {
    // Very close: 25-23
    return seededRandom() > 0.5 ? [25, 23] : [23, 25]
  }
}

function addDays(date, days) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  d.setUTCHours(12, 0, 0, 0)
  return d
}

// ─── DATA DEFINITIONS ───

const tuesdayCOEDTeams = [
  { name: 'Sets on the Beach', captain: 'Marcus Rivera', email: 'marcus.rivera@email.com' },
  { name: 'Block Party', captain: 'Jessica Chen', email: 'jessica.chen@email.com' },
  { name: 'Notorious D.I.G.', captain: 'Devon Williams', email: 'devon.williams@email.com' },
  { name: 'Ace Ventura', captain: 'Sarah Mitchell', email: 'sarah.mitchell@email.com' },
  { name: 'Serve-ivors', captain: 'Tyler Brooks', email: 'tyler.brooks@email.com' },
  { name: 'Net Worth', captain: 'Amanda Patel', email: 'amanda.patel@email.com' },
  { name: 'Spike Lee', captain: 'Chris Johnson', email: 'chris.johnson@email.com' },
  { name: 'Dig Dug', captain: 'Rachel Kim', email: 'rachel.kim@email.com' },
  { name: 'The Setters', captain: 'Brandon Lopez', email: 'brandon.lopez@email.com' },
  { name: 'Bump Set Spike', captain: 'Megan Torres', email: 'megan.torres@email.com' },
  { name: 'Court Jesters', captain: 'Jake Morrison', email: 'jake.morrison@email.com' },
  { name: 'Hit & Miss', captain: 'Lisa Nguyen', email: 'lisa.nguyen@email.com' },
  { name: 'Set It and Forget It', captain: 'Nathan Harris', email: 'nathan.harris@email.com' },
  { name: 'The Volley Llamas', captain: 'Emily Watson', email: 'emily.watson@email.com' },
  { name: 'Smash Mouth', captain: 'Ryan Cooper', email: 'ryan.cooper@email.com' },
  { name: 'Ball Busters', captain: 'Danielle Scott', email: 'danielle.scott@email.com' },
  { name: 'Spike Tyson', captain: 'Michael Brown', email: 'michael.brown@email.com' },
  { name: 'Net Gains', captain: 'Olivia Martinez', email: 'olivia.martinez@email.com' },
  { name: 'Served Fresh', captain: 'Austin Reed', email: 'austin.reed@email.com' },
  { name: 'No Dig-nity', captain: 'Kayla Thompson', email: 'kayla.thompson@email.com' },
  { name: 'Pass Set Regret', captain: 'Jason Park', email: 'jason.park@email.com' },
  { name: 'Block Rockin Beats', captain: 'Samantha Lee', email: 'samantha.lee@email.com' },
  { name: 'Kiss My Ace', captain: 'Derek Hernandez', email: 'derek.hernandez@email.com' },
  { name: 'Game of Sets', captain: 'Natalie Young', email: 'natalie.young@email.com' },
]

const sundayMENSTeams = [
  { name: 'Top Spin', captain: 'Marco Rossi', email: 'marco.rossi@email.com' },
  { name: 'Heavy Hitters', captain: 'Jamal Carter', email: 'jamal.carter@email.com' },
  { name: 'Thunder Spikes', captain: 'Viktor Petrov', email: 'viktor.petrov@email.com' },
  { name: 'Iron Court', captain: 'David Okafor', email: 'david.okafor@email.com' },
  { name: 'The Blockers', captain: 'Ken Tanaka', email: 'ken.tanaka@email.com' },
  { name: 'Net Assassins', captain: 'Carlos Mendez', email: 'carlos.mendez@email.com' },
  { name: 'Power Surge', captain: 'Andre Thompson', email: 'andre.thompson@email.com' },
  { name: 'Set Point', captain: 'Brian Walsh', email: 'brian.walsh@email.com' },
  { name: 'Court Crushers', captain: 'Damon Rivers', email: 'damon.rivers@email.com' },
  { name: 'Vertical Limit', captain: 'Sean Murphy', email: 'sean.murphy@email.com' },
  { name: 'Slam Dunk VB', captain: 'Tony Russo', email: 'tony.russo@email.com' },
  { name: 'Full Send', captain: 'Liam Fletcher', email: 'liam.fletcher@email.com' },
  { name: 'Zero Gravity', captain: 'Ravi Sharma', email: 'ravi.sharma@email.com' },
  { name: 'Side Out Kings', captain: 'James O\'Brien', email: 'james.obrien@email.com' },
  { name: 'Service Aces', captain: 'Miles Henderson', email: 'miles.henderson@email.com' },
]

// Tuesday COED: 8 tiers, early slot 8PM-10PM, late slot 10PM-12AM
const tuesdayTierDefs = [
  { tierNumber: 1, courtNumber: 7, timeSlot: 'early' },
  { tierNumber: 2, courtNumber: 6, timeSlot: 'early' },
  { tierNumber: 3, courtNumber: 8, timeSlot: 'early' },
  { tierNumber: 4, courtNumber: 9, timeSlot: 'early' },
  { tierNumber: 5, courtNumber: 7, timeSlot: 'late' },
  { tierNumber: 6, courtNumber: 6, timeSlot: 'late' },
  { tierNumber: 7, courtNumber: 8, timeSlot: 'late' },
  { tierNumber: 8, courtNumber: 9, timeSlot: 'late' },
]

// Sunday MENS: 5 tiers, 5 courts, single time slot 9PM-12AM
const sundayTierDefs = [
  { tierNumber: 1, courtNumber: 7, timeSlot: 'single' },
  { tierNumber: 2, courtNumber: 6, timeSlot: 'single' },
  { tierNumber: 3, courtNumber: 8, timeSlot: 'single' },
  { tierNumber: 4, courtNumber: 9, timeSlot: 'single' },
  { tierNumber: 5, courtNumber: 10, timeSlot: 'single' },
]

// ─── MATCH & TIER SIMULATION ENGINE ───

function generateMatchesForTier(tierTeams, tierNumber, courtNumber, rounds = 2) {
  // tierTeams = [teamA, teamB, teamC]
  // rounds: 2 for COED (6 games), 3 for MENS (9 games)
  const [A, B, C] = tierTeams
  const matches = []
  for (let r = 1; r <= rounds; r++) {
    const baseOrder = (r - 1) * 3
    matches.push(
      { home: A, away: B, ref: C, round: r, order: baseOrder + 1 },
      { home: C, away: A, ref: B, round: r, order: baseOrder + 2 },
      { home: B, away: C, ref: A, round: r, order: baseOrder + 3 },
    )
  }
  return matches
}

function computeTierResults(matchResults, tierTeamIds) {
  // matchResults = array of { homeId, awayId, sets: [{homeScore, awayScore}] }
  const stats = {}
  for (const id of tierTeamIds) {
    stats[id] = { setsWon: 0, pointDiff: 0 }
  }

  for (const m of matchResults) {
    for (const s of m.sets) {
      if (s.homeScore > s.awayScore) {
        stats[m.homeId].setsWon++
      } else {
        stats[m.awayId].setsWon++
      }
      stats[m.homeId].pointDiff += s.homeScore - s.awayScore
      stats[m.awayId].pointDiff += s.awayScore - s.homeScore
    }
  }

  // Rank: sets won desc, then point diff desc
  const ranked = tierTeamIds
    .map((id) => ({ id, ...stats[id] }))
    .sort((a, b) => b.setsWon - a.setsWon || b.pointDiff - a.pointDiff)

  return ranked.map((r, i) => ({ ...r, position: i + 1 }))
}

function determineMovement(position, tierNumber, totalTiers) {
  if (tierNumber === 1) {
    // Top tier: 1st stays, 2nd stays, 3rd drops
    if (position === 1) return 'stay'
    if (position === 2) return 'stay'
    return 'down'
  } else if (tierNumber === totalTiers) {
    // Bottom tier: 1st moves up, 2nd stays, 3rd stays
    if (position === 1) return 'up'
    return 'stay'
  } else {
    // Middle tiers: 1st up, 2nd stays, 3rd down
    if (position === 1) return 'up'
    if (position === 2) return 'stay'
    return 'down'
  }
}

function applyMovements(tierCompositions, results, totalTiers) {
  // results = { tierNumber: [{ id, position, movement }] }
  // Returns new tier compositions for next week
  const newComps = {}
  for (let t = 1; t <= totalTiers; t++) {
    newComps[t] = []
  }

  for (let t = 1; t <= totalTiers; t++) {
    for (const r of results[t]) {
      if (r.movement === 'stay') {
        newComps[t].push(r.id)
      } else if (r.movement === 'up') {
        newComps[t - 1].push(r.id)
      } else if (r.movement === 'down') {
        newComps[t + 1].push(r.id)
      }
    }
  }

  return newComps
}

// ─── MAIN SEED FUNCTION ───

async function main() {
  console.log('=== Tito\'s Courts Database Seed ===\n')

  // ─── CLEANUP ───
  console.log('Cleaning up existing data...')
  await prisma.tournamentSetScore.deleteMany()
  await prisma.tournamentMatch.deleteMany()
  await prisma.tournamentBracket.deleteMany()
  await prisma.tournamentTeam.deleteMany()
  await prisma.tournamentPool.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.playerStat.deleteMany()
  await prisma.setScore.deleteMany()
  await prisma.match.deleteMany()
  await prisma.tierPlacement.deleteMany()
  await prisma.player.deleteMany()
  await prisma.team.deleteMany()
  await prisma.tier.deleteMany()
  await prisma.week.deleteMany()
  await prisma.season.deleteMany()
  await prisma.league.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.contactMessage.deleteMany()
  console.log('Cleanup complete.\n')

  // ─── LEAGUES ───
  console.log('Creating leagues...')
  const tuesdayLeague = await prisma.league.create({
    data: {
      name: 'Tuesday COED',
      slug: 'tuesday-coed',
      dayOfWeek: 'Tuesday',
      description: 'Competitive co-ed volleyball every Tuesday night at Tito\'s Courts',
      registrationFee: 230,
      maxTeams: 30,
      tiersPerSlot: 4,
      teamsPerTier: 3,
    },
  })

  const sundayLeague = await prisma.league.create({
    data: {
      name: 'Sunday MENS',
      slug: 'sunday-mens',
      dayOfWeek: 'Sunday',
      description: 'Competitive men\'s volleyball every Sunday at Tito\'s Courts',
      registrationFee: 220,
      maxTeams: 15,
      tiersPerSlot: 5,
      teamsPerTier: 3,
    },
  })

  const thursdayLeague = await prisma.league.create({
    data: {
      name: 'Thursday REC COED',
      slug: 'thursday-rec-coed',
      dayOfWeek: 'Thursday',
      description: 'Recreational co-ed volleyball every Thursday night',
      registrationFee: 200,
      maxTeams: 12,
      tiersPerSlot: 4,
      teamsPerTier: 3,
    },
  })
  console.log(`  Created 3 leagues: Tuesday COED, Sunday MENS, Thursday REC COED\n`)

  // ─── SEASONS ───
  console.log('Creating seasons...')
  const tuesdaySeason = await prisma.season.create({
    data: {
      leagueId: tuesdayLeague.id,
      name: 'Season 10 — Spring 2026',
      seasonNumber: 10,
      startDate: new Date('2026-04-01T12:00:00Z'),
      endDate: new Date('2026-06-10T12:00:00Z'),
      totalWeeks: 11,
      playoffWeeks: 1,
      status: 'active',
    },
  })

  const sundaySeason = await prisma.season.create({
    data: {
      leagueId: sundayLeague.id,
      name: 'Season 10 — Spring 2026',
      seasonNumber: 10,
      startDate: new Date('2026-04-12T12:00:00Z'),
      endDate: new Date('2026-06-21T12:00:00Z'),
      totalWeeks: 11,
      playoffWeeks: 1,
      status: 'active',
    },
  })

  const thursdaySeason = await prisma.season.create({
    data: {
      leagueId: thursdayLeague.id,
      name: 'Season 1',
      seasonNumber: 1,
      startDate: new Date('2026-05-07T12:00:00Z'),
      endDate: new Date('2026-07-16T12:00:00Z'),
      totalWeeks: 11,
      playoffWeeks: 1,
      status: 'registration',
    },
  })
  console.log(`  Created 3 seasons\n`)

  // ─── TEAMS ───
  console.log('Creating Tuesday COED teams...')
  const tueTeamRecords = []
  for (const t of tuesdayCOEDTeams) {
    const team = await prisma.team.create({
      data: {
        name: t.name,
        slug: slugify(t.name),
        seasonId: tuesdaySeason.id,
        captainName: t.captain,
        captainEmail: t.email,
      },
    })
    tueTeamRecords.push(team)
  }
  console.log(`  Created ${tueTeamRecords.length} Tuesday COED teams`)

  console.log('Creating Sunday MENS teams...')
  const sunTeamRecords = []
  for (const t of sundayMENSTeams) {
    const team = await prisma.team.create({
      data: {
        name: t.name,
        slug: slugify(t.name),
        seasonId: sundaySeason.id,
        captainName: t.captain,
        captainEmail: t.email,
      },
    })
    sunTeamRecords.push(team)
  }
  console.log(`  Created ${sunTeamRecords.length} Sunday MENS teams\n`)

  // ─── TIERS ───
  console.log('Creating tiers...')
  const tueTiers = []
  for (const td of tuesdayTierDefs) {
    const tier = await prisma.tier.create({
      data: {
        seasonId: tuesdaySeason.id,
        tierNumber: td.tierNumber,
        courtNumber: td.courtNumber,
        timeSlot: td.timeSlot,
      },
    })
    tueTiers.push(tier)
  }
  console.log(`  Created ${tueTiers.length} Tuesday tiers`)

  const sunTiers = []
  for (const td of sundayTierDefs) {
    const tier = await prisma.tier.create({
      data: {
        seasonId: sundaySeason.id,
        tierNumber: td.tierNumber,
        courtNumber: td.courtNumber,
        timeSlot: td.timeSlot,
      },
    })
    sunTiers.push(tier)
  }
  console.log(`  Created ${sunTiers.length} Sunday tiers\n`)

  // ─── WEEKS ───
  console.log('Creating weeks...')

  // Tuesday COED weeks: 11 weeks starting 2026-04-01
  // Week 1 = placement (completed), Weeks 2-11 = upcoming
  const tueWeeks = []
  for (let w = 1; w <= 11; w++) {
    const weekDate = addDays(new Date('2026-04-01T12:00:00Z'), (w - 1) * 7)
    let status = 'upcoming'
    if (w === 1) status = 'completed'
    const week = await prisma.week.create({
      data: {
        seasonId: tuesdaySeason.id,
        weekNumber: w,
        date: weekDate,
        isPlayoff: w === 11,
        status,
      },
    })
    tueWeeks.push(week)
  }
  console.log(`  Created ${tueWeeks.length} Tuesday weeks`)

  // Sunday MENS weeks: 11 weeks starting 2026-04-12
  // ALL weeks upcoming — season hasn't started yet
  const sunWeeks = []
  for (let w = 1; w <= 11; w++) {
    const weekDate = addDays(new Date('2026-04-12T12:00:00Z'), (w - 1) * 7)
    const week = await prisma.week.create({
      data: {
        seasonId: sundaySeason.id,
        weekNumber: w,
        date: weekDate,
        isPlayoff: w === 11,
        status: 'upcoming',
      },
    })
    sunWeeks.push(week)
  }
  console.log(`  Created ${sunWeeks.length} Sunday weeks\n`)

  // ─── SIMULATE TUESDAY COED SEASON ───
  console.log('Simulating Tuesday COED season...')

  const totalTueTiers = 8
  const totalSunTiers = 5

  // Week 1: Random placement (completed)
  console.log('  Week 1 (Placement — completed)...')
  const shuffledTue = shuffle(tueTeamRecords)
  let tueTierComps = {} // { tierNumber: [teamId, teamId, teamId] }
  for (let t = 1; t <= totalTueTiers; t++) {
    tueTierComps[t] = shuffledTue.slice((t - 1) * 3, t * 3).map((tm) => tm.id)
  }

  // Create TierPlacement for Week 1
  for (let t = 1; t <= totalTueTiers; t++) {
    const tier = tueTiers[t - 1]
    for (const teamId of tueTierComps[t]) {
      await prisma.tierPlacement.create({
        data: {
          tierId: tier.id,
          teamId,
          weekId: tueWeeks[0].id,
          finishPosition: null,
          movement: null,
        },
      })
    }
  }

  // Create matches for Week 1 (placement week — with scores since it's completed)
  await createMatchesForWeek(tueWeeks[0], tueTiers, tueTierComps, totalTueTiers, true)

  // Compute results and movements for Week 1
  const week1Results = await computeWeekResults(tueWeeks[0], tueTiers, tueTierComps, totalTueTiers)
  tueTierComps = applyMovements(tueTierComps, week1Results, totalTueTiers)

  // Week 2 (next upcoming): Create TierPlacement only (no matches yet)
  console.log('  Week 2 (upcoming — placements only)...')
  for (let t = 1; t <= totalTueTiers; t++) {
    const tier = tueTiers[t - 1]
    for (const teamId of tueTierComps[t]) {
      await prisma.tierPlacement.create({
        data: {
          tierId: tier.id,
          teamId,
          weekId: tueWeeks[1].id,
          finishPosition: null,
          movement: null,
        },
      })
    }
  }

  console.log('  Tuesday COED simulation complete.\n')

  // ─── SIMULATE SUNDAY MENS SEASON ───
  console.log('Setting up Sunday MENS season...')

  // No completed weeks — just random placement for Week 1
  console.log('  Week 1 (upcoming — initial tier assignment)...')
  const shuffledSun = shuffle(sunTeamRecords)
  let sunTierComps = {}
  for (let t = 1; t <= totalSunTiers; t++) {
    sunTierComps[t] = shuffledSun.slice((t - 1) * 3, t * 3).map((tm) => tm.id)
  }

  // Create TierPlacement for Week 1 (initial random assignment, no scores)
  for (let t = 1; t <= totalSunTiers; t++) {
    const tier = sunTiers[t - 1]
    for (const teamId of sunTierComps[t]) {
      await prisma.tierPlacement.create({
        data: {
          tierId: tier.id,
          teamId,
          weekId: sunWeeks[0].id,
          finishPosition: null,
          movement: null,
        },
      })
    }
  }

  console.log('  Sunday MENS setup complete (no completed weeks).\n')

  // ─── TOURNAMENTS ───
  console.log('Creating tournaments...')
  await seedTournaments()
  console.log('  Tournaments complete.\n')

  console.log('=== Seed complete! ===')
  console.log(`Summary:`)
  console.log(`  3 Leagues`)
  console.log(`  3 Seasons`)
  console.log(`  ${tueTeamRecords.length} Tuesday COED teams`)
  console.log(`  ${sunTeamRecords.length} Sunday MENS teams`)
  console.log(`  ${tueTiers.length + sunTiers.length} Tiers`)
  console.log(`  ${tueWeeks.length + sunWeeks.length} Weeks`)
  console.log(`  4 Tournaments`)
}

// ─── CREATE MATCHES FOR A WEEK ───

async function createMatchesForWeek(week, tiers, tierComps, totalTiers, withScores, rounds = 2) {
  for (let t = 1; t <= totalTiers; t++) {
    const tier = tiers[t - 1]
    const teamIds = tierComps[t]
    if (!teamIds || teamIds.length < 3) continue

    const [A, B, C] = teamIds
    const matchDefs = []
    for (let r = 1; r <= rounds; r++) {
      const baseOrder = (r - 1) * 3
      matchDefs.push(
        { home: A, away: B, ref: C, round: r, order: baseOrder + 1 },
        { home: C, away: A, ref: B, round: r, order: baseOrder + 2 },
        { home: B, away: C, ref: A, round: r, order: baseOrder + 3 },
      )
    }

    for (const md of matchDefs) {
      const scores = withScores
        ? [generateSetScore()]
        : []

      const match = await prisma.match.create({
        data: {
          weekId: week.id,
          homeTeamId: md.home,
          awayTeamId: md.away,
          refTeamId: md.ref,
          courtNumber: tier.courtNumber,
          tierNumber: tier.tierNumber,
          roundNumber: md.round,
          gameOrder: md.order,
          status: withScores ? 'completed' : 'scheduled',
        },
      })

      for (let s = 0; s < scores.length; s++) {
        await prisma.setScore.create({
          data: {
            matchId: match.id,
            setNumber: s + 1,
            homeScore: scores[s][0],
            awayScore: scores[s][1],
          },
        })
      }
    }
  }
}

// ─── COMPUTE RESULTS AND UPDATE PLACEMENTS ───

async function computeWeekResults(week, tiers, tierComps, totalTiers) {
  const allResults = {}

  for (let t = 1; t <= totalTiers; t++) {
    const tier = tiers[t - 1]
    const teamIds = tierComps[t]
    if (!teamIds || teamIds.length < 3) continue

    // Fetch all matches for this tier and week
    const matches = await prisma.match.findMany({
      where: { weekId: week.id, tierNumber: tier.tierNumber },
      include: { scores: true },
    })

    // Compute results
    const matchResults = matches.map((m) => ({
      homeId: m.homeTeamId,
      awayId: m.awayTeamId,
      sets: m.scores.map((s) => ({ homeScore: s.homeScore, awayScore: s.awayScore })),
    }))

    const ranked = computeTierResults(matchResults, teamIds)

    // Determine movement
    const tierResults = ranked.map((r) => ({
      ...r,
      movement: determineMovement(r.position, t, totalTiers),
    }))

    allResults[t] = tierResults

    // Update TierPlacement records
    for (const r of tierResults) {
      await prisma.tierPlacement.updateMany({
        where: {
          teamId: r.id,
          weekId: week.id,
        },
        data: {
          finishPosition: r.position,
          movement: r.movement,
        },
      })
    }
  }

  return allResults
}

// ─── TOURNAMENTS ───

async function seedTournaments() {
  // 1. Spring Showdown (completed)
  console.log('  Creating Spring Showdown (completed)...')
  const springShowdown = await prisma.tournament.create({
    data: {
      name: 'Spring Showdown',
      slug: 'spring-showdown',
      date: new Date('2026-03-22T12:00:00Z'),
      description: 'Our annual spring volleyball tournament featuring 16 teams competing across 4 pools for gold and silver brackets.',
      format: '4 pools of 4, Gold/Silver bracket',
      registrationFee: 200,
      maxTeams: 16,
      registrationDeadline: new Date('2026-03-15T12:00:00Z'),
      status: 'completed',
    },
  })

  const tournTeamNames = [
    // Pool A
    { name: 'Sand Storm', captain: 'Alex Rivera', pool: 'A' },
    { name: 'Net Ninjas', captain: 'Tina Chang', pool: 'A' },
    { name: 'Volley Vipers', captain: 'Greg Adams', pool: 'A' },
    { name: 'Beach Brawlers', captain: 'Kim Patel', pool: 'A' },
    // Pool B
    { name: 'Spike Force', captain: 'Omar Hassan', pool: 'B' },
    { name: 'The Setbacks', captain: 'Laura White', pool: 'B' },
    { name: 'Ace Holes', captain: 'Pete Nakamura', pool: 'B' },
    { name: 'Dig It', captain: 'Maria Santos', pool: 'B' },
    // Pool C
    { name: 'Block Busters', captain: 'Steve Kim', pool: 'C' },
    { name: 'Pass Masters', captain: 'Jenny Zhao', pool: 'C' },
    { name: 'Court Kings', captain: 'Dan Murphy', pool: 'C' },
    { name: 'Volley Dollies', captain: 'Ashley Brown', pool: 'C' },
    // Pool D
    { name: 'Spike Nation', captain: 'Rob Taylor', pool: 'D' },
    { name: 'Set Wreckers', captain: 'Priya Gupta', pool: 'D' },
    { name: 'Net Effects', captain: 'Tom Wilson', pool: 'D' },
    { name: 'Bump Squad', captain: 'Nikki Lee', pool: 'D' },
  ]

  // Create pools
  const pools = {}
  for (const poolName of ['A', 'B', 'C', 'D']) {
    pools[poolName] = await prisma.tournamentPool.create({
      data: {
        tournamentId: springShowdown.id,
        name: `Pool ${poolName}`,
      },
    })
  }

  // Create teams
  const tournTeams = {}
  let seedNum = 1
  for (const t of tournTeamNames) {
    const team = await prisma.tournamentTeam.create({
      data: {
        tournamentId: springShowdown.id,
        name: t.name,
        captainName: t.captain,
        captainEmail: `${slugify(t.captain)}@email.com`,
        poolId: pools[t.pool].id,
        seed: seedNum++,
      },
    })
    tournTeams[t.name] = team
  }

  // Pool play matches (round-robin within each pool)
  for (const poolName of ['A', 'B', 'C', 'D']) {
    const poolTeamList = tournTeamNames.filter((t) => t.pool === poolName)
    for (let i = 0; i < poolTeamList.length; i++) {
      for (let j = i + 1; j < poolTeamList.length; j++) {
        const home = tournTeams[poolTeamList[i].name]
        const away = tournTeams[poolTeamList[j].name]
        const scores = [generateSetScore()]

        const match = await prisma.tournamentMatch.create({
          data: {
            poolId: pools[poolName].id,
            homeTeamId: home.id,
            awayTeamId: away.id,
            courtNumber: randomInt(6, 9),
            status: 'completed',
          },
        })

        for (let s = 0; s < scores.length; s++) {
          await prisma.tournamentSetScore.create({
            data: {
              matchId: match.id,
              setNumber: s + 1,
              homeScore: scores[s][0],
              awayScore: scores[s][1],
            },
          })
        }
      }
    }
  }

  // Create brackets
  const goldBracket = await prisma.tournamentBracket.create({
    data: {
      tournamentId: springShowdown.id,
      division: 'Gold',
    },
  })

  const silverBracket = await prisma.tournamentBracket.create({
    data: {
      tournamentId: springShowdown.id,
      division: 'Silver',
    },
  })

  // Gold bracket: top 2 from each pool (simulated — pick first 2 teams per pool)
  const goldTeams = []
  const silverTeams = []
  for (const poolName of ['A', 'B', 'C', 'D']) {
    const poolTeamList = tournTeamNames
      .filter((t) => t.pool === poolName)
      .map((t) => tournTeams[t.name])
    goldTeams.push(poolTeamList[0], poolTeamList[1])
    silverTeams.push(poolTeamList[2], poolTeamList[3])
  }

  // Gold bracket: quarterfinals (4 matches), semis (2), final (1)
  // QF matchups: A1vD2, B1vC2, C1vB2, D1vA2
  const goldQF = [
    [goldTeams[0], goldTeams[7]],
    [goldTeams[2], goldTeams[5]],
    [goldTeams[4], goldTeams[3]],
    [goldTeams[6], goldTeams[1]],
  ]

  const goldQFWinners = []
  for (let i = 0; i < goldQF.length; i++) {
    const [home, away] = goldQF[i]
    const scores = [generateSetScore()]
    const match = await prisma.tournamentMatch.create({
      data: {
        bracketId: goldBracket.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        courtNumber: 7 + (i % 2),
        status: 'completed',
        bracketRound: 1,
        bracketPosition: i + 1,
      },
    })
    for (let s = 0; s < scores.length; s++) {
      await prisma.tournamentSetScore.create({
        data: {
          matchId: match.id,
          setNumber: s + 1,
          homeScore: scores[s][0],
          awayScore: scores[s][1],
        },
      })
    }
    // Determine winner by set wins
    let homeWins = 0
    let awayWins = 0
    for (const sc of scores) {
      if (sc[0] > sc[1]) homeWins++
      else awayWins++
    }
    goldQFWinners.push(homeWins >= awayWins ? home : away)
  }

  // Gold semis
  const goldSFWinners = []
  for (let i = 0; i < 2; i++) {
    const home = goldQFWinners[i * 2]
    const away = goldQFWinners[i * 2 + 1]
    const scores = [generateSetScore()]
    const match = await prisma.tournamentMatch.create({
      data: {
        bracketId: goldBracket.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        courtNumber: 7,
        status: 'completed',
        bracketRound: 2,
        bracketPosition: i + 1,
      },
    })
    for (let s = 0; s < scores.length; s++) {
      await prisma.tournamentSetScore.create({
        data: {
          matchId: match.id,
          setNumber: s + 1,
          homeScore: scores[s][0],
          awayScore: scores[s][1],
        },
      })
    }
    let homeWins = 0
    let awayWins = 0
    for (const sc of scores) {
      if (sc[0] > sc[1]) homeWins++
      else awayWins++
    }
    goldSFWinners.push(homeWins >= awayWins ? home : away)
  }

  // Gold final
  {
    const scores = [generateSetScore()]
    const match = await prisma.tournamentMatch.create({
      data: {
        bracketId: goldBracket.id,
        homeTeamId: goldSFWinners[0].id,
        awayTeamId: goldSFWinners[1].id,
        courtNumber: 7,
        status: 'completed',
        bracketRound: 3,
        bracketPosition: 1,
      },
    })
    for (let s = 0; s < scores.length; s++) {
      await prisma.tournamentSetScore.create({
        data: {
          matchId: match.id,
          setNumber: s + 1,
          homeScore: scores[s][0],
          awayScore: scores[s][1],
        },
      })
    }
  }

  // Silver bracket: same structure
  const silverQF = [
    [silverTeams[0], silverTeams[7]],
    [silverTeams[2], silverTeams[5]],
    [silverTeams[4], silverTeams[3]],
    [silverTeams[6], silverTeams[1]],
  ]

  const silverQFWinners = []
  for (let i = 0; i < silverQF.length; i++) {
    const [home, away] = silverQF[i]
    const scores = [generateSetScore()]
    const match = await prisma.tournamentMatch.create({
      data: {
        bracketId: silverBracket.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        courtNumber: 8 + (i % 2),
        status: 'completed',
        bracketRound: 1,
        bracketPosition: i + 1,
      },
    })
    for (let s = 0; s < scores.length; s++) {
      await prisma.tournamentSetScore.create({
        data: {
          matchId: match.id,
          setNumber: s + 1,
          homeScore: scores[s][0],
          awayScore: scores[s][1],
        },
      })
    }
    let homeWins = 0
    let awayWins = 0
    for (const sc of scores) {
      if (sc[0] > sc[1]) homeWins++
      else awayWins++
    }
    silverQFWinners.push(homeWins >= awayWins ? home : away)
  }

  const silverSFWinners = []
  for (let i = 0; i < 2; i++) {
    const home = silverQFWinners[i * 2]
    const away = silverQFWinners[i * 2 + 1]
    const scores = [generateSetScore()]
    const match = await prisma.tournamentMatch.create({
      data: {
        bracketId: silverBracket.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        courtNumber: 8,
        status: 'completed',
        bracketRound: 2,
        bracketPosition: i + 1,
      },
    })
    for (let s = 0; s < scores.length; s++) {
      await prisma.tournamentSetScore.create({
        data: {
          matchId: match.id,
          setNumber: s + 1,
          homeScore: scores[s][0],
          awayScore: scores[s][1],
        },
      })
    }
    let homeWins = 0
    let awayWins = 0
    for (const sc of scores) {
      if (sc[0] > sc[1]) homeWins++
      else awayWins++
    }
    silverSFWinners.push(homeWins >= awayWins ? home : away)
  }

  // Silver final
  {
    const scores = [generateSetScore()]
    const match = await prisma.tournamentMatch.create({
      data: {
        bracketId: silverBracket.id,
        homeTeamId: silverSFWinners[0].id,
        awayTeamId: silverSFWinners[1].id,
        courtNumber: 8,
        status: 'completed',
        bracketRound: 3,
        bracketPosition: 1,
      },
    })
    for (let s = 0; s < scores.length; s++) {
      await prisma.tournamentSetScore.create({
        data: {
          matchId: match.id,
          setNumber: s + 1,
          homeScore: scores[s][0],
          awayScore: scores[s][1],
        },
      })
    }
  }

  // 2. Easter Classic (registration open)
  await prisma.tournament.create({
    data: {
      name: 'Easter Classic',
      slug: 'easter-classic',
      date: new Date('2026-04-18T12:00:00Z'),
      description: 'A fun Easter-themed volleyball tournament. Open to all skill levels!',
      format: '3 pools of 4, single elimination bracket',
      registrationFee: 200,
      maxTeams: 12,
      registrationDeadline: new Date('2026-04-11T12:00:00Z'),
      status: 'registration',
    },
  })

  // 3. May Madness (registration open)
  await prisma.tournament.create({
    data: {
      name: 'May Madness',
      slug: 'may-madness',
      date: new Date('2026-05-09T12:00:00Z'),
      description: 'Spring is in full swing! Join us for an exciting day of competitive volleyball.',
      format: '4 pools of 4, Gold/Silver bracket',
      registrationFee: 200,
      maxTeams: 16,
      registrationDeadline: new Date('2026-05-02T12:00:00Z'),
      status: 'registration',
    },
  })

  // 4. Summer Slam (registration open)
  await prisma.tournament.create({
    data: {
      name: 'Summer Slam',
      slug: 'summer-slam',
      date: new Date('2026-06-06T12:00:00Z'),
      description: 'Kick off summer with our biggest tournament of the year!',
      format: '4 pools of 4, Gold/Silver bracket',
      registrationFee: 200,
      maxTeams: 16,
      registrationDeadline: new Date('2026-05-30T12:00:00Z'),
      status: 'registration',
    },
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
