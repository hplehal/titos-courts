'use client'

// Admin-only inline editor for bracket match metadata (court + ref team).
// Lives above the ScoreEntry block on the bracket admin page so whoever's
// running the event can set "Court 2, reffed by Team X" in one place and
// that info then renders publicly on the bracket tree for players.
//
// Design notes:
//   - Deliberately compact (single row on sm+) so it doesn't dominate each
//     match card. Ref picker defaults to "— None —" because most events
//     assign refs only after seeding resolves.
//   - Save is debounced per-match via a local "dirty" flag; we don't auto-
//     save on every keystroke, since admins sometimes open the number input
//     and tab away. Explicit Save button matches the ScoreEntry pattern.

import { useState, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminPatch } from '@/lib/adminFetch'
import { cleanTeamName } from '@/lib/tournament/displayName'

export default function BracketMatchMeta({ match, slug, tournamentTeams, onSaved, flush = false }) {
  const [court, setCourt] = useState(match.courtNumber ?? '')
  const [refTeamId, setRefTeamId] = useState(match.refTeamId ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  // When the underlying match data refreshes (e.g. after a score save polls
  // the server), pull the latest court/ref so the form doesn't go stale.
  useEffect(() => {
    setCourt(match.courtNumber ?? '')
    setRefTeamId(match.refTeamId ?? '')
    setMsg('')
  }, [match.id, match.courtNumber, match.refTeamId])

  const dirty =
    String(court) !== String(match.courtNumber ?? '') ||
    refTeamId !== (match.refTeamId ?? '')

  const save = async () => {
    setBusy(true); setMsg('')
    try {
      const payload = {
        courtNumber: court === '' ? null : Number(court),
        refTeamId: refTeamId || null,
      }
      const res = await adminPatch(
        `/api/admin/tournaments/${slug}/bracket-matches/${match.id}`,
        payload,
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg(data.error || 'Failed')
      } else {
        setMsg('Saved')
        onSaved?.(data)
      }
    } catch {
      setMsg('Connection error')
    }
    setBusy(false)
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-2 px-3 py-2',
        flush
          ? 'border-b border-titos-border/30 bg-titos-elevated/20'
          : 'rounded-lg border border-titos-border/40 bg-titos-elevated/30',
      )}
    >
      <div className="flex flex-col gap-1 min-w-[5rem]">
        <label
          htmlFor={`court-${match.id}`}
          className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500"
        >
          Court
        </label>
        <input
          id={`court-${match.id}`}
          type="number"
          inputMode="numeric"
          min="1"
          max="99"
          step="1"
          value={court}
          onChange={(e) => setCourt(e.target.value)}
          placeholder="—"
          className="h-9 w-20 px-2 rounded border border-titos-border bg-titos-surface text-center text-titos-white text-sm font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[10rem]">
        <label
          htmlFor={`ref-${match.id}`}
          className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500"
        >
          Ref team
        </label>
        <select
          id={`ref-${match.id}`}
          value={refTeamId}
          onChange={(e) => setRefTeamId(e.target.value)}
          className="h-9 px-2 rounded border border-titos-border bg-titos-surface text-titos-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold cursor-pointer"
        >
          <option value="">— None —</option>
          {tournamentTeams.map(t => (
            <option key={t.id} value={t.id}>{cleanTeamName(t.name)}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        {msg && (
          <span
            className={cn(
              'text-[11px]',
              msg === 'Saved' ? 'text-status-success' : 'text-titos-gray-400',
            )}
            role="status"
            aria-live="polite"
          >
            {msg}
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          aria-label="Save court and ref"
          className={cn(
            'h-9 px-3 rounded text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold',
            dirty && !busy
              ? 'bg-titos-gold text-titos-black hover:bg-titos-gold/90'
              : 'bg-titos-elevated text-titos-gray-500 cursor-not-allowed',
          )}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
          Save
        </button>
      </div>
    </div>
  )
}
