'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, ClipboardList, ArrowUpDown, Trophy, Users, ChevronRight, Calendar, BarChart3 } from 'lucide-react'

const ADMIN_PASSWORD = 'titos2026'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') {
      setAuthed(true)
    }
  }, [])

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
            <p className="text-titos-gray-400 text-sm mt-1">Enter the admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50"
              autoFocus
            />
            {error && <p className="text-status-live text-sm text-center">{error}</p>}
            <button type="submit" className="w-full btn-primary justify-center">
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  const adminSections = [
    {
      title: 'Score Entry',
      desc: 'Enter match scores for league games. Select a league, week, and tier to input set scores.',
      href: '/admin/scores',
      icon: ClipboardList,
    },
    {
      title: 'Tier Movement',
      desc: 'Calculate and apply tier movements after scores are entered for a week.',
      href: '/admin/tiers',
      icon: ArrowUpDown,
    },
    {
      title: 'Tournament Management',
      desc: 'Create tournaments, manage pools, enter bracket scores, and advance teams.',
      href: '/admin/tournaments',
      icon: Trophy,
    },
    {
      title: 'Registrations',
      desc: 'View league, tournament, and free agent registration submissions.',
      href: '/admin/registrations',
      icon: Users,
    },
    {
      title: 'Season Management',
      desc: 'Create new seasons, archive completed ones, manage teams and weeks.',
      href: '/admin/seasons',
      icon: Calendar,
    },
    {
      title: 'Player Stats',
      desc: 'Coming Soon — Track individual player stats including kills, assists, digs, blocks, and aces.',
      href: '/admin/stats',
      icon: BarChart3,
      comingSoon: true,
    },
  ]

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-titos-gold" />
          <h1 className="font-display text-3xl font-black text-titos-white">Admin Dashboard</h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {adminSections.map((section) => {
            if (section.comingSoon) {
              return (
                <div key={section.href} className="card rounded-xl p-6 opacity-60">
                  <section.icon className="w-8 h-8 text-titos-gray-400 mb-4" />
                  <h3 className="font-display text-lg font-bold text-titos-gray-300 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-titos-gray-400 text-sm mb-4">{section.desc}</p>
                  <span className="text-titos-gray-500 text-sm font-bold flex items-center gap-1">
                    Coming Soon
                  </span>
                </div>
              )
            }
            return (
              <Link key={section.href} href={section.href} className="card rounded-xl p-6 group block">
                <section.icon className="w-8 h-8 text-titos-gold mb-4" />
                <h3 className="font-display text-lg font-bold text-titos-white mb-2 group-hover:text-titos-gold transition-colors">
                  {section.title}
                </h3>
                <p className="text-titos-gray-400 text-sm mb-4">{section.desc}</p>
                <span className="text-titos-gold text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
