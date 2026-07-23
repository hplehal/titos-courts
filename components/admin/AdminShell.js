'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield, LayoutDashboard, Calendar, Users, FileText, Trophy,
  ExternalLink, LogOut, Menu, X, MapPin, BarChart3, Medal,
} from 'lucide-react'
import AuthGate, { ADMIN_AUTH_KEY, ADMIN_PW_KEY } from '@/components/admin/AuthGate'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/seasons', label: 'Seasons & Teams', icon: Calendar },
  { href: '/admin/courts', label: 'Courts', icon: MapPin },
  { href: '/admin/playoffs', label: 'Playoffs', icon: Medal },
  { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/admin/stats', label: 'Player Stats', icon: BarChart3 },
  { href: '/admin/registrations', label: 'Registrations', icon: Users },
  { href: '/admin/waivers', label: 'Waivers', icon: FileText },
]

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV_ITEMS.map(item => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href} href={item.href} onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
              active
                ? 'bg-titos-gold/10 text-titos-gold'
                : 'text-titos-gray-400 hover:text-titos-white hover:bg-titos-white/[0.04]'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
            {active && <span className="ml-auto w-1 h-4 rounded-full bg-titos-gold" />}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarFooter({ onSignOut }) {
  return (
    <div className="px-3 py-4 border-t border-titos-border/40 space-y-1">
      <a
        href="/" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-titos-gray-400 hover:text-titos-white hover:bg-titos-white/[0.04] transition-colors"
      >
        <ExternalLink className="w-4 h-4" /> View Site
      </a>
      <button
        onClick={onSignOut}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-titos-gray-400 hover:text-status-live hover:bg-status-live/[0.06] transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 h-16 border-b border-titos-border/40">
      <div className="w-8 h-8 rounded-lg bg-titos-gold/15 border border-titos-gold/30 flex items-center justify-center flex-shrink-0">
        <Shield className="w-4 h-4 text-titos-gold" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-sm font-black text-titos-white">Tito&apos;s Courts</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-titos-gray-500">Admin Panel</p>
      </div>
    </div>
  )
}

export default function AdminShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const signOut = () => {
    // Clear both the auth flag and the echoed password used by adminFetch
    sessionStorage.removeItem(ADMIN_AUTH_KEY)
    sessionStorage.removeItem(ADMIN_PW_KEY)
    window.location.reload()
  }

  return (
    <AuthGate>
    <div className="min-h-screen bg-titos-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-titos-elevated border-r border-titos-border/40 z-40">
        <Brand />
        <NavLinks pathname={pathname} />
        <SidebarFooter onSignOut={signOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-titos-elevated/95 backdrop-blur border-b border-titos-border/40">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-titos-gold" />
          <span className="font-display text-sm font-black text-titos-white">Admin Panel</span>
        </div>
        <button onClick={() => setMobileOpen(o => !o)} className="p-2 -mr-2 text-titos-gray-300 hover:text-titos-white" aria-label="Toggle menu">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-titos-elevated border-r border-titos-border/40 flex flex-col">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="p-2 text-titos-gray-400 hover:text-titos-white" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter onSignOut={signOut} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="lg:pl-60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </div>
    </div>
    </AuthGate>
  )
}
