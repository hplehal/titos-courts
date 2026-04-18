import { describe, it, expect } from 'vitest'
import {
  refAssignmentForMatch,
  refSeedForRound,
  FOUR_TEAM_REF_BY_ROUND,
} from '@/lib/tournament/refRotation'

// Build a standard 4-team pool: seeds 1..4 with deterministic ids.
const POOL = [
  { id: 't1', name: 'Seed One',   seed: 1 },
  { id: 't2', name: 'Seed Two',   seed: 2 },
  { id: 't3', name: 'Seed Three', seed: 3 },
  { id: 't4', name: 'Seed Four',  seed: 4 },
]

// Canonical matchup order from FOUR_TEAM_ORDER in generateRoundRobin:
//   R1: s1 v s3, R2: s2 v s4, R3: s1 v s4, R4: s2 v s3, R5: s3 v s4, R6: s1 v s2
const CANONICAL_MATCHES = [
  { roundNumber: 1, homeTeamId: 't1', awayTeamId: 't3' },
  { roundNumber: 2, homeTeamId: 't2', awayTeamId: 't4' },
  { roundNumber: 3, homeTeamId: 't1', awayTeamId: 't4' },
  { roundNumber: 4, homeTeamId: 't2', awayTeamId: 't3' },
  { roundNumber: 5, homeTeamId: 't3', awayTeamId: 't4' },
  { roundNumber: 6, homeTeamId: 't1', awayTeamId: 't2' },
]

describe('refAssignmentForMatch — canonical PDF table (4-team pool)', () => {
  it('assigns seed 4 to ref round 1 (s1 v s3)', () => {
    const { ref } = refAssignmentForMatch(CANONICAL_MATCHES[0], POOL)
    expect(ref?.seed).toBe(4)
  })

  it('assigns seed 3 to ref round 2 (s2 v s4)', () => {
    const { ref } = refAssignmentForMatch(CANONICAL_MATCHES[1], POOL)
    expect(ref?.seed).toBe(3)
  })

  it('assigns seed 2 to ref round 3 (s1 v s4)', () => {
    const { ref } = refAssignmentForMatch(CANONICAL_MATCHES[2], POOL)
    expect(ref?.seed).toBe(2)
  })

  it('assigns seed 4 to ref round 4 (s2 v s3)', () => {
    const { ref } = refAssignmentForMatch(CANONICAL_MATCHES[3], POOL)
    expect(ref?.seed).toBe(4)
  })

  it('assigns seed 1 to ref round 5 (s3 v s4)', () => {
    const { ref } = refAssignmentForMatch(CANONICAL_MATCHES[4], POOL)
    expect(ref?.seed).toBe(1)
  })

  it('assigns seed 3 to ref round 6 (s1 v s2)', () => {
    const { ref } = refAssignmentForMatch(CANONICAL_MATCHES[5], POOL)
    expect(ref?.seed).toBe(3)
  })

  it('PDF assignment never picks a team that is currently playing', () => {
    for (const match of CANONICAL_MATCHES) {
      const { ref } = refAssignmentForMatch(match, POOL)
      expect(ref?.id).not.toBe(match.homeTeamId)
      expect(ref?.id).not.toBe(match.awayTeamId)
    }
  })

  it('distributes ref load across teams: seeds 3 & 4 ref twice, seeds 1 & 2 ref once', () => {
    const refCounts = new Map()
    for (const match of CANONICAL_MATCHES) {
      const { ref } = refAssignmentForMatch(match, POOL)
      refCounts.set(ref.seed, (refCounts.get(ref.seed) ?? 0) + 1)
    }
    expect(refCounts.get(1)).toBe(1)
    expect(refCounts.get(2)).toBe(1)
    expect(refCounts.get(3)).toBe(2)
    expect(refCounts.get(4)).toBe(2)
    const total = [...refCounts.values()].reduce((a, b) => a + b, 0)
    expect(total).toBe(6)
  })

  it('exposes the canonical table constant', () => {
    expect(FOUR_TEAM_REF_BY_ROUND).toEqual({ 1: 4, 2: 3, 3: 2, 4: 4, 5: 1, 6: 3 })
  })

  it('refSeedForRound returns the PDF seed number for rounds 1..6', () => {
    expect(refSeedForRound(1)).toBe(4)
    expect(refSeedForRound(6)).toBe(3)
    expect(refSeedForRound(7)).toBe(null)
    expect(refSeedForRound(undefined)).toBe(null)
  })
})

describe('refAssignmentForMatch — fallbacks', () => {
  it('returns { ref: null } when pool is too small', () => {
    const result = refAssignmentForMatch(
      { roundNumber: 1, homeTeamId: 't1', awayTeamId: 't2' },
      POOL.slice(0, 2),
    )
    expect(result.ref).toBe(null)
    expect(result.resting).toEqual([])
  })

  it('uses lowest-seeded resting team when pool size is not 4', () => {
    const threePool = [
      { id: 't1', name: 'One',   seed: 1 },
      { id: 't2', name: 'Two',   seed: 2 },
      { id: 't3', name: 'Three', seed: 3 },
    ]
    // 1 v 2 playing → only team 3 is resting → they ref.
    const { ref } = refAssignmentForMatch(
      { roundNumber: 1, homeTeamId: 't1', awayTeamId: 't2' },
      threePool,
    )
    expect(ref?.seed).toBe(3)
  })

  it('falls back to lowest-seeded resting team when roundNumber missing', () => {
    const { ref } = refAssignmentForMatch(
      { homeTeamId: 't1', awayTeamId: 't3' },
      POOL,
    )
    // Resting {t2 seed=2, t4 seed=4} — lowest seed = 2 wins.
    expect(ref?.seed).toBe(2)
  })

  it('resting list includes every non-playing team in the pool', () => {
    const { resting } = refAssignmentForMatch(CANONICAL_MATCHES[0], POOL)
    const restingIds = resting.map((t) => t.id).sort()
    expect(restingIds).toEqual(['t2', 't4'])
  })

  it('handles null/malformed inputs gracefully', () => {
    expect(refAssignmentForMatch(null, POOL)).toEqual({ ref: null, resting: [] })
    expect(refAssignmentForMatch({}, null)).toEqual({ ref: null, resting: [] })
    expect(refAssignmentForMatch({ roundNumber: 1 }, POOL).ref?.seed).toBeDefined()
  })
})
