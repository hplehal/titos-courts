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

  it('matches the Captains Package schedule (position → matchup)', () => {
    // Per PDF: the two 1:00 PM QFs come first (positions 0,1 — Courts 1 & 2),
    // then the two 1:45 PM "rematch" QFs (positions 2,3 — Courts 1 & 2).
    // Home/away preserves the PDF's left-to-right column order.
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    expect(matches[0]).toMatchObject({ teamASeedLabel: 'A1', teamBSeedLabel: 'B2' })
    expect(matches[1]).toMatchObject({ teamASeedLabel: 'C1', teamBSeedLabel: 'D2' })
    expect(matches[2]).toMatchObject({ teamASeedLabel: 'A2', teamBSeedLabel: 'B1' })
    expect(matches[3]).toMatchObject({ teamASeedLabel: 'C2', teamBSeedLabel: 'D1' })
  })

  it('never rematches pool opponents in round 1', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    for (const m of matches) {
      expect(m.teamASeedLabel[0]).not.toBe(m.teamBSeedLabel[0])
    }
  })

  it('only uses rank-1 and rank-2 seeds (Gold)', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    for (const m of matches) {
      expect(m.teamASeedLabel).toMatch(/^[A-D][12]$/)
      expect(m.teamBSeedLabel).toMatch(/^[A-D][12]$/)
    }
  })

  it('uses each pool-seed slot (A1..D2) exactly once across all matches', () => {
    const matches = generateBracketSeeding(pools, DIVISION_GOLD)
    const allSeeds = matches.flatMap(m => [m.teamASeedLabel, m.teamBSeedLabel]).sort()
    expect(allSeeds).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'])
  })
})

describe('generateBracketSeeding — 4 pools / Silver bracket', () => {
  const pools = [poolWith('A'), poolWith('B'), poolWith('C'), poolWith('D')]

  it('matches the Captains Package schedule (position → matchup)', () => {
    // Silver mirrors Gold but with the pool's bottom two seeds (rank-3 home
    // vs rank-4 away at 1:00 PM; rank-4 home vs rank-3 away at 1:45 PM).
    const matches = generateBracketSeeding(pools, DIVISION_SILVER)
    expect(matches).toHaveLength(4)
    expect(matches[0]).toMatchObject({ teamASeedLabel: 'A3', teamBSeedLabel: 'B4' })
    expect(matches[1]).toMatchObject({ teamASeedLabel: 'C3', teamBSeedLabel: 'D4' })
    expect(matches[2]).toMatchObject({ teamASeedLabel: 'A4', teamBSeedLabel: 'B3' })
    expect(matches[3]).toMatchObject({ teamASeedLabel: 'C4', teamBSeedLabel: 'D3' })
  })

  it('only uses rank-3 and rank-4 seeds (Silver)', () => {
    const matches = generateBracketSeeding(pools, DIVISION_SILVER)
    for (const m of matches) {
      expect(m.teamASeedLabel).toMatch(/^[A-D][34]$/)
      expect(m.teamBSeedLabel).toMatch(/^[A-D][34]$/)
    }
  })

  it('never rematches pool opponents in round 1', () => {
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
