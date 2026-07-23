// Defensive display helpers for team names.
//
// Historically some tournament teams were saved with admin-ism suffixes in
// their `name` field (e.g. "Adrian · Pool assigned", "Mo · Pool assigned")
// because admins pasted the admin-page status label into the team-name
// input when creating the roster. That leaks into every public surface
// that renders the team name verbatim — bracket cards, match lists, the
// "Up Next" spotlight, etc.
//
// Rather than force a manual rename of every affected row, we strip the
// known suffix at render time. Going forward, teams with cleanly-typed
// names (no " · Pool assigned" tail) pass through untouched.
//
// Kept as a pure util so every display surface — pool cards, bracket
// cards, spotlight, ref lines — gets the same treatment consistently.

const POOL_ASSIGNED_SUFFIX = /\s*·\s*Pool\s+assigned\s*$/i

/**
 * Strip known bookkeeping tails from a team/ref display name.
 * Returns an empty string unchanged; passes through `null`/`undefined`
 * so callers can keep their `.name ?? 'TBD'` fallback chains.
 */
export function cleanTeamName(name) {
  if (name == null) return name
  if (typeof name !== 'string') return name
  return name.replace(POOL_ASSIGNED_SUFFIX, '').trim()
}
