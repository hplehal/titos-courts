'use client'

// Lightweight team picker. Renders a labelled <select> with every team in the
// tournament grouped by pool. Selection is stored in localStorage (so players
// don't have to re-pick on every visit) and surfaced back to the parent hub
// via the onChange callback. "All teams" resets to the full hub view.

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { cleanTeamName } from '@/lib/tournament/displayName'

const STORAGE_KEY_PREFIX = 'titos:tourney-team:'

export default function TeamPicker({ slug, pools = [], value, onChange }) {
  const [hydrated, setHydrated] = useState(false)

  // Restore preference from localStorage on mount.
  useEffect(() => {
    setHydrated(true)
    if (!slug || value) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + slug)
      if (saved) onChange?.(saved)
    } catch {
      /* localStorage unavailable (private mode, etc.) — silently ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const handleChange = (e) => {
    const next = e.target.value
    onChange?.(next)
    try {
      if (next) localStorage.setItem(STORAGE_KEY_PREFIX + slug, next)
      else localStorage.removeItem(STORAGE_KEY_PREFIX + slug)
    } catch { /* noop */ }
  }

  return (
    <label className="block mb-6">
      <span className="sr-only">Pick your team</span>
      <div className="relative">
        <Users
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-titos-gray-500 pointer-events-none"
          aria-hidden="true"
        />
        <select
          value={hydrated ? (value || '') : ''}
          onChange={handleChange}
          aria-label="Select your team to see your schedule and ref duties"
          className="w-full pl-10 pr-10 h-12 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold appearance-none cursor-pointer transition-colors hover:border-titos-gold/40"
        >
          <option value="">Pick your team — see your schedule & ref duties</option>
          {pools.map((pool) => (
            <optgroup key={pool.id} label={pool.name}>
              {(pool.teams || [])
                .slice()
                .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.seed ? `${t.seed}. ` : ''}{cleanTeamName(t.name)}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {/* Caret */}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-titos-gray-500"
        >
          <path d="M5 7l5 6 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  )
}
