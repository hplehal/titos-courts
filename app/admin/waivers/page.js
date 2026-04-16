'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Loader2, Search, Check, X } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

export default function WaiversPage() {
  const [waivers, setWaivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/waiver').then(r => r.json()).then(data => {
      setWaivers(data.waivers || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = search
    ? waivers.filter(w =>
        w.fullName.toLowerCase().includes(search.toLowerCase()) ||
        w.email.toLowerCase().includes(search.toLowerCase()) ||
        w.teamName?.toLowerCase().includes(search.toLowerCase())
      )
    : waivers

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display text-2xl font-black text-titos-white">Signed Waivers</h1>
            <span className="text-titos-gray-500 text-sm">({waivers.length})</span>
          </div>
          <a href="/waiver" target="_blank" className="text-titos-gold text-xs font-bold uppercase tracking-wider hover:text-titos-gold-light transition-colors">
            Waiver Form →
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-titos-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or team..."
            className="w-full pl-10 pr-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50"
          />
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="card rounded-xl p-8 text-center">
            <Shield className="w-10 h-10 text-titos-gray-500 mx-auto mb-3" />
            <p className="text-titos-gray-400">{search ? 'No waivers match your search.' : 'No waivers signed yet.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(w => (
              <div key={w.id} className="card-flat rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-titos-white text-sm">{w.fullName}</h3>
                      <span className="text-titos-gray-500 text-xs">{w.email}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-titos-gray-400">
                      {w.leagueDay && <span className="px-2 py-0.5 bg-titos-card rounded border border-titos-border/30">{w.leagueDay}</span>}
                      {w.teamName && <span>{w.teamName}</span>}
                      {w.phone && <span>{w.phone}</span>}
                      <span>{formatDate(w.signedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      {w.agreedToTerms && <span className="w-5 h-5 rounded-full bg-status-success/15 flex items-center justify-center"><Check className="w-3 h-3 text-status-success" /></span>}
                      {w.agreedToLiability && <span className="w-5 h-5 rounded-full bg-status-success/15 flex items-center justify-center"><Check className="w-3 h-3 text-status-success" /></span>}
                      {w.agreedToMedia ? (
                        <span className="w-5 h-5 rounded-full bg-status-success/15 flex items-center justify-center"><Check className="w-3 h-3 text-status-success" /></span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-titos-charcoal flex items-center justify-center"><X className="w-3 h-3 text-titos-gray-500" /></span>
                      )}
                    </div>
                    <span className="text-status-success text-[11px] font-bold uppercase tracking-wider">Signed</span>
                  </div>
                </div>
                {(w.emergencyName || w.emergencyPhone) && (
                  <div className="mt-2 text-titos-gray-500 text-[11px]">
                    Emergency: {w.emergencyName} {w.emergencyPhone ? `· ${w.emergencyPhone}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
