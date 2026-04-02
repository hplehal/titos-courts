'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Check, Clock, Loader2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/admin/registrations').then(r => r.json()).then(data => {
      setRegistrations(data.registrations || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    await fetch('/api/admin/registrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, paymentStatus: status }),
    })
    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, paymentStatus: status } : r))
  }

  const filtered = filter === 'all' ? registrations : registrations.filter(r => r.type === filter)

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-2xl font-black text-titos-white">Registrations</h1>
          <span className="text-titos-gray-400 text-sm ml-2">({registrations.length} total)</span>
        </div>

        <div className="flex gap-2 mb-6">
          {['all', 'league', 'tournament', 'free_agent'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors',
                filter === f ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30' : 'bg-titos-card text-titos-gray-400 border border-titos-border hover:text-titos-white'
              )}>
              {f === 'all' ? 'All' : f === 'free_agent' ? 'Free Agents' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="card rounded-xl p-8 text-center"><p className="text-titos-gray-400">No registrations found.</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(reg => (
              <div key={reg.id} className="card-flat rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      reg.type === 'league' ? 'bg-titos-gold/15 text-titos-gold' :
                      reg.type === 'tournament' ? 'bg-status-info/15 text-status-info' :
                      'bg-status-success/15 text-status-success'
                    )}>
                      {reg.type === 'free_agent' ? 'Free Agent' : reg.type}
                    </span>
                    {reg.teamName && <h3 className="font-bold text-titos-white">{reg.teamName}</h3>}
                    {!reg.teamName && <h3 className="font-bold text-titos-white">{reg.captainName}</h3>}
                  </div>
                  <div className="flex items-center gap-2">
                    {reg.paymentStatus === 'paid' ? (
                      <span className="text-status-success text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Paid</span>
                    ) : reg.paymentStatus === 'confirmed' ? (
                      <span className="text-titos-gold text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Confirmed</span>
                    ) : (
                      <span className="text-titos-gray-400 text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                    )}
                    <select
                      value={reg.paymentStatus}
                      onChange={(e) => updateStatus(reg.id, e.target.value)}
                      className="px-2 py-1 bg-titos-elevated border border-titos-border rounded text-xs text-titos-gray-300 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-2 text-sm text-titos-gray-300">
                  <div><span className="text-titos-gray-500 text-xs">Captain:</span> {reg.captainName}</div>
                  <div><span className="text-titos-gray-500 text-xs">Email:</span> {reg.captainEmail}</div>
                  {reg.captainPhone && <div><span className="text-titos-gray-500 text-xs">Phone:</span> {reg.captainPhone}</div>}
                  {reg.leagueSlug && <div><span className="text-titos-gray-500 text-xs">League:</span> {reg.leagueSlug}</div>}
                  {reg.skillLevel && <div><span className="text-titos-gray-500 text-xs">Level:</span> {reg.skillLevel}</div>}
                  <div><span className="text-titos-gray-500 text-xs">Date:</span> {formatDate(reg.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
