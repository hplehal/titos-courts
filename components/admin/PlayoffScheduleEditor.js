'use client'

// Admin playoff schedule editor. One panel per division; every playoff match
// is editable — week, start time, court, teams or placeholder labels, ref,
// and where the winner goes. Divisions can be rebuilt from the standings
// when their size changed, and a division's start times shifted in bulk.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIVISION_NAMES } from '@/lib/league/seasonConfig'

const ROUNDS = [
  { value: 1, label: 'QF' },
  { value: 2, label: 'SF' },
  { value: 3, label: 'Final' },
]
const roundLabel = n => ROUNDS.find(r => r.value === Number(n))?.label || `Round ${n}`

const DIVISION_TEXT = { Diamond: 'text-div-diamond', Platinum: 'text-div-platinum', Gold: 'text-div-gold', Silver: 'text-div-silver' }
const JSON_HEADERS = { 'Content-Type': 'application/json' }
const field = 'px-2 py-1.5 bg-titos-surface border border-titos-border rounded text-titos-white text-xs focus:outline-none focus:border-titos-gold/50'
const smallBtn = 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase border flex items-center gap-1 transition-colors disabled:opacity-50'

const pad = n => String(n).padStart(2, '0')

// "HH:MM" in the admin's local time, or '' when unscheduled.
function timeValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// A week's calendar day + a local "HH:MM" → ISO timestamp.
function combine(weekDate, hhmm) {
  if (!hhmm) return null
  const day = new Date(weekDate)
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).toISOString()
}

// Number of distinct seeds placed in a bracket ("Diamond 4" → seed 4).
function bracketSize(matches) {
  const seeds = new Set()
  for (const m of matches) {
    for (const label of [m.homeSeedLabel, m.awaySeedLabel]) {
      const hit = /\s(\d+)$/.exec(label || '')
      if (hit) seeds.add(Number(hit[1]))
    }
  }
  return seeds.size
}

function formFromMatch(m) {
  return {
    weekId: m.weekId,
    roundNumber: String(m.roundNumber),
    gameOrder: String(m.gameOrder),
    time: timeValue(m.scheduledTime),
    courtNumber: m.courtNumber == null ? '' : String(m.courtNumber),
    homeTeamId: m.homeTeamId || '',
    homeSeedLabel: m.homeSeedLabel || '',
    awayTeamId: m.awayTeamId || '',
    awaySeedLabel: m.awaySeedLabel || '',
    refTeamId: m.refTeamId || '',
    refSeedLabel: m.refSeedLabel || '',
    nextMatchId: m.nextMatchId || '',
    nextSlot: m.nextSlot || '',
  }
}

const PLAIN_FIELDS = ['weekId', 'roundNumber', 'gameOrder', 'courtNumber', 'homeTeamId', 'homeSeedLabel', 'awayTeamId', 'awaySeedLabel', 'refTeamId', 'refSeedLabel']

// PATCH body with only the fields the admin changed.
function changesFor(match, form, weeks) {
  const base = formFromMatch(match)
  const body = {}
  for (const key of PLAIN_FIELDS) {
    if (form[key] !== base[key]) body[key] = form[key]
  }
  if (form.nextMatchId !== base.nextMatchId || form.nextSlot !== base.nextSlot) {
    body.nextMatchId = form.nextMatchId
    body.nextSlot = form.nextSlot
  }
  if (form.time !== base.time || form.weekId !== base.weekId) {
    const week = weeks.find(w => w.id === form.weekId)
    body.scheduledTime = week ? combine(week.date, form.time) : null
  }
  return body
}

