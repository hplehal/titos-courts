import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateTournament } from '@/lib/server/tournaments'
import { diagnoseBracketReadiness } from '@/lib/tournament/canStartBrackets'
import { generateBracketSeeding } from '@/lib/tournament/generateBracketSeeding'
import { generateCrossoverBracket, generatePlayInMatches } from '@/lib/tournament/generateCrossoverBracket'
import { computeStandingsFromMatches } from '@/lib/tournament/calculateStandings'
import {
  courtFor,
  scheduledTimeFor,
  initialQfRef,
} from '@/lib/tournament/canonicalBracketSchedule'
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

    const readiness = await diagnoseBracketReadiness(t.id, prisma)
    if (!readiness.ok) {
      // Surface the specific pending matches so the admin knows exactly which
      // pool matches still need scores instead of a generic "not ready" error.
      return NextResponse.json(
        { error: readiness.reason, pending: readiness.pending ?? [] },
        { status: 400 },
      )
    }

    // Build the pool standings structure generateBracketSeeding expects.
    const poolsForSeeding = t.pools.map((p, idx) => {
      const label = String.fromCharCode(65 + idx) // A, B, C, ...
      const standings = computeStandingsFromMatches(p.teams, p.matches, { bracketFormat: t.bracketFormat })
      return { label, standings }
    })

    // Fork on bracketFormat. The original flow below builds Gold/Silver
    // double-brackets. The new crossover-single-elim flow builds 2 play-in
    // matches (Pool A 4-vs-5, Pool B 4-vs-5) plus the 8-team single-elim
    // bracket described in the May 23 Captain's Package.
    if (t.bracketFormat === 'crossover-single-elim') {
      const result = await generateCrossoverBracketAndPlayIns({
        tournament: t,
        pools: poolsForSeeding,
      })
      revalidateTournament(slug)
      return NextResponse.json(result, { status: 201 })
    }

    const createdBrackets = []
    const kickoff = t.date ? new Date(t.date) : null

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
            courtNumber: courtFor({ division, bracketRound: BRACKET_ROUND.FINAL, bracketPosition: 0 }),
            scheduledTime: scheduledTimeFor({ kickoff, bracketRound: BRACKET_ROUND.FINAL, bracketPosition: 0 }),
          },
        })
        finalId = finalMatch.id
      }

      // SF shells — each SF feeds `finalId` (when present).
      // Per PDF: same-court QFs feed the same SF. QF pos 0 & pos 2 (both
      // on the lower court) feed SF pos 0; QF pos 1 & pos 3 (both on the
      // upper court) feed SF pos 1. So SF s is fed by QFs at positions
      // `s` and `s + 2` — labels below reflect that.
      const sfIds = []
      for (let s = 0; s < sfCount; s++) {
        const sf = await prisma.tournamentMatch.create({
          data: {
            bracketId: bracket.id,
            bracketRound: BRACKET_ROUND.SEMIFINAL,
            bracketPosition: s,
            homeSeedLabel: `QF${s + 1} Winner`,
            awaySeedLabel: `QF${s + 3} Winner`,
            nextMatchId: finalId, // SF winners advance to the single Final
            status: MATCH_STATUS.SCHEDULED,
            courtNumber: courtFor({ division, bracketRound: BRACKET_ROUND.SEMIFINAL, bracketPosition: s }),
            scheduledTime: scheduledTimeFor({ kickoff, bracketRound: BRACKET_ROUND.SEMIFINAL, bracketPosition: s }),
          },
        })
        sfIds.push(sf.id)
      }

      // QF matches — same-court wiring: QF at position i feeds sfIds[i % 2]
      // so (pos 0, pos 2) both feed SF0 and (pos 1, pos 3) both feed SF1.
      const createdQfs = []
      for (let i = 0; i < qfCount; i++) {
        const qf = qfSeeds[i]
        const sfIndex = i % sfCount
        const created = await prisma.tournamentMatch.create({
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
            courtNumber: courtFor({ division, bracketRound: BRACKET_ROUND.QUARTERFINAL, bracketPosition: i }),
            scheduledTime: scheduledTimeFor({ kickoff, bracketRound: BRACKET_ROUND.QUARTERFINAL, bracketPosition: i }),
          },
        })
        createdQfs.push(created)
      }

      // Pass 2: assign the generation-time refs for the two 1:00 PM QFs.
      // Each gets its ref from the HOME team of the QF playing the same court
      // at 1:45 PM (guaranteed idle, known at this point). Later slots get
      // their refs via advanceBracketWinner once earlier matches finalize.
      for (const qf of createdQfs) {
        const refTeamId = initialQfRef(qf, createdQfs)
        if (refTeamId) {
          await prisma.tournamentMatch.update({
            where: { id: qf.id },
            data: { refTeamId },
          })
        }
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
 * DELETE — tear down ALL bracket matches and brackets, unconditionally.
 *
 * This is an explicit admin "wipe the bracket" action (distinct from the
 * per-match "clear scores" button). It cascades:
 *   1) Wipe every TournamentSetScore attached to a bracket match.
 *   2) Null every nextMatchId pointer so the self-FK chain is safe to drop.
 *   3) Delete the bracket matches, then the brackets themselves.
 *
 * Scores are intentionally NOT a guard here: once pool play advances the
 * wrong teams or the schedule itself is wrong, the only recovery is to
 * regenerate — which requires this to actually succeed.
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
      select: { id: true },
    })
    const ids = matches.map(m => m.id)

    if (ids.length) {
      // Transaction so a partial teardown never leaves dangling FK refs —
      // either the whole bracket is gone or nothing changed.
      await prisma.$transaction([
        prisma.tournamentSetScore.deleteMany({ where: { matchId: { in: ids } } }),
        prisma.tournamentMatch.updateMany({
          where: { id: { in: ids } },
          data: { nextMatchId: null },
        }),
        prisma.tournamentMatch.deleteMany({ where: { id: { in: ids } } }),
        prisma.tournamentBracket.deleteMany({ where: { tournamentId: t.id } }),
      ])
    } else {
      // No matches — just drop any orphan bracket rows.
      await prisma.tournamentBracket.deleteMany({ where: { tournamentId: t.id } })
    }

    revalidateTournament(slug)
    return NextResponse.json({ success: true, deletedMatches: ids.length })
  } catch (error) {
    console.error('Delete brackets error:', error)
    return NextResponse.json({ error: 'Failed to delete brackets' }, { status: 500 })
  }
}

