// Single source of truth for the string-valued enums used in the tournament
// system. Existing schema keeps status/division as strings (not DB enums);
// using constants everywhere prevents typos and makes refactoring easier.

export const DIVISION_GOLD = 'Gold'
export const DIVISION_SILVER = 'Silver'
export const DIVISIONS = [DIVISION_GOLD, DIVISION_SILVER]

export const MATCH_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINAL: 'completed',
})

export const TOURNAMENT_STATUS = Object.freeze({
  REGISTRATION: 'registration',
  FULL: 'full',
  ACTIVE: 'active',
  COMPLETED: 'completed',
})

export const BRACKET_ROUND = Object.freeze({
  QUARTERFINAL: 1,
  SEMIFINAL: 2,
  FINAL: 3,
})

// Pool labels: uppercase letters A, B, C, ...
export function poolLabel(index) {
  return String.fromCharCode(65 + index)
}

// Scheduled interval between consecutive pool-play rounds, per the captain's
// package (10:00, 10:30, 11:00, ...). Each set is hard-capped at ~30 min.
export const ROUND_INTERVAL_MINUTES = 30
