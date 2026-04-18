import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'

export const dynamic = 'force-dynamic'

/**
 * Re-stamp seeds 1..N for every team in a pool.
 *
 * Seeds drive BOTH the canonical 4-team round-robin pairings (Round 1 is
 * seed1 v seed3 etc.) AND the PDF ref rotation table (Round 1 ref = seed 4).
 * Any time the membership of a pool changes, we must re-stamp the pool so
 * seeds stay contiguous — otherwise you get duplicates ("two seed 2s") or
 * gaps ("no seed 2"), which corrupt both match generation and reffing.
 *
 * Order within the pool: keep existing seed order (stable), with newly-added
 * teams (seed == null) at the end in name order. Teams moved INTO the pool
 * therefore land at the bottom of the seeding by default — the admin can
 * always edit a team's record afterwards if they want a specific seeding.
 */
async function reseedPool(tx, poolId) {
  if (!poolId) return
  const teams = await tx.tournamentTeam.findMany({
    where: { poolId },
    select: { id: true, seed: true, name: true },
  })
  // Sort: existing seeds first (ascending), new members last (by name).
  teams.sort((a, b) => {
    const sa = a.seed ?? Number.POSITIVE_INFINITY
    const sb = b.seed ?? Number.POSITIVE_INFINITY
    if (sa !== sb) return sa - sb
    return a.name.localeCompare(b.name)
  })
  // Re-stamp 1..N.
  for (let i = 0; i < teams.length; i++) {
    const expected = i + 1
    if (teams[i].seed === expected) continue
    await tx.tournamentTeam.update({
      where: { id: teams[i].id },
      data: { seed: expected },
    })
  }
}

/**
 * PATCH — assign a team to a pool (or unassign: poolId=null).
 * Body: { teamId, poolId | null }
 * Refuses if either the source or target pool already has matches
 * (would orphan the schedule / break seeded ref rotation).
 *
 * On every move we re-stamp seeds 1..N for BOTH the source pool
 * (the team's old pool) and the destination pool, so the canonical
 * round-robin and ref-by-seed table stay correct.
 */
export async function PATCH(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const body = await request.json()
    const { teamId, poolId } = body
    if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

    // Load the team so we know the previous pool (for re-seeding on exit).
    const existing = await prisma.tournamentTeam.findUnique({
      where: { id: teamId },
      select: { id: true, poolId: true },
    })
    if (!existing) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    if (poolId) {
      const pool = await prisma.tournamentPool.findUnique({
        where: { id: poolId },
        select: { _count: { select: { matches: true } } },
      })
      if (!pool) return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
      if (pool._count.matches > 0) {
        return NextResponse.json(
          { error: 'Pool schedule already generated — cannot reassign teams.' },
          { status: 409 },
        )
      }
    }

    // If the source pool already has matches, refuse too — moving a team out
    // would leave dangling match rows pointing at a team no longer in the pool.
    if (existing.poolId && existing.poolId !== poolId) {
      const src = await prisma.tournamentPool.findUnique({
        where: { id: existing.poolId },
        select: { _count: { select: { matches: true } } },
      })
      if (src && src._count.matches > 0) {
        return NextResponse.json(
          { error: 'Source pool already has a schedule — clear it before moving teams.' },
          { status: 409 },
        )
      }
    }

    const team = await prisma.$transaction(async (tx) => {
      // On UNASSIGN (poolId=null), clear the team's seed too so a later re-add
      // doesn't carry a stale number into a new pool.
      const updated = await tx.tournamentTeam.update({
        where: { id: teamId },
        data: { poolId: poolId || null, seed: poolId ? undefined : null },
      })

      // Re-stamp seeds for every pool whose membership changed.
      const touched = new Set()
      if (existing.poolId && existing.poolId !== poolId) touched.add(existing.poolId)
      if (poolId) touched.add(poolId)
      for (const pid of touched) {
        await reseedPool(tx, pid)
      }
      return updated
    })

    revalidateTournament(slug)
    return NextResponse.json({ team })
  } catch (error) {
    console.error('Assign team to pool error:', error)
    return NextResponse.json({ error: 'Failed to assign team' }, { status: 500 })
  }
}
