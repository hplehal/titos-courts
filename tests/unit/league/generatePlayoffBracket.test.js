import { describe, it, expect } from 'vitest'
import {
  buildDivisionBracket,
  buildPlayoffPlan,
  partitionIntoDivisions,
  PLAYOFF_ROUND,
} from '@/lib/league/generatePlayoffBracket'
import { resolveDivisions } from '@/lib/league/seasonConfig'

const standings = n => Array.from({ length: n }, (_, i) => ({ teamId: `t${i + 1}`, name: `Team ${i + 1}`, rank: i + 1 }))

const division = size => ({
  position: 1,
  name: 'Diamond',
  court: 6,
  teams: Array.from({ length: size }, (_, i) => ({ seed: i + 1, teamId: `t${i + 1}`, name: `Team ${i + 1}` })),
})

const byKey = shells => Object.fromEntries(shells.map(s => [s.key, s]))

describe('partitionIntoDivisions()', () => {
  it('splits the table top-down by each division size (5-team Diamond, 6-team Platinum)', () => {
    const divisions = resolveDivisions([{ position: 1, teamCount: 5 }, { position: 2, teamCount: 6 }], 11)
    const parts = partitionIntoDivisions(standings(11), divisions)
    expect(parts.map(p => p.teams.map(t => t.teamId))).toEqual([
      ['t1', 't2', 't3', 't4', 't5'],
      ['t6', 't7', 't8', 't9', 't10', 't11'],
    ])
    expect(parts[1].teams[0].seed).toBe(1)
  })
})

describe('buildDivisionBracket()', () => {
  it('6 teams keeps the reseeded format: QFs 3v6 + 4v5 with no winner slot', () => {
    const b = byKey(buildDivisionBracket(division(6)))
    expect(Object.keys(b)).toEqual(['QF1', 'QF2', 'SF1', 'SF2', 'F1'])
    expect([b.QF1.homeSeedLabel, b.QF1.awaySeedLabel]).toEqual(['Diamond 3', 'Diamond 6'])
    expect([b.QF2.homeSeedLabel, b.QF2.awaySeedLabel]).toEqual(['Diamond 4', 'Diamond 5'])
    expect(b.QF1.next).toEqual({ key: 'SF1', slot: null })
    expect(b.QF2.next).toEqual({ key: 'SF2', slot: null })
    expect([b.SF1.homeTeamId, b.SF2.homeTeamId]).toEqual(['t1', 't2'])
    expect(b.SF1.next).toEqual({ key: 'F1', slot: 'home' })
    expect(b.SF2.next).toEqual({ key: 'F1', slot: 'away' })
    expect(b.F1.next).toBe(null)
  })

  it('6 teams keeps the original courts and times', () => {
    const b = byKey(buildDivisionBracket(division(6)))
    expect([b.QF1.courtNumber, b.QF1.startTime, b.QF1.weekKey]).toEqual([6, '22:00', 10])
    expect([b.QF2.courtNumber, b.QF2.startTime]).toEqual([6, '23:00'])
    expect([b.SF1.courtNumber, b.SF1.startTime, b.SF1.weekKey]).toEqual([6, '22:00', 11])
    expect([b.SF2.courtNumber, b.SF2.startTime]).toEqual([null, '22:00'])
    expect([b.F1.courtNumber, b.F1.startTime]).toEqual([null, '23:00'])
  })

  it('5 teams: one QF (4v5) whose winner faces the 1 seed; 2v3 in the other SF', () => {
    const b = byKey(buildDivisionBracket(division(5)))
    expect(Object.keys(b).sort()).toEqual(['F1', 'QF1', 'SF1', 'SF2'])
    expect([b.QF1.homeTeamId, b.QF1.awayTeamId]).toEqual(['t4', 't5'])
    expect(b.QF1.next).toEqual({ key: 'SF1', slot: 'away' })
    expect([b.SF1.homeTeamId, b.SF1.awayTeamId, b.SF1.awaySeedLabel]).toEqual(['t1', null, 'W QF1'])
    expect([b.SF2.homeTeamId, b.SF2.awayTeamId]).toEqual(['t2', 't3'])
    expect([b.F1.homeSeedLabel, b.F1.awaySeedLabel]).toEqual(['W SF1', 'W SF2'])
  })

  it('4 teams: straight to SFs 1v4 and 2v3', () => {
    const shells = buildDivisionBracket(division(4))
    expect(shells.some(s => s.roundNumber === PLAYOFF_ROUND.QF)).toBe(false)
    const b = byKey(shells)
    expect([b.SF1.homeTeamId, b.SF1.awayTeamId]).toEqual(['t1', 't4'])
    expect([b.SF2.homeTeamId, b.SF2.awayTeamId]).toEqual(['t2', 't3'])
  })

  it('8 teams: 1v8 and 4v5 feed SF1; 2v7 and 3v6 feed SF2', () => {
    const b = byKey(buildDivisionBracket(division(8)))
    expect([b.QF1.homeTeamId, b.QF1.awayTeamId]).toEqual(['t1', 't8'])
    expect([b.QF2.homeTeamId, b.QF2.awayTeamId]).toEqual(['t4', 't5'])
    expect(b.QF1.next).toEqual({ key: 'SF1', slot: 'home' })
    expect(b.QF2.next).toEqual({ key: 'SF1', slot: 'away' })
    expect(b.QF4.next).toEqual({ key: 'SF2', slot: 'away' })
  })

  it('2 teams is just the Final; fewer builds nothing; more than 8 is rejected', () => {
    const final = buildDivisionBracket(division(2))
    expect(final).toHaveLength(1)
    expect(final[0].roundNumber).toBe(PLAYOFF_ROUND.FINAL)
    expect(buildDivisionBracket(division(1))).toEqual([])
    expect(() => buildDivisionBracket(division(9))).toThrow(/up to 8/)
  })

  it('every size wires each non-final match forward and seeds each team exactly once', () => {
    for (let n = 2; n <= 8; n++) {
      const shells = buildDivisionBracket(division(n))
      const keys = new Set(shells.map(s => s.key))
      expect(shells.filter(s => s.roundNumber === PLAYOFF_ROUND.FINAL)).toHaveLength(1)
      for (const s of shells) {
        if (s.roundNumber !== PLAYOFF_ROUND.FINAL) expect(keys.has(s.next?.key)).toBe(true)
      }
      const seeded = shells.flatMap(s => [s.homeTeamId, s.awayTeamId]).filter(Boolean)
      expect(seeded).toHaveLength(n)
      expect(new Set(seeded).size).toBe(n)
    }
  })
})

describe('buildPlayoffPlan()', () => {
  it('24-team COED default split builds 4 divisions × 5 matches', () => {
    const plan = buildPlayoffPlan(standings(24), resolveDivisions(null, 24, 4))
    expect(plan).toHaveLength(20)
    expect([...new Set(plan.map(m => m.divisionName))]).toEqual(['Diamond', 'Platinum', 'Gold', 'Silver'])
    expect([...new Set(plan.map(m => m.tierNumber))]).toEqual([1, 2, 3, 4])
  })

  it('mixed sizes build a different bracket per division', () => {
    const divisions = resolveDivisions([{ position: 1, teamCount: 5 }, { position: 2, teamCount: 6 }], 11)
    const plan = buildPlayoffPlan(standings(11), divisions)
    expect(plan.filter(m => m.divisionName === 'Diamond')).toHaveLength(4)
    expect(plan.filter(m => m.divisionName === 'Platinum')).toHaveLength(5)
  })
})
