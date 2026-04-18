import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { canStartBrackets } from '@/lib/tournament/canStartBrackets'
import { generateBracketSeeding } from '@/lib/tournament/generateBracketSeeding'
import { computeStandingsFromMatches } from '@/lib/tournament/calculateStandings'
import {
  DIVISIONS,
  MATCH_STATUS, BRACKET_ROUND,
} from '@/lib/tournament/constants'

export const dynamic = 'force-dynamic'

/**
 * POST — generate Gold + Silver brackets.
 *
 * Flow:
 *   1. Verify every pool match is FINAL (canStartBrackets).
 *   2. For each pool, compute standings to resolve seed labels (A1, A2, ...).
 *   3. Build seeded QF matches via generateBracketSeeding.
 *   4. Create SF and F shell matches.
 *   5. Wire nextMatchId chain: QF → SF → F.
 *
 * Refuses if brackets already exist — admin must explicitly delete first.
 */
export async function POST(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        pools: {
          orderBy: { name: 'asc' },
          include: {
            teams: { select: { id: true, name: true } },
            matches: {
              include: { scores: { orderBy: { setNumber: 'asc' } } },
            },
          },
        },
        brackets: { select: { id: true } },
      },
    })
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    if (t.brackets.length > 0) {
      return NextResponse.json(
        { error: 'Brackets already generated. Delete first to regenerate.' },
        { status: 409 },
      )
    }

    const ready = await canStartBrackets(t.id, prisma)
    if (!ready) {
      return NextResponse.json(
        { error: 'Not all pool matches are complete yet.' },
        { status: 400 },
      )
    }

    // Build the pool standings structure generateBracketSeeding expects.
    const poolsForSeeding = t.pools.map((p, idx) => {
      const label = String.fromCharCode(65 + idx) // A, B, C, ...
      const standings = computeStandingsFromMatches(p.teams, p.matches)
      return { label, standings }
    })

    const createdBrackets = []

    for (const division of DIVISIONS) {
      const qfSeeds = generateBracketSeeding(poolsForSeeding, division)
      if (!qfSeeds.length) continue

      const bracket = await prisma.tournamentBracket.create({
        data: { tournamentId: t.id, division },
      })

      // Strategy: create Final first, then SFs (pointing at final), then QFs (pointing at SFs).
      // nextMatchId is a forward reference, so inserting downstream first keeps FK happy.

      const qfCount = qfSeeds.length
      const sfCount = Math.ceil(qfCount / 2)
      const needsFinal = sfCount >= 2

      let finalId = null
      if (needsFinal) {
        const finalMatch = await prisma.tournamentMatch.create({
          data: {
            bracketId: bracket.id,
            bracketRound: BRACKET_ROUND.FINAL,
            bracketPosition: 0,
            homeSeedLabel: 'SF1 Winner',
            awaySeedLabel: 'SF2 Winner',
            status: MATCH_STATUS.SCHEDULED,
          },
        })
        finalId = finalMatch.id
      }

      // SF shells — each SF feeds `finalId` (when present).
      const sfIds = []
      for (let s = 0; s < sfCount; s++) {
        const sf = await prisma.tournamentMatch.create({
          data: {
            bracketId: bracket.id,
            bracketRound: BRACKET_ROUND.SEMIFINAL,
            bracketPosition: s,
            homeSeedLabel: `QF${s * 2 + 1} Winner`,
            awaySeedLabel: `QF${s * 2 + 2} Winner`,
            nextMatchId: finalId, // SF winners advance to the single Final
            status: MATCH_STATUS.SCHEDULED,
          },
        })
        sfIds.push(sf.id)
      }

      // QF matches — each QF feeds sfIds[floor(i/2)].
      for (let i = 0; i < qfCount; i++) {
        const qf = qfSeeds[i]
        const sfIndex = Math.floor(i / 2)
        await prisma.tournamentMatch.create({
          data: {
            bracketId: bracket.id,
            bracketRound: BRACKET_ROUND.QUARTERFINAL,
            bracketPosition: i,
            homeTeamId: qf.teamAId ?? null,
            awayTeamId: qf.teamBId ?? null,
            homeSeedLabel: qf.teamASeedLabel ?? null,
            awaySeedLabel: qf.teamBSeedLabel ?? null,
            nextMatchId: sfIds[sfIndex] ?? null,
            status: MATCH_STATUS.SCHEDULED,
          },
        })
      }

      createdBrackets.push({ id: bracket.id, division, qf: qfCount, sf: sfCount, final: needsFinal ? 1 : 0 })
    }

    revalidateTournament(slug)
    return NextResponse.json({ brackets: createdBrackets }, { status: 201 })
  } catch (error) {
    console.error('Generate brackets error:', error)
    return NextResponse.json({ error: 'Failed to generate brackets' }, { status: 500 })
  }
}

/**
 * DELETE — tear down all bracket matches and brackets (only if no scores saved).
 */
export async function DELETE(request, { params }) {
  if (!checkAdminPassword(request)) return unauthorized()
  const { slug } = await params
  try {
    const t = await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!t) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

    const matches = await prisma.tournamentMatch.findMany({
      where: { bracket: { tournamentId: t.id } },
      select: { id: true, scores: { select: { id: true } } },
    })
    const hasScores = matches.some(m => m.scores.length > 0)
    if (hasScores) {
      return NextResponse.json(
        { error: 'Cannot delete — bracket matches have scores entered.' },
        { status: 409 },
      )
    }

    const ids = matches.map(m => m.id)
    if (ids.length) {
      // Null nextMatchId chain first to avoid FK constraints on delete
      await prisma.tournamentMatch.updateMany({ where: { id: { in: ids } }, data: { nextMatchId: null } })
      await prisma.tournamentSetScore.deleteMany({ where: { matchId: { in: ids } } })
      await prisma.tournamentMatch.deleteMany({ where: { id: { in: ids } } })
    }
    await prisma.tournamentBracket.deleteMany({ where: { tournamentId: t.id } })

    revalidateTournament(slug)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete brackets error:', error)
    return NextResponse.json({ error: 'Failed to delete brackets' }, { status: 500 })
  }
}
