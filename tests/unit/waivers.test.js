import { describe, it, expect } from 'vitest'
import { NO_LEAGUE_KEY, TOURNAMENT_KEY, teamKey, teamOptions, waiverLeagueKey } from '@/lib/waivers'

// Leagues as they are named today — two were renamed after waivers were signed.
const leagues = [
  { slug: 'tuesday-coed', name: 'Tuesday COED Competitive', dayOfWeek: 'Tuesday' },
  { slug: 'sunday-mens', name: 'Sunday MENS', dayOfWeek: 'Sunday' },
  { slug: 'thursday-rec-coed', name: 'Thursday COED Low Intermediate', dayOfWeek: 'Thursday' },
]

describe('teamKey()', () => {
  it('ignores case, extra spaces and apostrophes', () => {
    expect(teamKey('Old school ')).toBe(teamKey('old  School'))
    expect(teamKey('Maadhav’s Team')).toBe(teamKey('Maadhavs Team'))
    expect(teamKey("Ricky's Babics")).toBe('rickys babics')
  })

  it('treats a missing name as empty', () => {
    expect(teamKey(null)).toBe('')
    expect(teamKey('   ')).toBe('')
  })
})

describe('waiverLeagueKey()', () => {
  it("matches a league by its current name", () => {
    expect(waiverLeagueKey({ leagueDay: 'Sunday MENS' }, leagues)).toBe('sunday-mens')
    expect(waiverLeagueKey({ leagueDay: 'tuesday coed competitive' }, leagues)).toBe('tuesday-coed')
  })

  it('files waivers signed before a rename under the league that plays that day', () => {
    expect(waiverLeagueKey({ leagueDay: 'Tuesday COED' }, leagues)).toBe('tuesday-coed')
    expect(waiverLeagueKey({ leagueDay: 'Thursday REC COED' }, leagues)).toBe('thursday-rec-coed')
  })

  it('does not guess when two leagues play the same day', () => {
    const twoTuesdays = [...leagues, { slug: 'tuesday-womens', name: "Tuesday Women's", dayOfWeek: 'Tuesday' }]
    expect(waiverLeagueKey({ leagueDay: 'Tuesday COED' }, twoTuesdays)).toBe(NO_LEAGUE_KEY)
    expect(waiverLeagueKey({ leagueDay: "Tuesday Women's" }, twoTuesdays)).toBe('tuesday-womens')
  })

  it('separates tournament waivers and ones with no league', () => {
    expect(waiverLeagueKey({ leagueDay: 'Tournament' }, leagues)).toBe(TOURNAMENT_KEY)
    expect(waiverLeagueKey({ leagueDay: null, tournamentName: 'May Madness' }, leagues)).toBe(TOURNAMENT_KEY)
    expect(waiverLeagueKey({ leagueDay: null }, leagues)).toBe(NO_LEAGUE_KEY)
    expect(waiverLeagueKey({ leagueDay: 'Friday Open' }, leagues)).toBe(NO_LEAGUE_KEY)
  })
})

describe('teamOptions()', () => {
  const waivers = [
    { teamName: 'Moshi Moshi' },
    { teamName: 'Moshi moshi' },
    { teamName: 'Moshi Moshi ' },
    { teamName: 'ace eating szn' },
    { teamName: 'Ace Eating Szn' },
    { teamName: 'Ace Eating Szn' },
    { teamName: null },
    { teamName: '  ' },
  ]

  it('groups spellings under the most common one, with counts, sorted by name', () => {
    expect(teamOptions(waivers)).toEqual([
      { key: 'ace eating szn', name: 'Ace Eating Szn', count: 3 },
      { key: 'moshi moshi', name: 'Moshi Moshi', count: 3 },
    ])
  })

  it('returns nothing for waivers without team names', () => {
    expect(teamOptions([{ teamName: null }, { teamName: '' }])).toEqual([])
  })
})
