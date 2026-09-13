// Grouping helpers for the admin waivers list. A waiver stores the league
// name and team name exactly as the player saw or typed them when signing, so
// the filters have to line old league names up with renamed leagues and fold
// spelling variants of the same team together. Pure — unit-tested.

export const TOURNAMENT_KEY = 'tournament'
export const NO_LEAGUE_KEY = 'none'

/** A team name folded for grouping: case, spacing and apostrophes are ignored. */
export function teamKey(name) {
  return String(name ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['’‘`´]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The filter bucket a waiver belongs to: a league slug, TOURNAMENT_KEY, or
 * NO_LEAGUE_KEY. The stored league name is matched against each league's
 * current name first, then by its day ("Tuesday COED" → the league that plays
 * Tuesdays) when exactly one league plays that day, so waivers signed before a
 * rename still land under the right league.
 */
export function waiverLeagueKey(waiver, leagues) {
  const label = String(waiver.leagueDay ?? '').trim().toLowerCase()
  if (!label) return waiver.tournamentName ? TOURNAMENT_KEY : NO_LEAGUE_KEY
  if (label.startsWith('tournament')) return TOURNAMENT_KEY

  const exact = leagues.find(l => l.name.toLowerCase() === label)
  if (exact) return exact.slug

  const sameDay = leagues.filter(l => label.startsWith(l.dayOfWeek.toLowerCase()))
  return sameDay.length === 1 ? sameDay[0].slug : NO_LEAGUE_KEY
}

/**
 * Team choices for a set of waivers: spelling variants grouped under their
 * most common spelling, sorted by name, each with its waiver count. Waivers
 * without a team name are left out.
 * @returns {Array<{ key: string, name: string, count: number }>}
 */
export function teamOptions(waivers) {
  const groups = new Map()
  for (const w of waivers) {
    const key = teamKey(w.teamName)
    if (!key) continue
    const group = groups.get(key) || { key, count: 0, spellings: new Map() }
    const spelling = w.teamName.trim().replace(/\s+/g, ' ')
    group.count++
    group.spellings.set(spelling, (group.spellings.get(spelling) || 0) + 1)
    groups.set(key, group)
  }
  return [...groups.values()]
    .map(({ key, count, spellings }) => ({
      key,
      count,
      name: [...spellings].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}
