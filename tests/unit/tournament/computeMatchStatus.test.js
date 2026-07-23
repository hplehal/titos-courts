import { describe, it, expect } from 'vitest'
import { computeMatchStatus } from '@/lib/tournament/computeMatchStatus'
import { MATCH_STATUS } from '@/lib/tournament/constants'

const teams = { homeTeamId: 'home', awayTeamId: 'away' }

describe('computeMatchStatus', () => {
  it('returns SCHEDULED with no scores', () => {
    expect(computeMatchStatus([], teams)).toEqual({
      status: MATCH_STATUS.SCHEDULED, setsHome: 0, setsAway: 0, winnerId: null,
    })
  })

  it('returns SCHEDULED when scores param is null or missing', () => {
    expect(computeMatchStatus(null, teams).status).toBe(MATCH_STATUS.SCHEDULED)
    expect(computeMatchStatus(undefined, teams).status).toBe(MATCH_STATUS.SCHEDULED)
  })

  it('returns LIVE after first set (home won 25-18)', () => {
    const result = computeMatchStatus(
      [{ setNumber: 1, homeScore: 25, awayScore: 18 }],
      teams,
    )
    expect(result.status).toBe(MATCH_STATUS.LIVE)
    expect(result.setsHome).toBe(1)
    expect(result.setsAway).toBe(0)
    expect(result.winnerId).toBeNull()
  })

  it('returns FINAL when home sweeps 2-0 (25-20, 25-22)', () => {
    const result = computeMatchStatus(
      [
        { setNumber: 1, homeScore: 25, awayScore: 20 },
        { setNumber: 2, homeScore: 25, awayScore: 22 },
      ],
      teams,
    )
    expect(result.status).toBe(MATCH_STATUS.FINAL)
    expect(result.setsHome).toBe(2)
    expect(result.setsAway).toBe(0)
    expect(result.winnerId).toBe('home')
  })

  it('returns FINAL when split decider goes to home (25-22, 23-25, 15-11)', () => {
    const result = computeMatchStatus(
      [
        { setNumber: 1, homeScore: 25, awayScore: 22 },
        { setNumber: 2, homeScore: 23, awayScore: 25 },
        { setNumber: 3, homeScore: 15, awayScore: 11 },
      ],
      teams,
    )
    expect(result.status).toBe(MATCH_STATUS.FINAL)
    expect(result.setsHome).toBe(2)
    expect(result.setsAway).toBe(1)
    expect(result.winnerId).toBe('home')
  })

  it('respects the cap on deciding set (17-15)', () => {
    const result = computeMatchStatus(
      [
        { setNumber: 1, homeScore: 24, awayScore: 26 },
        { setNumber: 2, homeScore: 25, awayScore: 22 },
        { setNumber: 3, homeScore: 17, awayScore: 15 },
      ],
      teams,
    )
    expect(result.status).toBe(MATCH_STATUS.FINAL)
    expect(result.winnerId).toBe('home')
  })

  it('respects the cap on regular sets (27-25)', () => {
    const result = computeMatchStatus(
      [
        { setNumber: 1, homeScore: 27, awayScore: 25 },
        { setNumber: 2, homeScore: 26, awayScore: 24 },
      ],
      teams,
    )
    expect(result.status).toBe(MATCH_STATUS.FINAL)
    expect(result.winnerId).toBe('home')
  })

  it('tolerates extended play past 25 without cap (25-23 won by 2)', () => {
    // Set was played to 25, winner by 2 — valid finish.
    const result = computeMatchStatus(
      [{ setNumber: 1, homeScore: 25, awayScore: 23 }],
      teams,
    )
    expect(result.setsHome).toBe(1)
    expect(result.status).toBe(MATCH_STATUS.LIVE) // still live; match best-of-3
  })

  it('ignores malformed set scores (null, negative, non-numeric)', () => {
    const result = computeMatchStatus(
      [
        null,
        { setNumber: 1, homeScore: -5, awayScore: 25 },      // negative filtered
        { setNumber: 2, homeScore: 'abc', awayScore: 25 },   // non-numeric filtered
        { setNumber: 3, homeScore: 25, awayScore: 20 },      // valid → counted
      ],
      teams,
    )
    // Only the single valid set counts — match is LIVE (home 1, away 0)
    expect(result.status).toBe(MATCH_STATUS.LIVE)
    expect(result.setsHome).toBe(1)
    expect(result.setsAway).toBe(0)
  })

  it('returns null winnerId when home/away team ids missing', () => {
    const result = computeMatchStatus(
      [
        { setNumber: 1, homeScore: 25, awayScore: 20 },
        { setNumber: 2, homeScore: 25, awayScore: 18 },
      ],
      {}, // no team ids
    )
    expect(result.status).toBe(MATCH_STATUS.FINAL)
    expect(result.winnerId).toBeNull()
  })

  it('awards away winner when they sweep', () => {
    const result = computeMatchStatus(
      [
        { setNumber: 1, homeScore: 18, awayScore: 25 },
        { setNumber: 2, homeScore: 22, awayScore: 25 },
      ],
      teams,
    )
    expect(result.status).toBe(MATCH_STATUS.FINAL)
    expect(result.winnerId).toBe('away')
    expect(result.setsAway).toBe(2)
  })

  describe('pool mode (2 fixed sets per captain\'s package)', () => {
    it('is FINAL with winner after both sets even at 2-0', () => {
      const result = computeMatchStatus(
        [
          { setNumber: 1, homeScore: 25, awayScore: 18 },
          { setNumber: 2, homeScore: 25, awayScore: 22 },
        ],
        teams,
        { mode: 'pool' },
      )
      expect(result.status).toBe(MATCH_STATUS.FINAL)
      expect(result.winnerId).toBe('home')
      expect(result.setsHome).toBe(2)
      expect(result.setsAway).toBe(0)
    })

    it('is FINAL with no winner on a 1-1 split (each side keeps their set)', () => {
      const result = computeMatchStatus(
        [
          { setNumber: 1, homeScore: 25, awayScore: 18 },
          { setNumber: 2, homeScore: 22, awayScore: 25 },
        ],
        teams,
        { mode: 'pool' },
      )
      expect(result.status).toBe(MATCH_STATUS.FINAL)
      expect(result.winnerId).toBeNull()
      expect(result.setsHome).toBe(1)
      expect(result.setsAway).toBe(1)
    })

    it('is LIVE after the first set even if someone hit 25', () => {
      const result = computeMatchStatus(
        [{ setNumber: 1, homeScore: 25, awayScore: 18 }],
        teams,
        { mode: 'pool' },
      )
      expect(result.status).toBe(MATCH_STATUS.LIVE)
      expect(result.setsHome).toBe(1)
    })

    it('respects 27 cap on each pool set', () => {
      const result = computeMatchStatus(
        [
          { setNumber: 1, homeScore: 27, awayScore: 25 },
          { setNumber: 2, homeScore: 20, awayScore: 25 },
        ],
        teams,
        { mode: 'pool' },
      )
      expect(result.status).toBe(MATCH_STATUS.FINAL)
      expect(result.setsHome).toBe(1)
      expect(result.setsAway).toBe(1)
      expect(result.winnerId).toBeNull()
    })

    it('ignores a 3rd set in pool mode (25 target means 15-13 is not a win)', () => {
      // Pool mode applies target=25 to every set, so a 3rd-set score of
      // 15-13 doesn't meet the target → doesn't count as a set win. The
      // match is still FINAL from the completed 2-0 sweep.
      const result = computeMatchStatus(
        [
          { setNumber: 1, homeScore: 25, awayScore: 18 },
          { setNumber: 2, homeScore: 25, awayScore: 22 },
          { setNumber: 3, homeScore: 15, awayScore: 13 },
        ],
        teams,
        { mode: 'pool' },
      )
      expect(result.status).toBe(MATCH_STATUS.FINAL)
      expect(result.setsHome).toBe(2)
      expect(result.setsAway).toBe(0)
      expect(result.winnerId).toBe('home')
    })
  })
})