async function send(url, method, body) {
  const res = await fetch(url, { method, headers: JSON_HEADERS, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

function SideInput({ label, teamId, seedLabel, teams, onTeam, onLabel, placeholder }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="w-12 flex-shrink-0 text-[10px] uppercase tracking-wider font-bold text-titos-gray-500">{label}</span>
      <select value={teamId} onChange={(e) => onTeam(e.target.value)} aria-label={`${label} team`} className={cn(field, 'min-w-0 flex-1')}>
        <option value="">TBD</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input value={seedLabel} onChange={(e) => onLabel(e.target.value)} placeholder={placeholder} maxLength={40}
        aria-label={`${label} placeholder label`} title="Shown until a team is set" className={cn(field, 'w-28 flex-shrink-0')} />
    </div>
  )
}

function MatchRow({ match, seasonId, weeks, teams, divisionMatches, onChanged, setMsg }) {
  const [form, setForm] = useState(() => formFromMatch(match))
  const [busy, setBusy] = useState('')
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const changes = changesFor(match, form, weeks)
  const dirty = Object.keys(changes).length > 0
  const url = `/api/admin/seasons/${seasonId}/playoffs/matches/${match.id}`
  const name = `${roundLabel(match.roundNumber)} ${match.gameOrder}`

  const run = async (label, fn, okText) => {
    setBusy(label)
    try {
      await fn()
      setMsg({ kind: 'ok', text: okText })
      await onChanged()
    } catch (err) {
      setMsg({ kind: 'err', text: err.message })
      setBusy('')
    }
  }

  const save = () => run('save', () => send(url, 'PATCH', changes), `${name} saved`)
  const remove = () => {
    if (!confirm(`Delete ${name}? Its scores are removed and any match sending its winner here loses that link.`)) return
    run('delete', () => send(url, 'DELETE'), `${name} deleted`)
  }

  const weekNumberOf = m => weeks.find(w => w.id === m.weekId)?.weekNumber ?? '?'

  return (
    <div className={cn('card-flat rounded-lg p-3 space-y-2', dirty && 'ring-1 ring-titos-gold/40')}>
      <div className="flex flex-wrap items-center gap-2">
        <select value={form.roundNumber} onChange={(e) => set('roundNumber', e.target.value)} aria-label="Round" className={field}>
          {ROUNDS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <input type="number" min="1" value={form.gameOrder} onChange={(e) => set('gameOrder', e.target.value)} aria-label="Game number" title="Game #" className={cn(field, 'w-14 text-center')} />
        <select value={form.weekId} onChange={(e) => set('weekId', e.target.value)} aria-label="Week" className={field}>
          {weeks.map(w => <option key={w.id} value={w.id}>Week {w.weekNumber}</option>)}
        </select>
        <input type="time" step="900" value={form.time} onChange={(e) => set('time', e.target.value)} aria-label="Start time" className={cn(field, '[color-scheme:dark]')} />
        <label className="flex items-center gap-1 text-[11px] text-titos-gray-400">
          Court
          <input type="number" min="1" max="99" placeholder="TBD" value={form.courtNumber} onChange={(e) => set('courtNumber', e.target.value)} className={cn(field, 'w-16 text-center')} />
        </label>
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
          match.status === 'completed' ? 'bg-status-success/15 text-status-success' : 'bg-titos-gray-400/15 text-titos-gray-400')}>
          {match.status}
        </span>
        <div className="flex gap-1.5 ml-auto">
          <button type="button" onClick={save} disabled={!dirty || !!busy}
            className={cn(smallBtn, 'bg-status-success/10 text-status-success border-status-success/30 hover:bg-status-success/20')}>
            {busy === 'save' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
          </button>
          <button type="button" onClick={remove} disabled={!!busy} aria-label={`Delete ${name}`}
            className={cn(smallBtn, 'bg-status-live/5 text-status-live/70 border-status-live/15 hover:bg-status-live/10 hover:text-status-live')}>
            {busy === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        <SideInput label="Home" teamId={form.homeTeamId} seedLabel={form.homeSeedLabel} teams={teams} placeholder="e.g. Diamond 1"
          onTeam={v => set('homeTeamId', v)} onLabel={v => set('homeSeedLabel', v)} />
        <SideInput label="Away" teamId={form.awayTeamId} seedLabel={form.awaySeedLabel} teams={teams} placeholder="e.g. W QF1"
          onTeam={v => set('awayTeamId', v)} onLabel={v => set('awaySeedLabel', v)} />
        <SideInput label="Ref" teamId={form.refTeamId} seedLabel={form.refSeedLabel} teams={teams} placeholder="e.g. Loser QF1"
          onTeam={v => set('refTeamId', v)} onLabel={v => set('refSeedLabel', v)} />
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-12 flex-shrink-0 text-[10px] uppercase tracking-wider font-bold text-titos-gray-500">Winner</span>
          <select value={form.nextMatchId} aria-label="Winner goes to"
            onChange={(e) => { const v = e.target.value; setForm(f => ({ ...f, nextMatchId: v, nextSlot: v ? (f.nextSlot || 'away') : '' })) }}
            className={cn(field, 'min-w-0 flex-1')}>
            <option value="">Nowhere (last game)</option>
            {divisionMatches.filter(o => o.id !== match.id).map(o => (
              <option key={o.id} value={o.id}>→ {roundLabel(o.roundNumber)} {o.gameOrder} · Week {weekNumberOf(o)}</option>
            ))}
          </select>
          <select value={form.nextSlot} onChange={(e) => set('nextSlot', e.target.value)} disabled={!form.nextMatchId} aria-label="Winner side"
            title="Auto: quarterfinal winners reseed into the semifinals; otherwise the winner fills the empty side"
            className={cn(field, 'w-24 flex-shrink-0 disabled:opacity-50')}>
            <option value="home">as home</option>
            <option value="away">as away</option>
            <option value="">auto</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function DivisionPanel({ division, matches, seasonId, weeks, teams, onChanged, setMsg }) {
  const [busy, setBusy] = useState('')
  const built = bracketSize(matches)
  const mismatch = matches.length > 0 && built !== division.teamCount
  const ordered = [...matches].sort((a, b) => a.roundNumber - b.roundNumber || a.gameOrder - b.gameOrder)
  const matchesUrl = `/api/admin/seasons/${seasonId}/playoffs/matches`

  const run = async (label, fn) => {
    setBusy(label)
    try {
      setMsg({ kind: 'ok', text: await fn() })
    } catch (err) {
      setMsg({ kind: 'err', text: err.message })
    }
    await onChanged()
    setBusy('')
  }

  const rebuild = () => {
    const replacing = matches.length ? ' Its current playoff matches, edits and scores are replaced.' : ''
    if (!confirm(`Build ${division.name} from the standings as a ${division.teamCount}-team bracket?${replacing}`)) return
    run('rebuild', async () => {
      await send(`/api/admin/seasons/${seasonId}/playoffs`, 'POST', { positions: [division.position] })
      return `${division.name} bracket built`
    })
  }

  const addMatch = () => run('add', async () => {
    const week = weeks[weeks.length - 1]
    if (!week) throw new Error('Build a bracket first — that creates the playoff weeks.')
    await send(matchesUrl, 'POST', { tierNumber: division.position, weekId: week.id, roundNumber: 1 })
    return `Match added to ${division.name}`
  })

  const shiftTimes = (minutes) => run('shift', async () => {
    const timed = matches.filter(m => m.scheduledTime)
    if (!timed.length) throw new Error(`${division.name} has no start times to move`)
    for (const m of timed) {
      const scheduledTime = new Date(new Date(m.scheduledTime).getTime() + minutes * 60_000).toISOString()
      await send(`${matchesUrl}/${m.id}`, 'PATCH', { scheduledTime })
    }
    return `${division.name} times moved ${minutes > 0 ? 'later' : 'earlier'} by ${Math.abs(minutes)} min`
  })

  return (
    <section className="rounded-xl ring-1 ring-titos-border/40 p-3 sm:p-4 space-y-3">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className={cn('font-display text-lg font-black', DIVISION_TEXT[division.name] || 'text-titos-white')}>{division.name}</h3>
        <span className="text-xs text-titos-gray-400">
          {division.teamCount} team{division.teamCount === 1 ? '' : 's'}{division.courtNumber ? ` · Court ${division.courtNumber}` : ''}
        </span>
        <div className="flex flex-wrap gap-1.5 ml-auto">
          <button type="button" onClick={() => shiftTimes(-30)} disabled={!!busy || !matches.length}
            className={cn(smallBtn, 'bg-titos-card text-titos-gray-300 border-titos-border hover:text-titos-white')}>−30 min</button>
          <button type="button" onClick={() => shiftTimes(30)} disabled={!!busy || !matches.length}
            className={cn(smallBtn, 'bg-titos-card text-titos-gray-300 border-titos-border hover:text-titos-white')}>+30 min</button>
          <button type="button" onClick={addMatch} disabled={!!busy}
            className={cn(smallBtn, 'bg-titos-gold/10 text-titos-gold border-titos-gold/30 hover:bg-titos-gold/20')}>
            {busy === 'add' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Match
          </button>
          <button type="button" onClick={rebuild} disabled={!!busy || division.teamCount < 2}
            className={cn(smallBtn, 'bg-titos-card text-titos-gray-300 border-titos-border hover:text-titos-white')}>
            {busy === 'rebuild' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} {matches.length ? 'Rebuild' : 'Build'}
          </button>
        </div>
      </header>

      {mismatch && (
        <p className="flex items-start gap-2 text-xs text-titos-gold bg-titos-gold/10 border border-titos-gold/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          This bracket seeds {built} teams but {division.name} is now {division.teamCount}. Rebuild to re-seed it from the standings, or edit the matches below.
        </p>
      )}

      {ordered.length ? ordered.map(m => (
        <MatchRow
          key={`${m.id}:${JSON.stringify(formFromMatch(m))}`}
          match={m}
          seasonId={seasonId}
          weeks={weeks}
          teams={teams}
          divisionMatches={ordered}
          onChanged={onChanged}
          setMsg={setMsg}
        />
      )) : (
        <p className="text-titos-gray-500 text-sm">No matches yet.</p>
      )}
    </section>
  )
}

export default function PlayoffScheduleEditor({ seasonId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState({ kind: '', text: '' })

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/playoffs/matches`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) setError(json.error || 'Failed to load playoff matches')
      else { setData(json); setError('') }
    } catch { setError('Network error') }
  }, [seasonId])

  useEffect(() => { load() }, [load])

  // Every configured division, plus any division that still has matches after
  // its size was set to 0.
  const panels = useMemo(() => {
    if (!data) return []
    const list = [...data.divisions]
    for (const m of data.matches) {
      if (!list.some(d => d.position === m.tierNumber)) {
        list.push({ position: m.tierNumber, name: DIVISION_NAMES[m.tierNumber - 1] || `Division ${m.tierNumber}`, teamCount: 0, courtNumber: null })
      }
    }
    return list.sort((a, b) => a.position - b.position)
  }, [data])

  if (error) return <p className="text-status-live text-sm" role="alert">{error}</p>
  if (!data) {
    return <div className="flex items-center gap-2 text-titos-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading schedule…</div>
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-titos-gray-500">
        Times are in your computer&apos;s time zone. Saved changes show on the public bracket right away. Scores are still entered on the Scores page.
      </p>
      {msg.text && (
        <div role="status" className={cn('text-sm rounded-lg border px-3 py-2',
          msg.kind === 'ok' ? 'bg-status-success/10 border-status-success/30 text-status-success' : 'bg-status-live/10 border-status-live/30 text-status-live')}>
          {msg.text}
        </div>
      )}
      {panels.map(d => (
        <DivisionPanel
          key={d.position}
          division={d}
          matches={data.matches.filter(m => m.tierNumber === d.position)}
          seasonId={seasonId}
          weeks={data.weeks}
          teams={data.teams}
          onChanged={load}
          setMsg={setMsg}
        />
      ))}
    </div>
  )
}
