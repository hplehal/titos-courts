import { describe, it, expect } from 'vitest'
import {
  cn,
  slugify,
  formatDate,
  getTierColor,
  getSlotInfo,
  getDivisionInfo,
  getMovementIcon,
  getTeamAbbreviation,
  getLeagueTimeDisplay,
} from '@/lib/utils'

describe('cn()', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })
  it('filters falsy values', () => {
    expect(cn('a', false, null, 'b', undefined)).toBe('a b')
  })
})

describe('slugify()', () => {
  it('converts to slug', () => {
    expect(slugify('Tuesday COED')).toBe('tuesday-coed')
  })
  it('handles special characters', () => {
    expect(slugify("Tito's Courts")).toBe('tito-s-courts')
  })
})

describe('formatDate()', () => {
  it('formats a date string', () => {
    const result = formatDate('2025-04-07')
    expect(result).toMatch(/Apr|April/)
  })
})

describe('getTierColor()', () => {
  it('returns correct colors for tier 1 (early slot)', () => {
    const c = getTierColor(1)
    expect(c.slot).toBe('early')
    expect(c.accent).toBe('tier-1')
  })
  it('returns correct colors for tier 5 (late slot)', () => {
    const c = getTierColor(5)
    expect(c.slot).toBe('late')
    expect(c.accent).toBe('tier-5')
  })
  it('falls back to tier 1 for invalid number', () => {
    const c = getTierColor(99)
    expect(c.accent).toBe('tier-1')
  })
})

describe('getSlotInfo()', () => {
  it('returns single slot info', () => {
    const info = getSlotInfo(1, 'single')
    expect(info.label).toBe('9 PM – 12 AM')
  })
  it('returns early slot for tiers 1-4', () => {
    const info = getSlotInfo(2, 'early')
    expect(info.label).toBe('8 – 10 PM')
  })
  it('returns late slot for tiers 5-8', () => {
    const info = getSlotInfo(6, 'late')
    expect(info.label).toBe('10 PM – 12 AM')
  })
  it("uses the league's own slot labels", () => {
    const thursday = { earlySlotLabel: '6:30 – 8:30 PM', lateSlotLabel: '8:30 – 10:30 PM' }
    expect(getSlotInfo(1, 'early', thursday).label).toBe('6:30 – 8:30 PM')
    expect(getSlotInfo(6, 'late', thursday).label).toBe('8:30 – 10:30 PM')
    expect(getSlotInfo(1, 'single', { singleSlotLabel: '7 – 10 PM' }).label).toBe('7 – 10 PM')
  })
  it("follows the tier's saved slot over its tier number", () => {
    expect(getSlotInfo(3, 'late').label).toBe('10 PM – 12 AM')
    expect(getSlotInfo(6, 'early').label).toBe('8 – 10 PM')
  })
  it('falls back to tiers 1-4 = early when a tier has no saved slot', () => {
    expect(getSlotInfo(2, null).label).toBe('8 – 10 PM')
    expect(getSlotInfo(5, undefined).label).toBe('10 PM – 12 AM')
  })
})

