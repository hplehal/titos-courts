// Bracket schedule (courts + scheduled times + initial refs) per the April 25
// Captains Package PDF. Pool play uses rounds 1..N on courts 1..4 at 30-min
// intervals starting at tournament.date. Bracket play picks up 3 hours after
// kickoff and runs on a fixed 45-min cadence:
//
//   QF slot 1 = kickoff + 180 min  (1:00 PM for a 10:00 AM kickoff)
//   QF slot 2 = kickoff + 225 min  (1:45 PM)
//   SF       = kickoff + 270 min  (2:30 PM)
//   F        = kickoff + 315 min  (3:15 PM)
//
// Court allocation (from the PDF):
//   Gold bracket   → Courts 1 + 2
//   Silver bracket → Courts 3 + 4
//
// Court sequence per court (time-ordered) drives the ref-rotation chain:
// the loser of match[i] on court X refs match[i+1] on court X. Everything
// below that first QF is derived at finalize-time (advanceBracketWinner);
// here we stamp the deterministic bits only.
//
// Court sequence for a standard 8-QF bracket:
//   Court 1: QF0 (1:00) → QF2 (1:45) → SF0 (2:30) → F (3:15)   [Gold]
//   Court 2: QF1 (1:00) → QF3 (1:45) → SF1 (2:30)              [Gold]
//   Court 3: QF0 (1:00) → QF2 (1:45) → SF0 (2:30) → F (3:15)   [Silver]
//   Court 4: QF1 (1:00) → QF3 (1:45) → SF1 (2:30)              [Silver]
//
// The first QF on each court (QF0/QF1) is reffed at generation time by the
// HOME team of the next QF on that court (a team that's idle at 1:00 PM
// because its pool's top half plays the later slot). Every later slot's ref
// is a "loser of previous match on this court" — filled in downstream by
// advanceBracketWinner as each match finalizes.

import { BRACKET_ROUND, DIVISION_GOLD } from './constants'

export const BRACKET_START_OFFSET_MINUTES = 180 // kickoff → first QF
export const BRACKET_SLOT_INTERVAL_MINUTES = 45  // QF1 → QF2 → SF → F

/**
 * Court assignment for a bracket match.
 *   Gold:   positions 0,2 → Court 1  |  positions 1,3 → Court 2
 *   Silver: positions 0,2 → Court 3  |  positions 1,3 → Court 4
 *
 * SF follows the same mapping (SF0 takes the same court as QF0/QF2; SF1
 * takes QF1/QF3's court). The Final always lands on the lower court.
 */
export function courtFor({ division, bracketRound, bracketPosition }) {
  const goldOffset = division === DIVISION_GOLD ? 1 : 3
  if (bracketRound === BRACKET_ROUND.FINAL) return goldOffset
  // QF/SF: even positions → lower court, odd → upper court
  return goldOffset + (bracketPosition % 2)
}

/**
 * Minute offset from kickoff for a given bracket match slot.
 * Returns null if the round isn't recognized (safe no-op for admins to
 * populate manually).
 */
export function minuteOffsetFor({ bracketRound, bracketPosition }) {
  if (bracketRound === BRACKET_ROUND.QUARTERFINAL) {
    // QF positions 0,1 are the 1:00 slot; positions 2,3 are the 1:45 slot.
    const slot = bracketPosition >= 2 ? 1 : 0
    return BRACKET_START_OFFSET_MINUTES + slot * BRACKET_SLOT_INTERVAL_MINUTES
  }
  if (bracketRound === BRACKET_ROUND.SEMIFINAL) {
    return BRACKET_START_OFFSET_MINUTES + 2 * BRACKET_SLOT_INTERVAL_MINUTES
  }
  if (bracketRound === BRACKET_ROUND.FINAL) {
    return BRACKET_START_OFFSET_MINUTES + 3 * BRACKET_SLOT_INTERVAL_MINUTES
  }
  return null
}

/**
 * Resolve the scheduled Date for a match given the tournament kickoff.
 * Returns null if either the kickoff or the round mapping is missing.
 */
export function scheduledTimeFor({ kickoff, bracketRound, bracketPosition }) {
  if (!kickoff) return null
  const offset = minuteOffsetFor({ bracketRound, bracketPosition })
  if (offset == null) return null
  const d = new Date(kickoff)
  d.setMinutes(d.getMinutes() + offset)
  return d
}

/**
 * Determine the initial ref team for the two "1:00 PM" QFs.
 *
 * Rule: the ref of QF at position P on court X is the HOME team of the
 * QF at position P+2 on the same court (guaranteed idle at 1:00 PM since
 * their match kicks off at 1:45). If no such match exists (e.g. a 4-QF
 * bracket where positions 2,3 don't exist), returns null.
 *
 * @param {object} match - the QF being reffed (needs bracketPosition)
 * @param {Array<object>} siblings - all QF matches in the same bracket
 * @returns {string|null} teamId to use as refTeam, or null
 */
export function initialQfRef(match, siblings) {
  if (match.bracketRound !== BRACKET_ROUND.QUARTERFINAL) return null
  // Only the 1:00 PM slot (positions 0,1) gets a generation-time ref.
  if (match.bracketPosition >= 2) return null
  const nextPos = match.bracketPosition + 2
  const laterSameCourt = siblings.find(
    (s) =>
      s.bracketRound === BRACKET_ROUND.QUARTERFINAL &&
      s.bracketPosition === nextPos,
  )
  return laterSameCourt?.homeTeamId ?? null
}

/**
 * Given a just-finalized bracket match, find the next match on the same
 * court (by scheduledTime). Used by advanceBracketWinner to assign the
 * loser as ref downstream. Pure helper — takes prisma explicitly so it's
 * easy to stub in tests.
 */
export async function findNextOnSameCourt(prisma, finalizedMatch) {
  if (!finalizedMatch?.courtNumber || !finalizedMatch?.scheduledTime) return null
  return prisma.tournamentMatch.findFirst({
    where: {
      bracketId: finalizedMatch.bracketId,
      courtNumber: finalizedMatch.courtNumber,
      scheduledTime: { gt: finalizedMatch.scheduledTime },
    },
    orderBy: { scheduledTime: 'asc' },
    select: { id: true, refTeamId: true },
  })
}
