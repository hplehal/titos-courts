import { describe, it, expect } from 'vitest'
import { advancePlayoffWinner } from '@/lib/league/advancePlayoffWinner'

// Builds a minimal in-memory Prisma double for the playoff advance logic.
// Only the calls advancePlayoffWinner actually makes are implemented.
function makePrisma({ matches, weeks }) {
  const byId = Object.fromEntries(matches.map(m => [m.id, m]))
  return {
    match: {
      findUnique: async ({ where: { id }, select }) => byId[id] || null,
      findMany: async ({ where }) => {
        return matches.filter(m => {
          if (where.weekId && m.weekId !== where.weekId) return false
          if (where.tierNumber != null && m.tierNumber !== where.tierNumber) return false
          if (where.roundNumber != null && m.roundNumber !== where.roundNumber) return false
          if (where.week?.seasonId && weeks[m.weekId]?.seasonId !== where.week.seasonId) return false
          return true
        }).sort((a, b) => (a.gameOrder ?? 0) - (b.gameOrder ?? 0))
      },
      update: async ({ where: { id }, data }) => {
        Object.assign(byId[id], data)
        return byId[id]
      },
    },
    week: {
      findUnique: async ({ where: { id } }) => weeks[id] || null,
    },
  }
}

describe('advancePlayoffWinner — QF→SF reseed', () => {
  // Diamond division: seeds 1..6. QF1 = 3 v 6, QF2 = 4 v 5.
  // Winners: seed 3 (QF1) and seed 4 (QF2). The #1 seed must face the
  // WORSE winner (seed 4); the #2 seed faces the BETTER winner (seed 3).
  function diamondFixture() {
    const weeks = {
      w10: { id: 'w10', seasonId: 's1' },
      w11: { id: 'w11', seasonId: 's1' },
    }
    const matches = [
      { id: 'qf1', weekId: 'w10', tierNumber: 1, roundNumber: 1, gameOrder: 1,
        status: 'completed', winnerId: 't3', homeTeamId: 't3', awayTeamId: 't6',
        homeSeedLabel: 'Diamond 3', awaySeedLabel: 'Diamond 6', nextMatchId: 'sf1' },
      { id: 'qf2', weekId: 'w10', tierNumber: 1, roundNumber: 1, gameOrder: 2,
        status: 'completed', winnerId: 't4', homeTeamId: 't4', awayTeamId: 't5',
        homeSeedLabel: 'Diamond 4', awaySeedLabel: 'Diamond 5', nextMatchId: 'sf2' },
      { id: 'sf1', weekId: 'w11', tierNumber: 1, roundNumber: 2, gameOrder: 1,
        status: 'scheduled', winnerId: null, homeTeamId: 't1', awayTeamId: null,
        homeSeedLabel: 'Diamond 1', awaySeedLabel: 'Lower QF Winner', nextMatchId: 'final' },
      { id: 'sf2', weekId: 'w11', tierNumber: 1, roundNumber: 2, gameOrder: 2,
        status: 'scheduled', winnerId: null, homeTeamId: 't2', awayTeamId: null,
        homeSeedLabel: 'Diamond 2', awaySeedLabel: 'Higher QF Winner', nextMatchId: 'final' },
    ]
    return { weeks, matches }
  }

  it('puts the WORSE QF winner against the 1 seed (SF1) and the BETTER against the 2 seed (SF2)', async () => {
    const fx = diamondFixture()
    const prisma = makePrisma(fx)
    const res = await advancePlayoffWinner('qf2', prisma)
    expect(res.advanced).toBe(true)
    expect(res.reseeded).toBe(true)

    const sf1 = fx.matches.find(m => m.id === 'sf1')
    const sf2 = fx.matches.find(m => m.id === 'sf2')
    // seed 4 (worse) faces the 1 seed; seed 3 (better) faces the 2 seed.
    expect(sf1.awayTeamId).toBe('t4')
    expect(sf2.awayTeamId).toBe('t3')
  })

  it('is order-independent — same result whichever QF finalizes the callback', async () => {
    const fx = diamondFixture()
    const prisma = makePrisma(fx)
    // Fire on qf1 instead of qf2 — result must be identical.
    await advancePlayoffWinner('qf1', prisma)
    const sf1 = fx.matches.find(m => m.id === 'sf1')
    const sf2 = fx.matches.find(m => m.id === 'sf2')
    expect(sf1.awayTeamId).toBe('t4')
    expect(sf2.awayTeamId).toBe('t3')
  })

  it('holds SF away slots EMPTY until the sibling QF is decided', async () => {
    const fx = diamondFixture()
    // QF2 not finished yet.
    fx.matches.find(m => m.id === 'qf2').status = 'scheduled'
    fx.matches.find(m => m.id === 'qf2').winnerId = null
    const prisma = makePrisma(fx)
    const res = await advancePlayoffWinner('qf1', prisma)
    expect(res.advanced).toBe(false)
    expect(res.pendingSibling).toBe(true)
    expect(fx.matches.find(m => m.id === 'sf1').awayTeamId).toBe(null)
    expect(fx.matches.find(m => m.id === 'sf2').awayTeamId).toBe(null)
  })

  it('handles a 5-seed upset winner — worse winner (5) still draws the 1 seed', async () => {
    const fx = diamondFixture()
    // QF2: seed 5 upsets seed 4.
    const qf2 = fx.matches.find(m => m.id === 'qf2')
    qf2.winnerId = 't5'
    const prisma = makePrisma(fx)
    await advancePlayoffWinner('qf2', prisma)
    // Winners are seed 3 (better) and seed 5 (worse).
    expect(fx.matches.find(m => m.id === 'sf1').awayTeamId).toBe('t5') // worse → 1 seed
    expect(fx.matches.find(m => m.id === 'sf2').awayTeamId).toBe('t3') // better → 2 seed
  })
})

describe('advancePlayoffWinner — SF→Final', () => {
  it('SF1 winner is home, SF2 winner is away in the Final', async () => {
    const weeks = { w11: { id: 'w11', seasonId: 's1' } }
    const matches = [
      { id: 'sf1', weekId: 'w11', tierNumber: 1, roundNumber: 2, gameOrder: 1,
        status: 'completed', winnerId: 't1', homeTeamId: 't1', awayTeamId: 't4',
        homeSeedLabel: 'Diamond 1', awaySeedLabel: 'Lower QF Winner', nextMatchId: 'final' },
      { id: 'final', weekId: 'w11', tierNumber: 1, roundNumber: 3, gameOrder: 1,
        status: 'scheduled', winnerId: null, homeTeamId: null, awayTeamId: null,
        homeSeedLabel: 'W SF1', awaySeedLabel: 'W SF2', nextMatchId: null },
    ]
    const prisma = makePrisma({ weeks, matches })
    const res = await advancePlayoffWinner('sf1', prisma)
    expect(res.advanced).toBe(true)
    expect(matches.find(m => m.id === 'final').homeTeamId).toBe('t1')
  })
})
