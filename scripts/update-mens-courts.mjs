// One-off: remap Sunday MENS tier→court for the active season.
//
//   Tier 1: Court 7 → 6
//   Tier 2: Court 6 → 8
//   Tier 3: Court 8 → 9
//   Tier 4: Court 9 → 10
//
// Updates Tier.courtNumber AND Match.courtNumber for upcoming weeks
// (weeks whose date is >= today). Completed weeks keep their historical
// court numbers untouched.
//
// Run:  node scripts/update-mens-courts.mjs                 (dry-run)
//       node scripts/update-mens-courts.mjs --apply         (writes)

import 'dotenv/config'

const APPLY = process.argv.includes('--apply')

// Tier → court mapping (the SAME tierNumbers, new court numbers).
const NEW_COURTS = { 1: 6, 2: 8, 3: 9, 4: 10 }

const { default: prisma } = await import('../lib/prisma.js')

const league = await prisma.league.findFirst({
  where: { slug: { contains: 'sunday' } },
})
if (!league) {
  console.error('No Sunday MENS league found.')
  process.exit(1)
}
console.log(`League: ${league.name} (slug=${league.slug})`)

const season = await prisma.season.findFirst({
  where: { leagueId: league.id, status: { in: ['active', 'registration'] } },
  orderBy: { seasonNumber: 'desc' },
})
if (!season) {
  console.error('No active/registration season for this league.')
  process.exit(1)
}
console.log(`Season: ${season.name} (#${season.seasonNumber}, status=${season.status})`)

const tiers = await prisma.tier.findMany({
  where: { seasonId: season.id },
  orderBy: { tierNumber: 'asc' },
})
console.log(`\nCurrent tiers (${tiers.length}):`)
for (const t of tiers) {
  const next = NEW_COURTS[t.tierNumber]
  const change = next != null && next !== t.courtNumber ? `→ Court ${next}` : '(no change)'
  console.log(`  Tier ${t.tierNumber}: Court ${t.courtNumber} ${change}`)
}

const today = new Date()
today.setHours(0, 0, 0, 0)
const upcomingWeeks = await prisma.week.findMany({
  where: { seasonId: season.id, date: { gte: today } },
  orderBy: { weekNumber: 'asc' },
})
console.log(`\nUpcoming weeks (${upcomingWeeks.length}):`)
for (const w of upcomingWeeks) {
  console.log(`  W${w.weekNumber} ${w.date.toISOString().slice(0, 10)}`)
}

if (!APPLY) {
  console.log('\nDRY RUN — pass --apply to write changes.')
  process.exit(0)
}

console.log('\nApplying...')
let tierUpdates = 0
let matchUpdates = 0

for (const t of tiers) {
  const next = NEW_COURTS[t.tierNumber]
  if (next == null || next === t.courtNumber) continue
  await prisma.tier.update({
    where: { id: t.id },
    data: { courtNumber: next },
  })
  tierUpdates++

  const res = await prisma.match.updateMany({
    where: {
      weekId: { in: upcomingWeeks.map((w) => w.id) },
      tierNumber: t.tierNumber,
    },
    data: { courtNumber: next },
  })
  matchUpdates += res.count
}

console.log(`\nDone. ${tierUpdates} tier(s) updated, ${matchUpdates} upcoming match court(s) updated.`)
await prisma.$disconnect()
