import { describe, it, expect } from 'vitest'
import {
  DEFAULT_FOCUS,
  championFocus,
  coedChampions,
  defendingChampion,
  isBackToBack,
  mensChampions,
  recChampions,
} from '@/lib/champions'

const lists = [
  ['COED', coedChampions],
  ['MENS', mensChampions],
  ['REC COED', recChampions],
]

describe('champion lists', () => {
  it.each(lists)('%s runs newest season first with no gaps', (_label, champions) => {
    const seasons = champions.map(c => c.season)
    expect(seasons).toEqual([...seasons].sort((a, b) => b - a))
    // Contiguous: season N down to 1, so the defending champion is champions[0].
    expect(seasons).toEqual(Array.from({ length: seasons.length }, (_, i) => seasons.length - i))
  })

  it.each(lists)('%s has a team name and a photo for every season', (_label, champions) => {
    for (const c of champions) {
      expect(c.team).toBeTruthy()
      expect(c.image).toMatch(/^\/images\/champions\/.+\.jpg$/)
      expect(c.year).toMatch(/^\d{4}$/)
    }
  })
})

describe('defendingChampion()', () => {
  it('is the most recent season, which is what the homepage cards show', () => {
    expect(defendingChampion(coedChampions)).toMatchObject({ season: 9, team: "O'Fosho" })
    expect(defendingChampion(mensChampions)).toMatchObject({ season: 7, team: 'Tsunami Riptide' })
    expect(defendingChampion(recChampions)).toMatchObject({ season: 1, team: "Tomo's Lizards" })
  })

  it('returns null for a league that has no champion yet', () => {
    expect(defendingChampion([])).toBeNull()
  })
})

describe('isBackToBack()', () => {
  it('is false when a new team takes the title', () => {
    // O'Fosho (S9) followed Net Losses (S8) — the homepage must not call this
    // back-to-back, which it used to do with fixed copy.
    expect(isBackToBack(coedChampions)).toBe(false)
    expect(isBackToBack(mensChampions)).toBe(false)
  })

  it('is true when the same team wins twice running', () => {
    const repeat = [{ team: 'Net Losses' }, { team: 'Net Losses' }, { team: 'BounceTown' }]
    expect(isBackToBack(repeat)).toBe(true)
  })

  it('is false for a league with a single season', () => {
    expect(isBackToBack(recChampions)).toBe(false)
    expect(isBackToBack([])).toBe(false)
  })
})

describe('championFocus()', () => {
  it('anchors O’Fosho to the top, where its back row stands', () => {
    expect(championFocus(coedChampions[0])).toBe('50% 0%')
  })

  it('falls back to the default for photos that do not set one', () => {
    expect(championFocus(mensChampions[0])).toBe(DEFAULT_FOCUS)
    expect(championFocus({})).toBe(DEFAULT_FOCUS)
    expect(championFocus(null)).toBe(DEFAULT_FOCUS)
  })

  it('every focus is a usable object-position', () => {
    for (const c of [...coedChampions, ...mensChampions, ...recChampions]) {
      expect(championFocus(c)).toMatch(/^\d+% \d+%$/)
    }
  })
})
