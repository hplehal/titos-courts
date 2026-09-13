// Validation for admin league create/update (/api/admin/leagues). Pure so it
// can be unit-tested. Returns { data } holding only the fields present in the
// body (so an update touches just what changed), or { error }.

import { DIVISION_NAMES, leagueRules } from '@/lib/league/seasonConfig'
import { slugify } from '@/lib/utils'

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const SLOT_MODES = ['two', 'single']
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_TIERS = 20

const INT_FIELDS = [
  // [key, label, min, max, requiredOnCreate]
  ['registrationFee', 'Registration fee', 0, 100000, true],
  ['maxTeams', 'Max teams', 1, 200, true],
  ['roundsPerWeek', 'Rounds per week', 1, 5, false],
  ['divisionCount', 'Playoff divisions', 1, DIVISION_NAMES.length, false],
  ['defaultTierCount', 'Default tier count', 1, MAX_TIERS, false],
]

const LABEL_FIELDS = [
  ['earlySlotLabel', 'Early slot time'],
  ['lateSlotLabel', 'Late slot time'],
  ['singleSlotLabel', 'Single slot time'],
  ['timeRangeLabel', 'Game night hours'],
]

const toNumber = v => (v === '' || v == null ? NaN : Number(typeof v === 'string' ? v.trim() : v))

export function parseLeagueInput(body = {}, { create = false } = {}) {
  const has = key => body[key] !== undefined
  const data = {}

  if (create || has('name')) {
    const name = String(body.name ?? '').trim()
    if (!name) return { error: 'League name is required' }
    if (name.length > 60) return { error: 'League name must be 60 characters or fewer' }
    data.name = name
  }

  // The slug is the league's URL (/leagues/<slug>) — set once at creation.
  if (create) {
    const slug = String(body.slug ?? '').trim().toLowerCase() || slugify(data.name)
    if (!SLUG_PATTERN.test(slug) || slug.length > 60) {
      return { error: 'URL name can only use lowercase letters, numbers and single dashes' }
    }
    data.slug = slug
  }

  if (create || has('dayOfWeek')) {
    if (!DAYS_OF_WEEK.includes(body.dayOfWeek)) return { error: 'Pick a day of the week' }
    data.dayOfWeek = body.dayOfWeek
  }

  if (has('description')) {
    const description = String(body.description ?? '').trim()
    if (description.length > 500) return { error: 'Description must be 500 characters or fewer' }
    data.description = description || null
  }

  for (const [key, label, min, max, requiredOnCreate] of INT_FIELDS) {
    if (!has(key)) {
      if (create && requiredOnCreate) return { error: `${label} is required` }
      continue
    }
    const n = toNumber(body[key])
    if (!Number.isInteger(n) || n < min || n > max) {
      return { error: `${label} must be a whole number from ${min} to ${max}` }
    }
    data[key] = n
  }

  for (const key of ['headToHead', 'isActive']) {
    if (!has(key)) continue
    if (typeof body[key] !== 'boolean') return { error: `${key} must be true or false` }
    data[key] = body[key]
  }

  if (has('slotMode')) {
    if (!SLOT_MODES.includes(body.slotMode)) return { error: 'Time slots must be "two" or "single"' }
    data.slotMode = body.slotMode
  }

  for (const [key, label] of LABEL_FIELDS) {
    if (!has(key)) continue
    const value = String(body[key] ?? '').trim()
    if (!value || value.length > 40) return { error: `${label} must be 1–40 characters` }
    data[key] = value
  }

  if (has('courts')) {
    const list = Array.isArray(body.courts) ? body.courts : String(body.courts).split(',')
    const courts = list.map(toNumber)
    if (!courts.length || courts.length > 12 || courts.some(c => !Number.isInteger(c) || c < 1 || c > 99)) {
      return { error: 'Courts must be 1–12 court numbers between 1 and 99' }
    }
    if (new Set(courts).size !== courts.length) return { error: 'Each court can only be listed once' }
    data.courts = courts
  }

  return { data }
}

// League.tiersPerSlot is a legacy required column; keep it in step with the
// rules so older readers (e.g. the /leagues fallback tier count) stay right.
export function tiersPerSlotFor(league) {
  const { slotMode, defaultTierCount } = leagueRules(league)
  return slotMode === 'single' ? defaultTierCount : Math.ceil(defaultTierCount / 2)
}
