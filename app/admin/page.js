'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, ClipboardList, ArrowUpDown, Trophy, Users, ChevronRight, Calendar, BarChart3, Check, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

const ADMIN_PASSWORD = 'titos2026'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') {
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    loadDashboard()
  }, [authed])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [seasonsRes, leaguesRes] = await Promise.all([
        fetch('/api/admin/seasons').then(r => r.json()),
        fetch('/api/leagues').then(r => r.json()),
      ])

      // For each active league, find the latest season and its weeks
      const leagueData = []
      for (const league of (leaguesRes || [])) {
        const season = (seasonsRes.seasons || [])
          .filter(s => s.league?.slug === league.slug)
          .sort((a, b) => b.seasonNumber - a.seasonNumber)[0]

        if (!season) continue

        // Fetch weeks for this season
        const weeksRes = await fetch(`/api/admin/weeks?seasonId=${season.id}`).then(r => r.json())
        const weeks = weeksRes.weeks || []

        const activeWeek = weeks.find(w => w.status === 'active')
        const lastCompleted = [...weeks].reverse().find(w => w.status === 'completed')
        const nextUpcoming = weeks.find(w => w.status === 'upcoming')
        const completedCount = weeks.filter(w => w.status === 'completed').length

        // Determine current step in the weekly cycle
        let step = 'idle'
        let stepLabel = ''
        let stepAction = null

        if (activeWeek && (activeWeek._count?.matches || 0) > 0) {
          // Active week with matches — need to enter scores
          step = 'enter-scores'
          stepLabel = `Week ${activeWeek.weekNumber} is active — enter scores`
          stepAction = { href: '/admin/scores', label: 'Enter Scores' }
        } else if (lastCompleted && !lastCompleted.tierPlacements?.some(p => p.movement)) {
          // Last completed week hasn't had tier movements calculated
          // Check if all matches have scores
          const needsMovement = (lastCompleted._count?.matches || 0) > 0
          if (needsMovement) {
            step = 'calc-tiers'
            stepLabel = `Week ${lastCompleted.weekNumber} complete — calculate tier movements`
            stepAction = { href: '/admin/tiers', label: 'Calculate Tiers' }
          }
        } else if (nextUpcoming && (nextUpcoming._count?.tierPlacements || 0) === 0 && nextUpcoming.weekNumber <= 2) {
          step = 'setup-tiers'
          stepLabel = `Week ${nextUpcoming.weekNumber} needs tier setup`
          stepAction = { href: '/admin/seasons', label: 'Setup Tiers' }
        } else if (nextUpcoming && (nextUpcoming._count?.matches || 0) === 0 && (nextUpcoming._count?.tierPlacements || 0) > 0) {
          step = 'gen-matches'
          stepLabel = `Week ${nextUpcoming.weekNumber} needs matches generated`
          stepAction = { href: '/admin/seasons', label: 'Generate Matches' }
        } else if (!nextUpcoming && completedCount < 11) {
          step = 'add-week'
          stepLabel = 'Add next week'
          stepAction = { href: '/admin/seasons', label: 'Season Management' }
        } else {
          step = 'idle'
          stepLabel = 'All caught up'
        }

        leagueData.push({
          league,
          season,
          weeks,
          activeWeek,
          lastCompleted,
          nextUpcoming,
          completedCount,
          step,
          stepLabel,
          stepAction,
        })
      }

      setLeagues(leagueData)
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
    setLoading(false)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      sessionStorage.setItem('admin_auth', 'true')
      setError('')
    } else {
      setError('Invalid password')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <Shield className="w-10 h-10 text-titos-gold mx-auto mb-3" />
            <h1 className="font-display text-2xl font-black text-titos-white">Admin Access</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
              className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" autoFocus />
            {error && <p className="text-status-live text-sm text-center">{error}</p>}
            <button type="submit" className="w-full btn-primary justify-center">Sign In</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-titos-gold" />
            <h1 className="font-display text-2xl font-black text-titos-white">Dashboard</h1>
          </div>
          <button onClick={loadDashboard} className="text-titos-gray-400 hover:text-titos-white text-sm transition-colors">Refresh</button>
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {/* ─── WEEKLY CYCLE STATUS PER LEAGUE ─── */}
            {leagues.map(({ league, season, weeks, activeWeek, lastCompleted, nextUpcoming, completedCount, step, stepLabel, stepAction }) => (
              <div key={league.slug} className="card-flat rounded-2xl overflow-hidden">
                {/* League header */}
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-titos-border/30">
                  <div>
                    <h2 className="font-display text-lg font-black text-titos-white">{league.name}</h2>
                    <span className="text-titos-gray-400 text-xs">{season.name} &middot; {completedCount}/{season.totalWeeks || 11} weeks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      season.status === 'active' ? 'bg-status-success/15 text-status-success' :
                      season.status === 'registration' ? 'bg-status-info/15 text-status-info' :
                      'bg-titos-gray-500/15 text-titos-gray-400'
                    )}>{season.status}</span>
                  </div>
                </div>

                {/* Next action — the key part */}
                <div className={cn('px-5 py-4',
                  step === 'enter-scores' ? 'bg-titos-gold/[0.04]' :
                  step === 'calc-tiers' ? 'bg-status-info/[0.03]' :
                  step === 'idle' ? 'bg-status-success/[0.02]' : ''
                )}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {step === 'idle' ? (
                        <div className="w-8 h-8 rounded-full bg-status-success/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-status-success" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-titos-gold/15 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-titos-gold" />
                        </div>
                      )}
                      <div>
                        <span className="text-titos-white text-sm font-bold block">{stepLabel}</span>
                        <span className="text-titos-gray-500 text-xs">
                          {step === 'enter-scores' && `${activeWeek?._count?.matches || 0} matches to score`}
                          {step === 'calc-tiers' && 'All scores entered — ready to calculate'}
                          {step === 'gen-matches' && 'Tier placements set — generate the schedule'}
                          {step === 'setup-tiers' && 'Manual tier assignment needed'}
                          {step === 'add-week' && `${completedCount} weeks completed`}
                          {step === 'idle' && 'Nothing to do right now'}
                        </span>
                      </div>
                    </div>
                    {stepAction && (
                      <Link href={stepAction.href}
                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-titos-gold/15 text-titos-gold border border-titos-gold/30 hover:bg-titos-gold/25 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                        {stepAction.label} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Week progress bar */}
                <div className="px-5 py-3 border-t border-titos-border/20">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: season.totalWeeks || 11 }).map((_, i) => {
                      const weekNum = i + 1
                      const week = weeks.find(w => w.weekNumber === weekNum)
                      const status = week?.status || 'future'
                      return (
                        <div key={i} className={cn(
                          'h-2 flex-1 rounded-full transition-colors',
                          status === 'completed' ? 'bg-status-success' :
                          status === 'active' ? 'bg-titos-gold' :
                          status === 'upcoming' ? 'bg-titos-charcoal' :
                          'bg-titos-border/30'
                        )} title={`Week ${weekNum}: ${status}`} />
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-1.5 text-[9px] text-titos-gray-500 uppercase">
                    <span>Wk 1</span>
                    <span>Playoffs</span>
                  </div>
                </div>
              </div>
            ))}

            {leagues.length === 0 && (
              <div className="card rounded-xl p-8 text-center">
                <p className="text-titos-gray-400">No active leagues found. Create a season in Season Management.</p>
              </div>
            )}

            {/* ─── QUICK LINKS ─── */}
            <div className="section-line my-8" />
            <h3 className="text-titos-gray-400 text-xs font-bold uppercase tracking-[0.15em] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { title: 'Score Entry', desc: 'Enter match scores', href: '/admin/scores', icon: ClipboardList },
                { title: 'Tier Movement', desc: 'Calculate movements', href: '/admin/tiers', icon: ArrowUpDown },
                { title: 'Seasons', desc: 'Manage seasons & teams', href: '/admin/seasons', icon: Calendar },
                { title: 'Tournaments', desc: 'Manage tournaments', href: '/admin/tournaments', icon: Trophy },
                { title: 'Registrations', desc: 'View signups', href: '/admin/registrations', icon: Users },
                { title: 'Player Stats', desc: 'Coming soon', href: '#', icon: BarChart3, disabled: true },
              ].map(item => (
                <Link key={item.title} href={item.href}
                  className={cn('card-flat rounded-xl p-4 group block transition-colors',
                    item.disabled ? 'opacity-40 pointer-events-none' : 'hover:border-titos-gold/30'
                  )}>
                  <item.icon className="w-5 h-5 text-titos-gold mb-2" />
                  <h4 className="font-display text-sm font-bold text-titos-white group-hover:text-titos-gold transition-colors">{item.title}</h4>
                  <p className="text-titos-gray-500 text-[10px] mt-0.5">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
