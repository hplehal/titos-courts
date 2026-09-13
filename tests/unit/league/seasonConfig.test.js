import { describe, it, expect } from 'vitest'
import {
  LEAGUE_RULE_DEFAULTS,
  defaultDivisionSizes,
  defaultTierLayout,
  divisionForRank,
  leagueRules,
  resolveDivisions,
  tierFactor,
  tierLayout,
} from '@/lib/league/seasonConfig'
import { getDivisionInfo } from '@/lib/utils'

// The rules the league_rules migration copies onto the existing leagues.
const TUESDAY = { courts: [6, 8, 9, 10], slotMode: 'two', defaultTierCount: 8 }
const THURSDAY = { courts: [9, 10], slotMode: 'two', defaultTierCount: 4 }
const SUNDAY = { courts: [7, 6, 8, 9, 10], slotMode: 'single', defaultTierCount: 5 }

describe('leagueRules()', () => {
  it('fills every rule from the defaults when a league sets none', () => {
    expect(leagueRules(null)).toEqual(LEAGUE_RULE_DEFAULTS)
    expect(leagueRules({ name: 'Tuesday COED' })).toEqual(LEAGUE_RULE_DEFAULTS)
  })

  it("keeps a league's own rules and ignores null values and empty court lists", () => {
    const rules = leagueRules({ roundsPerWeek: 3, headToHead: true, courts: [], timeRangeLabel: null })
    expect(rules.roundsPerWeek).toBe(3)
    expect(rules.headToHead).toBe(true)
    expect(rules.courts).toEqual([6, 8, 9, 10])
    expect(rules.timeRangeLabel).toBe('8 PM – 12 AM')
  })
})

describe('defaultTierLayout()', () => {
  it('lays out Tuesday COED: courts 6/8/9/10, early then late', () => {
    expect(defaultTierLayout(TUESDAY)).toEqual([
      { tierNumber: 1, courtNumber: 6, timeSlot: 'early' },
      { tierNumber: 2, courtNumber: 8, timeSlot: 'early' },
      { tierNumber: 3, courtNumber: 9, timeSlot: 'early' },
      { tierNumber: 4, courtNumber: 10, timeSlot: 'early' },
      { tierNumber: 5, courtNumber: 6, timeSlot: 'late' },
      { tierNumber: 6, courtNumber: 8, timeSlot: 'late' },
      { tierNumber: 7, courtNumber: 9, timeSlot: 'late' },
      { tierNumber: 8, courtNumber: 10, timeSlot: 'late' },
    ])
  })

  it('lays out Thursday: courts 9/10, early then late', () => {
    expect(defaultTierLayout(THURSDAY)).toEqual([
      { tierNumber: 1, courtNumber: 9, timeSlot: 'early' },
      { tierNumber: 2, courtNumber: 10, timeSlot: 'early' },
      { tierNumber: 3, courtNumber: 9, timeSlot: 'late' },
      { tierNumber: 4, courtNumber: 10, timeSlot: 'late' },
    ])
  })

  it('lays out Sunday MENS: courts 7,6,8,9,10 in a single slot', () => {
    expect(defaultTierLayout(SUNDAY).map(t => [t.courtNumber, t.timeSlot])).toEqual([
      [7, 'single'], [6, 'single'], [8, 'single'], [9, 'single'], [10, 'single'],
    ])
  })

  it('reuses courts past the list and stays in the last slot', () => {
    expect(tierLayout(THURSDAY, 5)).toEqual({ tierNumber: 5, courtNumber: 9, timeSlot: 'late' })
    expect(tierLayout(SUNDAY, 6)).toEqual({ tierNumber: 6, courtNumber: 7, timeSlot: 'single' })
    expect(defaultTierLayout(TUESDAY, 10)).toHaveLength(10)
  })

  it("uses a new league's own courts and tier count", () => {
    const wednesday = { courts: [2, 3], slotMode: 'single', defaultTierCount: 3 }
    expect(defaultTierLayout(wednesday).map(t => [t.courtNumber, t.timeSlot])).toEqual([
      [2, 'single'], [3, 'single'], [2, 'single'],
    ])
  })
})

describe('tierFactor()', () => {
  it('matches the historical 9 − tier scale for seasons with 8 or fewer tiers', () => {
    for (const count of [4, 5, 8]) {
      for (let tier = 1; tier <= count; tier++) expect(tierFactor(tier, count)).toBe(9 - tier)
    }
  })

  it('extends the scale past 8 tiers instead of flattening the bottom tiers', () => {
    expect(tierFactor(1, 10)).toBe(10)
    expect(tierFactor(8, 10)).toBe(3)
    expect(tierFactor(10, 10)).toBe(1)
  })
})

describe('division sizes', () => {
  it("defaults to an even split across the league's division count", () => {
    expect(defaultDivisionSizes(24, 4)).toEqual([6, 6, 6, 6])
    expect(defaultDivisionSizes(22, 4)).toEqual([6, 6, 5, 5])
    expect(defaultDivisionSizes(15, 2)).toEqual([8, 7])
    expect(defaultDivisionSizes(10, 3)).toEqual([4, 3, 3])
  })

  it('stored sizes win, in position order, with empty divisions dropped', () => {
    const divisions = resolveDivisions(
      [{ position: 2, teamCount: 6 }, { position: 1, teamCount: 5 }, { position: 3, teamCount: 0 }],
      11,
      4,
    )
    expect(divisions.map(d => [d.name, d.teamCount])).toEqual([['Diamond', 5], ['Platinum', 6]])
  })

  it('divisionForRank walks cumulative sizes; overflow lands in the last division', () => {
    const divisions = resolveDivisions([{ position: 1, teamCount: 5 }, { position: 2, teamCount: 6 }], 11)
    expect(divisionForRank(5, divisions).name).toBe('Diamond')
    expect(divisionForRank(6, divisions).name).toBe('Platinum')
    expect(divisionForRank(12, divisions).name).toBe('Platinum')
  })

  it('getDivisionInfo uses stored sizes when given (5-team Thursday Diamond)', () => {
    const stored = [{ position: 1, teamCount: 5 }, { position: 2, teamCount: 7 }]
    expect(getDivisionInfo(5, 12, 4, stored).name).toBe('Diamond')
    expect(getDivisionInfo(6, 12, 4, stored)).toEqual({ name: 'Platinum', color: 'div-platinum', bgClass: 'division-platinum' })
    // Without stored rows the automatic 3/3/3/3 split still applies.
    expect(getDivisionInfo(4, 12).name).toBe('Platinum')
  })
})
