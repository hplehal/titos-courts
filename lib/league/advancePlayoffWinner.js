// Drops the winner of a freshly-finalized playoff match into the empty
// slot of its nextMatch — with reseeding when both QF feeders share an SF.
//
// QF → SF reseed rule (per division):
//   The two QF winners are compared by their seed (lower seed# = better).
//   The BETTER-seeded winner faces the 2 seed (SF2).
//   The WORSE-seeded winner faces the 1 seed (SF1).
//
// SF → Final: straightforward — SF1 winner is home, SF2 winner is away.
//
// Idempotent. Safe to call on retries.

import prismaClient from '@/lib/prisma'
import { PLAYOFF_ROUND } from './generatePlayoffBracket'

// Extract a numeric seed from a label like "Diamond 4". Returns
// Infinity if the label doesn't fit the pattern — used as a sort key
// when reseeding, so unparseable labels lose to parseable ones.
function seedFromLabel(label) {
  if (!label) return Infinity
  const m = label.match(/(\d+)\s*$/)
  return m ? Number(m[1]) : Infinity
}

// Determine the seed of the winning team for a QF by reading the
// home/away seed labels.
function winnerSeedOf(qf) {
  if (!qf?.winnerId) return Infinity
  const winnerIsHome = qf.winnerId === qf.homeTeamId
  return seedFromLabel(winnerIsHome ? qf.homeSeedLabel : qf.awaySeedLabel)
}

export async function advancePlayoffWinner(matchId, prisma = prismaClient) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      status: true,
      winnerId: true,
      nextMatchId: true,
      homeTeamId: true,
      awayTeamId: true,
      homeSeedLabel: true,
      awaySeedLabel: true,
      roundNumber: true,
      tierNumber: true,
      gameOrder: true,
      weekId: true,
    },
  })
  if (!match) return { advanced: false, reason: 'match not found' }
  if (match.status !== 'completed') return { advanced: false, reason: 'not final' }
  if (!match.winnerId) return { advanced: false, reason: 'no winner set' }
  if (!match.nextMatchId) return { advanced: false, reason: 'no next match (final or regular season)' }

  const next = await prisma.match.findUnique({
    where: { id: match.nextMatchId },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      roundNumber: true,
      weekId: true,
      tierNumber: true,
    },
  })
  if (!next) return { advanced: false, reason: 'next match missing' }

  // SF → Final: SF1 winner is home, SF2 winner is away.
  if (next.roundNumber === PLAYOFF_ROUND.FINAL) {
    const slot = match.gameOrder === 1 ? 'home' : 'away'
    await writeSlot(prisma, next.id, slot, match.winnerId)
    return { advanced: true, nextMatchId: next.id, slot }
  }

  // QF → SF reseeding. The two QFs in this division feed SF1 (faces seed 1)
  // and SF2 (faces seed 2). We DON'T trust the wired nextMatchId for the
  // away-slot placement — instead, whenever a QF finalizes we recompute
  // BOTH SF away slots from scratch:
  //   - better-seeded QF winner (smaller seed #)  → SF2 away (faces seed 2)
  //   - worse-seeded QF winner  (bigger seed #)   → SF1 away (faces seed 1)
  // The #1 seed must always draw the WEAKEST advancing team.
  // If only one QF is done so far, we leave the SF away slots EMPTY rather
  // than doing a partial placement that needs later correction — the second
  // QF's finalization fills both slots atomically. This removes the fragile
  // rebalance path that previously let a wrong placement persist when the
  // sibling-lookup query missed.
  if (next.roundNumber === PLAYOFF_ROUND.SF) {
    // Resolve the season so we can find the division's SFs without relying
    // on a brittle nested relation filter.
    const qfWeek = await prisma.week.findUnique({
      where: { id: match.weekId },
      select: { seasonId: true },
    })
    const seasonId = qfWeek?.seasonId

    // Both QFs in this division (same QF week + tier).
    const allQfs = await prisma.match.findMany({
      where: {
        weekId: match.weekId,
        tierNumber: match.tierNumber,
        roundNumber: PLAYOFF_ROUND.QF,
      },
      select: {
        id: true, status: true, winnerId: true,
        homeSeedLabel: true, awaySeedLabel: true,
        homeTeamId: true, awayTeamId: true, gameOrder: true,
      },
      orderBy: { gameOrder: 'asc' },
    })
    const other = allQfs.find(q => q.id !== match.id)

    // Both SFs in this division (any week in the season, SF round, same tier).
    const sfs = await prisma.match.findMany({
      where: {
        tierNumber: match.tierNumber,
        roundNumber: PLAYOFF_ROUND.SF,
        ...(seasonId ? { week: { seasonId } } : {}),
      },
      orderBy: { gameOrder: 'asc' },
      select: { id: true, gameOrder: true },
    })

    // If the sibling QF isn't decided yet, hold both away slots empty.
    if (!other || other.status !== 'completed' || !other.winnerId) {
      return { advanced: false, reason: 'awaiting sibling QF', pendingSibling: true }
    }
    if (sfs.length !== 2) {
      return { advanced: false, reason: `expected 2 SFs, found ${sfs.length}` }
    }

    const [sf1, sf2] = sfs
    const mySeed = winnerSeedOf(match)
    const otherSeed = winnerSeedOf(other)
    // Better seed (smaller number) → SF2 (faces the 2 seed).
    const betterWinnerId = mySeed < otherSeed ? match.winnerId : other.winnerId
    const worseWinnerId  = mySeed < otherSeed ? other.winnerId : match.winnerId

    await prisma.match.update({ where: { id: sf1.id }, data: { awayTeamId: worseWinnerId } })
    await prisma.match.update({ where: { id: sf2.id }, data: { awayTeamId: betterWinnerId } })
    return { advanced: true, reseeded: true, sf1: sf1.id, sf2: sf2.id }
  }

  // Default: write into whichever slot is empty.
  const slot = next.homeTeamId ? (next.awayTeamId ? null : 'away') : 'home'
  if (!slot) return { advanced: false, reason: 'both slots filled' }
  await writeSlot(prisma, next.id, slot, match.winnerId)
  return { advanced: true, nextMatchId: next.id, slot }
}

async function writeSlot(prisma, nextId, slot, winnerId) {
  const data = slot === 'home' ? { homeTeamId: winnerId } : { awayTeamId: winnerId }
  await prisma.match.update({ where: { id: nextId }, data })
}
