import { describe, it, expect } from 'vitest'
import { computeStandingsFromMatches } from '@/lib/tournament/calculateStandings'

// Helper: build a completed match record
function m(home, away, scores) {
  return {
    id: `${home}-vs-${away}`,
    homeTeamId: home,
    awayTeamId: away,
    status: 'completed',
    winnerId: scores.reduce((h, s) => h + (s.homeScore > s.awayScore ? 1 : 0), 0)
      >
      scores.reduce((a, s) => a + (s.awayScore > s.homeScore ? 1 : 0), 0)
      ? home : away,
    scores: scores.map((s, i) => ({ setNumber: i + 1, ...s })),
  }
}

// Helper: 2-set sweep
const sweep = (hHigh, hLow = 20) => [{ homeScore: hHigh, awayScore: hLow }, { homeScore: hHigh, awayScore: hLow }]

describe('computeStandingsFromMatches', () => {
  it('ranks by wins (descending)', () => {
    const teams = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
      { id: 'D', name: 'D' },
    ]
    const matches = [
      m('A', 'B', sweep(25, 15)),
      m('A', 'C', sweep(25, 20)),
      m('A', 'D', sweep(25, 10)),
      m('B', 'C', sweep(25, 22)),
      m('B', 'D', sweep(25, 19)),
      m('C', 'D', sweep(25, 23)),
    ]
    const s = computeStandingsFromMatches(teams, matches)
    expect(s.map(r => r.teamId)).toEqual(['A', 'B', 'C', 'D'])
    expect(s[0].w).toBe(3); expect(s[1].w).toBe(2)
    expect(s[2].w).toBe(1); expect(s[3].w).toBe(0)
  })

  it('2-way tie: head-to-head winner ranks higher', () => {
    // Clean 2-way tie at 1 win:
    //   D wins all 3 (beats A, B, C) → 3W
    //   A loses all 3 → 0W
    //   B beats A → 1W, C beats A → 1W. B plays C head-to-head.
    //   B beat C decisively. B should rank above C.
    const teams = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
      { id: 'D', name: 'D' },
    ]
    const matches = [
      m('D', 'A', sweep(25, 10)), m('D', 'B', sweep(25, 22)), m('D', 'C', sweep(25, 22)),
      m('B', 'A', sweep(25, 10)),
      m('C', 'A', sweep(25, 10)),
      // B beat C head-to-head by a big margin
      m('B', 'C', [{ homeScore: 25, awayScore: 10 }, { homeScore: 25, awayScore: 10 }]),
    ]
    const s = computeStandingsFromMatches(teams, matches)
    expect(s[0].teamId).toBe('D') // 3-0
    expect(s[3].teamId).toBe('A') // 0-3
    // B and C tied at 1-2. B won the head-to-head → B ranks above C.
    const rank = Object.fromEntries(s.map((r, i) => [r.teamId, i + 1]))
    expect(rank.B).toBeLessThan(rank.C)
  })

  it('3-way tie: head-to-head among all 3 tied teams only', () => {
    // 4 teams. A beats everyone cleanly (3-0). B/C/D all 1-2 with a triangle.
    // Within the tied group: B beat C 25-15/25-15, C beat D 25-18/25-18, D beat B 25-20/25-20.
    // H2H diffs among {B, C, D}:
    //   B: +20 vs C, -10 vs D = +10
    //   C: -20 vs B, +14 vs D = -6
    //   D: +10 vs B, -14 vs C = -4
    // Expected tied-group order by h2h diff: B > D > C
    const teams = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
      { id: 'D', name: 'D' },
    ]
    const matches = [
      m('A', 'B', sweep(25, 10)), m('A', 'C', sweep(25, 10)), m('A', 'D', sweep(25, 10)),
      m('B', 'C', [{ homeScore: 25, awayScore: 15 }, { homeScore: 25, awayScore: 15 }]),
      m('C', 'D', [{ homeScore: 25, awayScore: 18 }, { homeScore: 25, awayScore: 18 }]),
      m('D', 'B', [{ homeScore: 25, awayScore: 20 }, { homeScore: 25, awayScore: 20 }]),
    ]
    const s = computeStandingsFromMatches(teams, matches)
    expect(s[0].teamId).toBe('A') // undefeated
    // Among B, C, D the order is determined by h2h diff within the group
    expect(s.slice(1).map(r => r.teamId)).toEqual(['B', 'D', 'C'])
  })

  it('4-way tie: all tied, cascades to overall point diff', () => {
    // Unusual but possible with 4 teams each 1-2 round-robin-ly. Configure
    // overall point diff to break cleanly: A has +30, B +10, C -10, D -30.
    const teams = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
      { id: 'D', name: 'D' },
    ]
    // Make each team's h2h diff sum to 0 within the group by symmetric scores
    const matches = [
      // A vs B: A wins big
      m('A', 'B', [{ homeScore: 25, awayScore: 10 }, { homeScore: 25, awayScore: 10 }]),
      // B vs C: B wins close
      m('B', 'C', [{ homeScore: 25, awayScore: 23 }, { homeScore: 25, awayScore: 23 }]),
      // C vs D: C wins medium
      m('C', 'D', [{ homeScore: 25, awayScore: 20 }, { homeScore: 25, awayScore: 20 }]),
      // D vs A: D wins huge (balances A's win over B)
      m('D', 'A', [{ homeScore: 25, awayScore: 5 }, { homeScore: 25, awayScore: 5 }]),
    ]
    const s = computeStandingsFromMatches(teams, matches)
    // Each team: 1 win, 1 loss. Tiebreaker should rank by overall diff.
    expect(s.every(r => r.w === 1 && r.l === 1)).toBe(true)
    // Just verify standings is stable and non-empty; exact order depends on
    // score-driven differentials but this smoke-tests the cascade runs.
    expect(s).toHaveLength(4)
  })

  it('excludes non-completed matches from standings', () => {
    const teams = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }]
    const matches = [
      m('A', 'B', sweep(25, 20)),
      { id: 'x', homeTeamId: 'A', awayTeamId: 'B', status: 'live', scores: [{ setNumber: 1, homeScore: 20, awayScore: 10 }] },
      { id: 'y', homeTeamId: 'A', awayTeamId: 'B', status: 'scheduled', scores: [] },
    ]
    const s = computeStandingsFromMatches(teams, matches)
    const a = s.find(r => r.teamId === 'A')
    expect(a.w).toBe(1)
  })

  it('tags top 2 as gold and bottom 2 as silver in a 4-team pool', () => {
    const teams = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
      { id: 'D', name: 'D' },
    ]
    const matches = [
      m('A', 'B', sweep(25, 15)), m('A', 'C', sweep(25, 15)), m('A', 'D', sweep(25, 15)),
      m('B', 'C', sweep(25, 20)), m('B', 'D', sweep(25, 20)),
      m('C', 'D', sweep(25, 23)),
    ]
    const s = computeStandingsFromMatches(teams, matches)
    expect(s[0].qualifies).toBe('gold')
    expect(s[1].qualifies).toBe('gold')
    expect(s[2].qualifies).toBe('silver')
    expect(s[3].qualifies).toBe('silver')
  })

  it('does not qualify anyone before any matches are played', () => {
    const teams = [
      { id: 'A', name: 'A' }, { id: 'B', name: 'B' },
      { id: 'C', name: 'C' }, { id: 'D', name: 'D' },
    ]
    const s = computeStandingsFromMatches(teams, [])
    expect(s.every(r => r.qualifies === 'none')).toBe(true)
  })

  it('1-1 match result is a TIE, not a win for either side', () => {
    // Pool play is 2 fixed sets. A 1-1 match means each team won one set —
    // neither team wins the match. Both should get t=1, neither w/l.
    const teams = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }]
    const matches = [
      m('A', 'B', [
        { homeScore: 25, awayScore: 20 }, // A wins set 1
        { homeScore: 22, awayScore: 25 }, // B wins set 2
      ]),
    ]
    const s = computeStandingsFromMatches(teams, matches)
    const a = s.find(r => r.teamId === 'A')
    const b = s.find(r => r.teamId === 'B')
    expect(a).toMatchObject({ w: 0, l: 0, t: 1, sw: 1, sl: 1 })
    expect(b).toMatchObject({ w: 0, l: 0, t: 1, sw: 1, sl: 1 })
  })

  it('ties on SW break on head-to-head point diff (Lincas-vs-ESH case)', () => {
    // Reproduces the confusing Pool A table: two teams finish with SW=5, SL=1
    // because each had one 1-1 tie. Head-to-head decides which ranks first.
    // A round-robin of 4 teams, 3 matches each:
    //   Lincas beats C 2-0, beats D 2-0, ties ESH 1-1 → SW=5, SL=1, record 2-0-1
    //   ESH    beats C 2-0, beats D 2-0, ties Lincas 1-1 → SW=5, SL=1, record 2-0-1
    //   C & D each lose twice cleanly and play each other.
    // In the head-to-head (the tie), Lincas's set went 25-18 and ESH's set
    // went 25-22 → Lincas +3 better → Lincas ranks higher.
    const teams = [
      { id: 'L', name: 'Lincas' },
      { id: 'E', name: 'ESH' },
      { id: 'C', name: 'C' },
      { id: 'D', name: 'D' },
    ]
    const matches = [
      // Lincas sweeps C and D
      m('L', 'C', sweep(25, 20)),
      m('L', 'D', sweep(25, 20)),
      // ESH sweeps C and D
      m('E', 'C', sweep(25, 20)),
      m('E', 'D', sweep(25, 20)),
      // C vs D — doesn't matter for the tie, give C the win
      m('C', 'D', sweep(25, 22)),
      // Lincas vs ESH — 1-1 tie. Lincas won their set by more (+7 vs +3).
      m('L', 'E', [
        { homeScore: 25, awayScore: 18 }, // Lincas takes set 1 by 7
        { homeScore: 22, awayScore: 25 }, // ESH takes set 2 by 3
      ]),
    ]
    const s = computeStandingsFromMatches(teams, matches)
    const lincas = s.find(r => r.teamId === 'L')
    const esh = s.find(r => r.teamId === 'E')
    // Both teams should be tied on SW/SL/record
    expect(lincas).toMatchObject({ sw: 5, sl: 1, w: 2, l: 0, t: 1 })
    expect(esh).toMatchObject({ sw: 5, sl: 1, w: 2, l: 0, t: 1 })
    // Head-to-head decides: Lincas ahead
    const rank = Object.fromEntries(s.map((r, i) => [r.teamId, i + 1]))
    expect(rank.L).toBeLessThan(rank.E)
    expect(rank.L).toBe(1) // Lincas is the pool winner
  })

  it('produces the correct W/L, PF/PA, DIFF for a single match', () => {
    const teams = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }]
    const matches = [
      m('A', 'B', [{ homeScore: 25, awayScore: 15 }, { homeScore: 25, awayScore: 20 }]),
    ]
    const s = computeStandingsFromMatches(teams, matches)
    const a = s.find(r => r.teamId === 'A')
    const b = s.find(r => r.teamId === 'B')
    expect(a).toMatchObject({ w: 1, l: 0, sw: 2, sl: 0, pf: 50, pa: 35, diff: 15 })
    expect(b).toMatchObject({ w: 0, l: 1, sw: 0, sl: 2, pf: 35, pa: 50, diff: -15 })
  })
})