describe('getDivisionInfo()', () => {
  it('returns Diamond for ranks 1-6 in COED (24 teams)', () => {
    expect(getDivisionInfo(1, 24, 4).name).toBe('Diamond')
    expect(getDivisionInfo(6, 24, 4).name).toBe('Diamond')
  })
  it('returns Platinum for ranks 7-12 in COED', () => {
    expect(getDivisionInfo(7, 24, 4).name).toBe('Platinum')
    expect(getDivisionInfo(12, 24, 4).name).toBe('Platinum')
  })
  it('returns Gold for ranks 13-18 in COED', () => {
    expect(getDivisionInfo(13, 24, 4).name).toBe('Gold')
    expect(getDivisionInfo(18, 24, 4).name).toBe('Gold')
  })
  it('returns Silver for ranks 19-24 in COED (no more Bronze)', () => {
    expect(getDivisionInfo(19, 24, 4).name).toBe('Silver')
    expect(getDivisionInfo(24, 24, 4).name).toBe('Silver')
  })
  it('never surfaces Bronze on COED', () => {
    const names = Array.from({ length: 24 }, (_, i) => getDivisionInfo(i + 1, 24, 4).name)
    expect(names.every(n => n !== 'Bronze')).toBe(true)
  })
  it('handles non-24-team COED seasons with extras stacked into top divisions', () => {
    // 22 teams → 6/6/5/5 (Diamond + Platinum get the extras)
    expect(getDivisionInfo(6, 22, 4).name).toBe('Diamond')
    expect(getDivisionInfo(7, 22, 4).name).toBe('Platinum')
    expect(getDivisionInfo(12, 22, 4).name).toBe('Platinum')
    expect(getDivisionInfo(13, 22, 4).name).toBe('Gold')
    expect(getDivisionInfo(17, 22, 4).name).toBe('Gold')
    expect(getDivisionInfo(18, 22, 4).name).toBe('Silver')
  })
  it('splits MENS evenly into Diamond and Platinum (12 teams)', () => {
    expect(getDivisionInfo(1, 12, 2).name).toBe('Diamond')
    expect(getDivisionInfo(6, 12, 2).name).toBe('Diamond')
    expect(getDivisionInfo(7, 12, 2).name).toBe('Platinum')
    expect(getDivisionInfo(12, 12, 2).name).toBe('Platinum')
  })
  it('gives MENS Diamond the extra seat on odd totals (15 teams)', () => {
    // 15 teams → ceil(15/2) = 8 → Diamond 1-8, Platinum 9-15
    expect(getDivisionInfo(8, 15, 2).name).toBe('Diamond')
    expect(getDivisionInfo(9, 15, 2).name).toBe('Platinum')
  })
  it('never surfaces Gold/Silver/Bronze on MENS', () => {
    const names = Array.from({ length: 12 }, (_, i) => getDivisionInfo(i + 1, 12, 2).name)
    expect(names.every(n => n === 'Diamond' || n === 'Platinum')).toBe(true)
  })
})

describe('getMovementIcon()', () => {
  it('returns up arrow for up', () => {
    expect(getMovementIcon('up')).toBe('\u2191')
  })
  it('returns down arrow for down', () => {
    expect(getMovementIcon('down')).toBe('\u2193')
  })
  it('returns dash for stay', () => {
    expect(getMovementIcon('stay')).toBe('\u2014')
  })
})

describe('getTeamAbbreviation()', () => {
  it('abbreviates multi-word team names', () => {
    expect(getTeamAbbreviation('Tacos & Timbits')).toBe('TT')
    expect(getTeamAbbreviation('Big Backs')).toBe('BB')
    expect(getTeamAbbreviation('Ball Me Maybe')).toBe('BMM')
  })
  it('handles single-word names', () => {
    expect(getTeamAbbreviation('Bumpaclat')).toBe('B')
  })
  it('ignores small words', () => {
    expect(getTeamAbbreviation('Sets on the Beach')).toBe('SB')
  })
  it('strips dots and apostrophes', () => {
    expect(getTeamAbbreviation("David's Dictatorship")).toBe('DD')
    // Dots are stripped, so "Notorious D.I.G." becomes "Notorious DIG" → 2 words → "ND"
    expect(getTeamAbbreviation('Notorious D.I.G.')).toBe('ND')
  })
})

describe('getLeagueTimeDisplay()', () => {
  it("returns the league's game night hours", () => {
    expect(getLeagueTimeDisplay({ timeRangeLabel: '9 PM – 12 AM' })).toBe('9 PM – 12 AM')
    expect(getLeagueTimeDisplay({ timeRangeLabel: '6:30 – 10:30 PM' })).toBe('6:30 – 10:30 PM')
  })
  it('falls back to the Tuesday COED hours', () => {
    expect(getLeagueTimeDisplay(null)).toBe('8 PM – 12 AM')
  })
})
