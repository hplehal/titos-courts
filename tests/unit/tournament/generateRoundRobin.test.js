import { describe, it, expect } from 'vitest'
import { generateRoundRobin } from '@/lib/tournament/generateRoundRobin'

describe('generateRoundRobin — 4-team pool (captain\'s package ordering)', () => {
  const teams = [
    { id: 'T1' }, // seed 1
    { id: 'T2' }, // seed 2
    { id: 'T3' }, // seed 3
    { id: 'T4' }, // seed 4
  ]

  it('produces 6 matches in the canonical order', () => {
    const rr = generateRoundRobin(teams)
    expect(rr).toHaveLength(6)
    expect(rr.map(m => [m.homeTeamId, m.awayTeamId])).toEqual([
      ['T1', 'T3'],
      ['T2', 'T4'],
      ['T1', 'T4'],
      ['T2', 'T3'],
      ['T3', 'T4'],
      ['T1', 'T2'],
    ])
  })

  it('assigns sequential roundNumber 1..6', () => {
    const rr = generateRoundRobin(teams)
    expect(rr.map(m => m.roundNumber)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('every team plays exactly 3 matches (every other team once)', () => {
    const rr = generateRoundRobin(teams)
    const rounds = (id) => rr.filter(m => m.homeTeamId === id || m.awayTeamId === id)
    for (const t of ['T1', 'T2', 'T3', 'T4']) {
      expect(rounds(t)).toHaveLength(3)
    }
    // No team plays itself
    for (const m of rr) expect(m.homeTeamId).not.toBe(m.awayTeamId)
  })

  it('top seeds (1, 2) get a rest round between every game', () => {
    // Per the captain's package ordering, seed-1 and seed-2 always have
    // at least one round off between their matches. Lower seeds may have
    // one consecutive pair (3 plays R4→R5; 4 plays R2→R3) — expected.
    const rr = generateRoundRobin(teams)
    const rounds = (id) => rr.filter(m => m.homeTeamId === id || m.awayTeamId === id).map(m => m.roundNumber)
    for (const t of ['T1', 'T2']) {
      const r = rounds(t)
      for (let i = 1; i < r.length; i++) {
        expect(r[i] - r[i - 1]).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('top two seeds play each other last (round 6)', () => {
    const rr = generateRoundRobin(teams)
    const lastRound = rr[rr.length - 1]
    expect(lastRound.roundNumber).toBe(6)
    expect([lastRound.homeTeamId, lastRound.awayTeamId].sort()).toEqual(['T1', 'T2'])
  })
})

describe('generateRoundRobin — generic fallback (non-4-team)', () => {
  it('handles 3 teams (3 matches, 1 sitting per round)', () => {
    const rr = generateRoundRobin([{ id: 'A' }, { id: 'B' }, { id: 'C' }])
    expect(rr).toHaveLength(3)
    // Every pair exactly once
    const pairs = rr.map(m => [m.homeTeamId, m.awayTeamId].sort().join('-')).sort()
    expect(pairs).toEqual(['A-B', 'A-C', 'B-C'])
  })

  it('handles 6 teams (15 matches, C(6,2) = 15)', () => {
    const teams = ['A', 'B', 'C', 'D', 'E', 'F'].map(id => ({ id }))
    const rr = generateRoundRobin(teams)
    expect(rr).toHaveLength(15)
    // Every pair exactly once
    const pairs = new Set(rr.map(m => [m.homeTeamId, m.awayTeamId].sort().join('-')))
    expect(pairs.size).toBe(15)
  })

  it('returns empty for < 2 teams', () => {
    expect(generateRoundRobin([])).toEqual([])
    expect(generateRoundRobin([{ id: 'A' }])).toEqual([])
  })

  it('accepts raw id strings as well as {id} objects', () => {
    const rr = generateRoundRobin(['A', 'B', 'C'])
    expect(rr).toHaveLength(3)
    const pairs = rr.map(m => [m.homeTeamId, m.awayTeamId].sort().join('-')).sort()
    expect(pairs).toEqual(['A-B', 'A-C', 'B-C'])
  })
})
