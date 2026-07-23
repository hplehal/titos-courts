'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trophy, Plus, Loader2, Trash2, X } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { cn, formatDate } from '@/lib/utils'

const STATUS_STYLES = {
  registration: 'bg-status-info/15 text-status-info',
  active: 'bg-status-success/15 text-status-success',
  completed: 'bg-titos-gray-400/15 text-titos-gray-400',
}

export default function TournamentAdminPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: '', date: '', format: '', maxTeams: '', registrationFee: '' })

  const load = useCallback(() => {
    fetch('/api/tournaments').then(r => r.json()).then(data => {
      setTournaments(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/admin/tournaments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setMessage(`"${data.tournament.name}" created`)
      setForm({ name: '', date: '', format: '', maxTeams: '', registrationFee: '' })
      setShowForm(false)
      load()
    } else {
      setMessage(data.error || 'Failed to create tournament')
    }
    setSaving(false)
  }

  const updateStatus = async (tournamentId, status) => {
    await fetch('/api/admin/tournaments', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId, status }),
    })
    setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, status } : t))
  }

  const handleDelete = async (t) => {
    if (!confirm(`Delete "${t.name}"? This removes all teams, pools, brackets, and scores. Cannot be undone.`)) return
    await fetch('/api/admin/tournaments', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: t.id }),
    })
    setMessage(`Deleted "${t.name}"`)
    load()
  }

  return (
    <div>
      <div className="max-w-5xl">
        <AdminPageHeader title="Tournaments" description="Create tournaments and manage brackets.">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Tournament
          </button>
        </AdminPageHeader>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-titos-gold/10 border border-titos-gold/30 text-titos-gold text-sm font-medium flex items-center justify-between">
            {message}
            <button onClick={() => setMessage('')} className="text-titos-gold/60 hover:text-titos-gold"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Create form — only name and date required */}
        {showForm && (
          <div className="card rounded-xl p-6 mb-8">
            <h3 className="font-display text-lg font-bold text-titos-white mb-1">Create Tournament</h3>
            <p className="text-titos-gray-400 text-xs mb-4">Only a name and date are needed — everything else is optional and can be set later.</p>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Tournament name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                className="px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required
                className="px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50 [color-scheme:dark]" />
              <input type="text" placeholder="Format (e.g. Pools + Playoffs)" value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value }))}
                className="px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
              <div className="flex gap-2">
                <input type="number" placeholder="Max teams" value={form.maxTeams} onChange={e => setForm(p => ({ ...p, maxTeams: e.target.value }))}
                  className="flex-1 min-w-0 px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
                <input type="number" placeholder="Fee ($)" value={form.registrationFee} onChange={e => setForm(p => ({ ...p, registrationFee: e.target.value }))}
                  className="flex-1 min-w-0 px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-titos-gray-400 hover:text-titos-white text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Tournament
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {tournaments.map(t => (
              <div key={t.id} className="card-flat rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display text-lg font-bold text-titos-white">{t.name}</h3>
                      <select
                        value={t.status}
                        onChange={e => updateStatus(t.id, e.target.value)}
                        className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase appearance-none cursor-pointer border-0 focus:outline-none',
                          STATUS_STYLES[t.status] || STATUS_STYLES.registration)}
                      >
                        <option value="registration">Registration</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <p className="text-titos-gray-400 text-sm">
                      {formatDate(t.date)} &middot; {t._count?.tournamentTeams || 0} teams
                      {t.format && <> &middot; {t.format}</>}
                      {t.maxTeams && <> &middot; max {t.maxTeams}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Link
                      href={`/tournaments/${t.slug}`}
                      className="text-titos-gold text-sm font-bold hover:text-titos-gold-light transition-colors"
                    >
                      View Bracket →
                    </Link>
                    <button onClick={() => handleDelete(t)}
                      className="p-2 rounded-lg text-status-live/60 hover:text-status-live hover:bg-status-live/10 transition-colors" title="Delete tournament">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {tournaments.length === 0 && (
              <div className="card rounded-xl p-8 text-center">
                <Trophy className="w-10 h-10 text-titos-gray-600 mx-auto mb-3" />
                <p className="text-titos-gray-400 mb-4">No tournaments yet.</p>
                <button onClick={() => setShowForm(true)} className="btn-primary text-sm mx-auto">
                  <Plus className="w-4 h-4" /> Create Your First Tournament
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
