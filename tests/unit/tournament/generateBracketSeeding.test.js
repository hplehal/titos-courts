import { describe, it, expect } from 'vitest'
import { generateBracketSeeding } from '@/lib/tournament/generateBracketSeeding'
import { DIVISION_GOLD, DIVISION_SILVER } from '@/lib/tournament/constants'

// Helper — build a 4-pool setup with N teams per pool and labeled seeds.
// Each standings row is { teamId, name } as returned by calculateStandings.
function poolWith(label, teamCount = 4) {
  const standings = []
  for (let i = 0; i < teamCount; i++) {
    standings.push({ teamId: `${label}${i + 1}`, name: `${label} Seed ${i + 1}` })
  }
  return { label, standings }
}

describe('generateBracketSeeding — 4 pools / Gold bracket', () => {
  const pools = [poolWith('A'), poolWith('B'), poolWith('C'), poolWith('D')]

  it('produces 4 QF matches', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    expect(matches).toHaveLength(4)
    expect(matches.every(m => m.round === 1)).toBe(true)
  })

  it('pairs top seeds with second seeds from a different pool', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    // All matches must cross pools — verify no first-round rematch of pool opponents
    for (const m of matches) {
      const poolA = m.teamASeedLabel[0]
      const poolB = m.teamBSeedLabel[0]
      expect(poolA).not.toBe(poolB)
    }
  })

  it('uses rank-1 and rank-2 seeds (Gold)', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    // A-side must always be "<pool>1", B-side must always be "<pool>2"
    for (const m of matches) {
      expect(m.teamASeedLabel).toMatch(/^[A-D]1$/)
      expect(m.teamBSeedLabel).toMatch(/^[A-D]2$/)
    }
  })

  it('includes every pool as a top seed exactly once', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    const topSides = matches.map(m => m.teamASeedLabel).sort()
    expect(topSides).toEqual(['A1', 'B1', 'C1', 'D1'])
  })

  it('includes every pool as a second seed exactly once', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    const secondSides = matches.map(m => m.teamBSeedLabel).sort()
    expect(secondSides).toEqual(['A2', 'B2', 'C2', 'D2'])
  })
})

describe('generateBracketSeeding — 4 pools / Silver bracket', () => {
  const pools = [poolWith('A'), poolWith('B'), poolWith('C'), poolWith('D')]

  it('uses rank-3 and rank-4 seeds', () => {
    const matches = generateBracketSeeding(pools, DIVISION_SILVER)
    expect(matches).toHaveLength(4)
    for (const m of matches) {
      expect(m.teamASeedLabel).toMatch(/^[A-D]3$/)
      expect(m.teamBSeedLabel).toMatch(/^[A-D]4$/)
    }
  })

  it('silver matches also cross pools (no first-round rematches)', () => {
    const matches = generateBracketSeeding(pools, DIVISION_SILVER)
    for (const m of matches) {
      expect(m.teamASeedLabel[0]).not.toBe(m.teamBSeedLabel[0])
    }
  })
})

describe('generateBracketSeeding — 3 pools (6-team bracket)', () => {
  const pools = [poolWith('A'), poolWith('B'), poolWith('C')]

  it('produces 3 QF matches crossing pools', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    expect(matches).toHaveLength(3)
    for (const m of matches) {
      expect(m.teamASeedLabel[0]).not.toBe(m.teamBSeedLabel[0])
    }
  })
})

describe('generateBracketSeeding — 6 pools (12-team bracket)', () => {
  const pools = Array.from({ length: 6 }, (_, i) => poolWith(String.fromCharCode(65 + i)))

  it('produces 6 QF matches crossing pools', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    expect(matches).toHaveLength(6)
    for (const m of matches) {
      expect(m.teamASeedLabel[0]).not.toBe(m.teamBSeedLabel[0])
    }
  })
})

describe('generateBracketSeeding — edge cases', () => {
  it('returns empty for < 2 pools', () => {
    expect(generateBracketSeeding([], DIVISION_GOLD)).toEqual([])
    expect(generateBracketSeeding([poolWith('A')], DIVISION_GOLD)).toEqual([])
  })

  it('skips matches where a seed slot is missing', () => {
    const pools = [poolWith('A', 4), { label: 'B', standings: [] }]
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    // Can't generate when one pool has no standings
    expect(matches.length).toBeLessThanOrEqual(2)
  })
})