/* ──────────────────────────────────────────────────────────────
   Crossover-single-elim generator
   ──────────────────────────────────────────────────────────────
   Builds the May 23 Titos REC Tournament playoff structure:
     - 2 play-in matches (stage='play-in', 1 set to 25 cap 27)
         · Pool A 4-vs-5 on Court 1
         · Pool B 4-vs-5 on Court 2
     - 8-team single-elim bracket (best of 3, 25/25/15 no cap):
         · QF1 A1  vs W-PI2  | Court 1
         · QF2 B1  vs W-PI1  | Court 2
         · QF3 B2  vs A3     | Court 1
         · QF4 A2  vs B3     | Court 2
         · SF1 WQF1 vs WQF3  | Court 1
         · SF2 WQF2 vs WQF4  | Court 2
         · F   WSF1 vs WSF2  | Court 1

   Play-in winners are wired into QF1/QF2 via nextMatchId so the
   existing advanceBracketWinner helper fills the slot automatically
   once the play-in match goes FINAL.
*/
async function generateCrossoverBracketAndPlayIns({ tournament, pools }) {
  const playoffStartHourLocal = 13  // 1:00 PM (post pool play)
  const baseDate = tournament.date ? new Date(tournament.date) : new Date()
  const dayOffsetMinutes = (h, m) => {
    const d = new Date(baseDate)
    d.setHours(h, m, 0, 0)
    return d
  }
  // Scheduling roughly: play-ins 12:30 PM, QF 1:00 / 1:45 PM, SF 2:30, F 3:15
  const TIMES = {
    playIn: dayOffsetMinutes(12, 30),
    qfEarly: dayOffsetMinutes(13, 0),
    qfLate:  dayOffsetMinutes(13, 45),
    sf:      dayOffsetMinutes(14, 30),
    final:   dayOffsetMinutes(15, 15),
  }
  const bracketMatchFormat = tournament.bracketMatchFormat || 'bo3-25-15-no-cap'
  const playInMatchFormat = tournament.poolMatchFormat || 'pool-1set-25-cap-27'

  // One container bracket — there is only one division in this format.
  const bracket = await prisma.tournamentBracket.create({
    data: { tournamentId: tournament.id, division: 'Open' },
  })

  // Create FINAL first so SFs can reference it via nextMatchId. The chain
  // of forward references mirrors the gold-silver flow above.
  const finalMatch = await prisma.tournamentMatch.create({
    data: {
      bracketId: bracket.id,
      bracketRound: BRACKET_ROUND.FINAL,
      bracketPosition: 0,
      homeSeedLabel: 'W SF1',
      awaySeedLabel: 'W SF2',
      status: MATCH_STATUS.SCHEDULED,
      stage: 'bracket',
      matchFormat: bracketMatchFormat,
      courtNumber: 1,
      scheduledTime: TIMES.final,
    },
  })

  // Two SFs pointing at the Final.
  const sf1 = await prisma.tournamentMatch.create({
    data: {
      bracketId: bracket.id,
      bracketRound: BRACKET_ROUND.SEMIFINAL,
      bracketPosition: 0,
      homeSeedLabel: 'W QF1',
      awaySeedLabel: 'W QF3',
      nextMatchId: finalMatch.id,
      status: MATCH_STATUS.SCHEDULED,
      stage: 'bracket',
      matchFormat: bracketMatchFormat,
      courtNumber: 1,
      scheduledTime: TIMES.sf,
    },
  })
  const sf2 = await prisma.tournamentMatch.create({
    data: {
      bracketId: bracket.id,
      bracketRound: BRACKET_ROUND.SEMIFINAL,
      bracketPosition: 1,
      homeSeedLabel: 'W QF2',
      awaySeedLabel: 'W QF4',
      nextMatchId: finalMatch.id,
      status: MATCH_STATUS.SCHEDULED,
      stage: 'bracket',
      matchFormat: bracketMatchFormat,
      courtNumber: 2,
      scheduledTime: TIMES.sf,
    },
  })

  // Crossover bracket plan from the library (positions + seed labels +
  // courts only — team IDs filled below once we know play-in slots).
  const plan = generateCrossoverBracket(pools)

  // QF order: QF1 + QF3 share Court 1, QF2 + QF4 share Court 2.
  const qfCreate = async (qfPlan, sfId, court, scheduledTime) => prisma.tournamentMatch.create({
    data: {
      bracketId: bracket.id,
      bracketRound: BRACKET_ROUND.QUARTERFINAL,
      bracketPosition: qfPlan.slot - 1,
      homeTeamId: qfPlan.teamAId ?? null,
      awayTeamId: qfPlan.teamBId ?? null,
      homeSeedLabel: qfPlan.teamASeedLabel,
      awaySeedLabel: qfPlan.teamBSeedLabel,
      nextMatchId: sfId,
      status: MATCH_STATUS.SCHEDULED,
      stage: 'bracket',
      matchFormat: bracketMatchFormat,
      courtNumber: court,
      scheduledTime,
    },
  })
  const qf1 = await qfCreate(plan.quarters[0], sf1.id, 1, TIMES.qfEarly)
  const qf2 = await qfCreate(plan.quarters[1], sf2.id, 2, TIMES.qfEarly)
  const qf3 = await qfCreate(plan.quarters[2], sf1.id, 1, TIMES.qfLate)
  const qf4 = await qfCreate(plan.quarters[3], sf2.id, 2, TIMES.qfLate)

  // Play-in matches sit BEFORE the bracket round numbering — we model them
  // with bracketRound=null (they live in their own stage) and wire each
  // play-in's nextMatchId at QF1/QF2 so advanceBracketWinner drops the
  // winner into the right home/away slot when the play-in goes FINAL.
  const playIns = generatePlayInMatches(pools)
  const createdPlayIns = []
  for (let i = 0; i < playIns.length; i++) {
    const pi = playIns[i]
    // Pool A play-in (i=0) feeds QF2; Pool B play-in (i=1) feeds QF1.
    const feedsQfId = i === 0 ? qf2.id : qf1.id
    const created = await prisma.tournamentMatch.create({
      data: {
        bracketId: bracket.id,
        bracketRound: null,
        bracketPosition: i,
        homeTeamId: pi.teamAId,
        awayTeamId: pi.teamBId,
        homeSeedLabel: pi.teamASeedLabel,
        awaySeedLabel: pi.teamBSeedLabel,
        nextMatchId: feedsQfId,
        status: MATCH_STATUS.SCHEDULED,
        stage: 'play-in',
        matchFormat: playInMatchFormat,
        courtNumber: i === 0 ? 1 : 2,
        scheduledTime: TIMES.playIn,
      },
    })
    createdPlayIns.push(created)
  }

  return {
    bracket: { id: bracket.id, division: 'Open' },
    playIns: createdPlayIns.length,
    quarterfinals: 4,
    semifinals: 2,
    final: 1,
  }
}
