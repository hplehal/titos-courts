import { describe, it, expect } from 'vitest'
import {
  defaultDivisionSizes,
  defaultTierCount,
  defaultTierLayout,
  divisionForRank,
  resolveDivisions,
  tierFactor,
  tierLayout,
} from '@/lib/league/seasonConfig'
import { getDivisionInfo } from '@/lib/utils'

describe('defaultTierLayout()', () => {
  it('keeps the Tuesday COED layout: courts 6/8/9/10, early then late', () => {
    expect(defaultTierLayout('tuesday-coed')).toEqual([
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

  it('keeps the Thursday layout: courts 9/10, early then late', () => {
    expect(defaultTierLayout('thursday-rec-coed')).toEqual([
      { tierNumber: 1, courtNumber: 9, timeSlot: 'early' },
      { tierNumber: 2, courtNumber: 10, timeSlot: 'early' },
      { tierNumber: 3, courtNumber: 9, timeSlot: 'late' },
      { tierNumber: 4, courtNumber: 10, timeSlot: 'late' },
    ])
  })

  it('keeps the Sunday MENS layout: courts 7,6,8,9,10 in a single slot', () => {
    expect(defaultTierLayout('sunday-mens').map(t => [t.courtNumber, t.timeSlot])).toEqual([
      [7, 'single'], [6, 'single'], [8, 'single'], [9, 'single'], [10, 'single'],
    ])
  })

  it('reuses preset courts past the preset and stays in the last slot', () => {
    expect(tierLayout('thursday-rec-coed', 5)).toEqual({ tierNumber: 5, courtNumber: 9, timeSlot: 'late' })
    expect(tierLayout('sunday-mens', 6)).toEqual({ tierNumber: 6, courtNumber: 7, timeSlot: 'single' })
    expect(defaultTierLayout('tuesday-coed', 10)).toHaveLength(10)
  })

  it('defaults tier counts per league', () => {
    expect(defaultTierCount('tuesday-coed')).toBe(8)
    expect(defaultTierCount('sunday-mens')).toBe(5)
    expect(defaultTierCount('thursday-rec-coed')).toBe(4)
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
  it('defaults to the even split (COED 4-way, MENS halves)', () => {
    expect(defaultDivisionSizes(24, 'coed')).toEqual([6, 6, 6, 6])
    expect(defaultDivisionSizes(22, 'coed')).toEqual([6, 6, 5, 5])
    expect(defaultDivisionSizes(15, 'mens')).toEqual([8, 7])
  })

  it('stored sizes win, in position order, with empty divisions dropped', () => {
    const divisions = resolveDivisions(
      [{ position: 2, teamCount: 6 }, { position: 1, teamCount: 5 }, { position: 3, teamCount: 0 }],
      11,
      'coed',
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
    expect(getDivisionInfo(5, 12, 'coed', stored).name).toBe('Diamond')
    expect(getDivisionInfo(6, 12, 'coed', stored)).toEqual({ name: 'Platinum', color: 'div-platinum', bgClass: 'division-platinum' })
    // Without stored rows the automatic 3/3/3/3 split still applies.
    expect(getDivisionInfo(4, 12, 'coed').name).toBe('Platinum')
  })
})
