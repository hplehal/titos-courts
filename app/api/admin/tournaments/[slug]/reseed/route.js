import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'

export const dynamic = 'force-dynamic'

/**
 * POST — re-stamp seeds 1..N for every pool in this tournament.
 *
 * Seeds drive the canonical 4-team round-robin (Round 1: seed1 vs seed3, etc.)
 * AND the PDF ref rotation table (Round 1 ref = seed 4, Round 2 ref = seed 3, ...).
 *
 * This is SAFE to run even when matches/scores already exist: the match rows
 * reference teams by ID, not by seed, so updating `seed` doesn't touch the
 * pairings — it only affects how refs are looked up in the UI. The UI reads
 * `match.roundNumber` and maps it to a seed via the PDF table, then picks the
 * team in the pool with that seed as the ref.
 *
 * Order within each pool: existing seeds ascending (stable), null-seed teams
 * appended by name (so an all-null pool ends up seeded in alphabetical order,
 * which matches how generateRoundRobin's orderBy tiebreaker fell back and
 * therefore lines up with what the PDF expects — s1 v s3, s2 v s4, etc.).
 */
export async function POST(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      select: {
        id: true,
        pools: {
          select: {
            id: true,
            name: true,
            teams: { select: { id: true, name: true, seed: true } },
          },
        },
      },
    })
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

    let reseedCount = 0
    await prisma.$transaction(async (tx) => {
      for (const pool of t.pools) {
        const sorted = pool.teams.slice().sort((a, b) => {
          const sa = a.seed ?? Number.POSITIVE_INFINITY
          const sb = b.seed ?? Number.POSITIVE_INFINITY
          if (sa !== sb) return sa - sb
          return a.name.localeCompare(b.name)
        })
        for (let i = 0; i < sorted.length; i++) {
          const expected = i + 1
          if (sorted[i].seed === expected) continue
          await tx.tournamentTeam.update({
            where: { id: sorted[i].id },
            data: { seed: expected },
          })
          reseedCount++
        }
      }
    })

    revalidateTournament(slug)
    return NextResponse.json({
      reseeded: reseedCount,
      message: `Re-seeded ${reseedCount} team(s) across ${t.pools.length} pool(s).`,
    })
  } catch (error) {
    console.error('Reseed pools error:', error)
    return NextResponse.json({ error: 'Failed to reseed pools' }, { status: 500 })
  }
}
