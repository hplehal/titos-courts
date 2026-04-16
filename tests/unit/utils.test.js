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
})

describe('getDivisionInfo()', () => {
  it('returns Diamond for rank 1 in COED', () => {
    expect(getDivisionInfo(1, 24, 'coed').name).toBe('Diamond')
  })
  it('returns Bronze for last in COED', () => {
    expect(getDivisionInfo(24, 24, 'coed').name).toBe('Bronze')
  })
  it('returns Diamond for rank 1-3 in MENS', () => {
    expect(getDivisionInfo(1, 15, 'mens').name).toBe('Diamond')
    expect(getDivisionInfo(3, 15, 'mens').name).toBe('Diamond')
  })
  it('returns Platinum for rank 4-6 in MENS', () => {
    expect(getDivisionInfo(4, 15, 'mens').name).toBe('Platinum')
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
  it('returns 9 PM for Sunday/MENS leagues', () => {
    expect(getLeagueTimeDisplay('sunday-mens')).toBe('9 PM – 12 AM')
  })
  it('returns 8 PM for other leagues', () => {
    expect(getLeagueTimeDisplay('tuesday-coed')).toBe('8 PM – 12 AM')
    expect(getLeagueTimeDisplay('thursday-rec-coed')).toBe('8 PM – 12 AM')
  })
})
