import { describe, it, expect } from 'vitest'
import { parseLeagueInput, tiersPerSlotFor } from '@/lib/league/leagueInput'

const newLeague = { name: "Wednesday Women's", dayOfWeek: 'Wednesday', registrationFee: '210', maxTeams: '18' }

describe('parseLeagueInput() — create', () => {
  it('builds a league and derives the URL name from the league name', () => {
    const { data, error } = parseLeagueInput(newLeague, { create: true })
    expect(error).toBeUndefined()
    expect(data).toEqual({
      name: "Wednesday Women's",
      slug: 'wednesday-women-s',
      dayOfWeek: 'Wednesday',
      registrationFee: 210,
      maxTeams: 18,
    })
  })

  it('accepts a custom URL name and rejects badly formed ones', () => {
    expect(parseLeagueInput({ ...newLeague, slug: 'wed-womens' }, { create: true }).data.slug).toBe('wed-womens')
    expect(parseLeagueInput({ ...newLeague, slug: 'wed womens' }, { create: true }).error).toMatch(/URL name/)
    expect(parseLeagueInput({ ...newLeague, slug: '-wed' }, { create: true }).error).toMatch(/URL name/)
  })

  it('requires a name, day, fee and max teams', () => {
    expect(parseLeagueInput({ ...newLeague, name: '  ' }, { create: true }).error).toMatch(/name is required/)
    expect(parseLeagueInput({ ...newLeague, dayOfWeek: 'Funday' }, { create: true }).error).toMatch(/day/)
    expect(parseLeagueInput({ ...newLeague, registrationFee: undefined }, { create: true }).error).toMatch(/fee is required/)
    expect(parseLeagueInput({ ...newLeague, maxTeams: '0' }, { create: true }).error).toMatch(/Max teams/)
  })

  it('parses custom game-night rules', () => {
    const { data, error } = parseLeagueInput({
      ...newLeague,
      roundsPerWeek: '3',
      headToHead: true,
      divisionCount: 2,
      slotMode: 'single',
      singleSlotLabel: ' 7 – 10 PM ',
      timeRangeLabel: '7 – 10 PM',
      courts: '3, 4',
      defaultTierCount: '6',
      isActive: false,
    }, { create: true })
    expect(error).toBeUndefined()
    expect(data).toMatchObject({
      roundsPerWeek: 3,
      headToHead: true,
      divisionCount: 2,
      slotMode: 'single',
      singleSlotLabel: '7 – 10 PM',
      courts: [3, 4],
      defaultTierCount: 6,
      isActive: false,
    })
  })

  it('rejects rules outside the allowed ranges', () => {
    const bad = patch => parseLeagueInput({ ...newLeague, ...patch }, { create: true }).error
    expect(bad({ divisionCount: 5 })).toMatch(/Playoff divisions/)
    expect(bad({ roundsPerWeek: '0' })).toMatch(/Rounds per week/)
    expect(bad({ roundsPerWeek: '2.5' })).toMatch(/Rounds per week/)
    expect(bad({ slotMode: 'three' })).toMatch(/Time slots/)
    expect(bad({ courts: '6, 6' })).toMatch(/only be listed once/)
    expect(bad({ courts: 'six' })).toMatch(/Courts/)
    expect(bad({ earlySlotLabel: '' })).toMatch(/Early slot time/)
    expect(bad({ headToHead: 'yes' })).toMatch(/headToHead/)
  })
})

describe('parseLeagueInput() — update', () => {
  it('returns only the fields that were sent', () => {
    expect(parseLeagueInput({ name: 'Tuesday COED Premier' })).toEqual({ data: { name: 'Tuesday COED Premier' } })
    expect(parseLeagueInput({ isActive: true })).toEqual({ data: { isActive: true } })
  })

  it('never changes the URL name', () => {
    expect(parseLeagueInput({ slug: 'new-url' })).toEqual({ data: {} })
  })
})

describe('tiersPerSlotFor()', () => {
  it('splits the default tier count across two slots, or keeps it for one', () => {
    expect(tiersPerSlotFor({ slotMode: 'two', defaultTierCount: 8 })).toBe(4)
    expect(tiersPerSlotFor({ slotMode: 'two', defaultTierCount: 5 })).toBe(3)
    expect(tiersPerSlotFor({ slotMode: 'single', defaultTierCount: 5 })).toBe(5)
  })
})
