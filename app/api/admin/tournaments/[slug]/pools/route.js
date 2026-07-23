import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { poolLabel } from '@/lib/tournament/constants'

export const dynamic = 'force-dynamic'

// Fisher-Yates shuffle using crypto.getRandomValues so the draw is actually
// unbiased (Math.random has subtle bias on V8 for our small arrays, but more
// importantly this makes the randomness auditable — same code runs every time).
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const rand = new Uint32Array(1)
    crypto.getRandomValues(rand)
    const j = rand[0] % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * POST — generate pools (A, B, C...) based on tournament.poolCount AND auto-draw
 * the existing teams into them randomly.
 *
 * Draw rules:
 *   - Shuffle all teams (Fisher-Yates, crypto RNG).
 *   - Deal round-robin across pools — pool[0] gets team[0], pool[1] gets team[1], ...
 *     wraps back to pool[0]. This keeps pool sizes within ±1 of each other even
 *     when teamCount isn't a clean multiple of poolCount.
 *   - Respect poolSize as a hard cap: if there are more teams than poolCount × poolSize,
 *     the extras stay unassigned for the admin to handle manually.
 *
 * Refuses if any pools already exist for this tournament.
 */
export async function POST(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      select: {
        id: true,
        poolCount: true,
        poolSize: true,
        pools: { select: { id: true } },
        tournamentTeams: { select: { id: true } },
      },
    })
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    if (t.pools.length > 0) {
      return NextResponse.json({ error: 'Pools already exist. Tear down first.' }, { status: 409 })
    }
    const count = Number(t.poolCount) || 0
    if (count < 1) {
      return NextResponse.json({ error: 'Set poolCount on tournament first' }, { status: 400 })
    }
    const sizeCap = Number(t.poolSize) || Infinity

    // Create pools first so we know their IDs for the team assignment step.
    const pools = await prisma.$transaction(
      Array.from({ length: count }, (_, i) =>
        prisma.tournamentPool.create({
          data: { tournamentId: t.id, name: `Pool ${poolLabel(i)}` },
        }),
      ),
    )

    // Random draw — only if teams exist. Admins can also create empty pools first
    // (e.g. if they plan to add teams after generating), which is still supported.
    let assignedCount = 0
    let skipped = 0
    if (t.tournamentTeams.length > 0) {
      const shuffled = shuffle(t.tournamentTeams.map(tm => tm.id))
      const perPool = pools.map(() => []) // teamIds per pool
      for (const teamId of shuffled) {
        // Find pool with fewest teams (round-robin with cap).
        const target = perPool
          .map((ids, i) => ({ i, len: ids.length }))
          .filter(p => p.len < sizeCap)
          .sort((a, b) => a.len - b.len)[0]
        if (!target) { skipped++; continue } // all pools full
        perPool[target.i].push(teamId)
      }

      // Stamp poolId + seed. Seed = 1-based position within the pool (order
      // of draw). Seed feeds the canonical round-robin ordering in
      // generateRoundRobin, so seed 1 is the "top of the card" team.
      const updates = []
      perPool.forEach((teamIds, poolIdx) => {
        teamIds.forEach((teamId, seedIdx) => {
          updates.push(
            prisma.tournamentTeam.update({
              where: { id: teamId },
              data: { poolId: pools[poolIdx].id, seed: seedIdx + 1 },
            }),
          )
          assignedCount++
        })
      })
      if (updates.length > 0) await prisma.$transaction(updates)
    }

    revalidateTournament(slug)
    return NextResponse.json(
      { pools, assigned: assignedCount, skipped },
      { status: 201 },
    )
  } catch (error) {
    console.error('Generate pools error:', error)
    return NextResponse.json({ error: 'Failed to generate pools' }, { status: 500 })
  }
}

/**
 * DELETE — tear down pools (for re-draw). Only allowed when no matches exist yet.
 */
export async function DELETE(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      select: {
        id: true,
        pools: {
          select: { id: true, _count: { select: { matches: true } } },
        },
      },
    })
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

    const hasMatches = t.pools.some(p => p._count.matches > 0)
    if (hasMatches) {
      return NextResponse.json(
        { error: 'Cannot tear down — pools have matches. Clear schedule first.' },
        { status: 409 },
      )
    }

    await prisma.$transaction([
      // Unlink teams from pools AND clear seeds (next draw assigns fresh seeds).
      prisma.tournamentTeam.updateMany({
        where: { tournamentId: t.id },
        data: { poolId: null, seed: null },
      }),
      prisma.tournamentPool.deleteMany({ where: { tournamentId: t.id } }),
    ])
    revalidateTournament(slug)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tear down pools error:', error)
    return NextResponse.json({ error: 'Failed to tear down pools' }, { status: 500 })
  }
}
