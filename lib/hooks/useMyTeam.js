'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to persist a "my team" selection per league via sessionStorage.
 * Persists within the browser session (clears when tab closes).
 */
export function useMyTeam(leagueSlug) {
  const key = `titos-my-team-${leagueSlug || 'default'}`
  const [team, setTeamState] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(key)
      if (stored) setTeamState(stored)
    }
  }, [key])

  const setTeam = (name) => {
    setTeamState(name)
    if (typeof window !== 'undefined') {
      if (name) {
        sessionStorage.setItem(key, name)
      } else {
        sessionStorage.removeItem(key)
      }
    }
  }

  return [team, setTeam]
}
