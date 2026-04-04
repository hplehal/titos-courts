'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const leagueDropdown = [
  { href: '/leagues/tuesday-coed', label: 'Tuesday COED' },
  { href: '/leagues/sunday-mens', label: 'Sunday MENS' },
  { href: '/leagues/thursday-rec-coed', label: 'Thursday REC COED' },
]

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/leagues', label: 'Leagues', children: leagueDropdown },
  { href: '/standings', label: 'Standings' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/leagues/tuesday-coed', label: 'Results' },
  { href: '/rules', label: 'Rules & Info' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileLeaguesOpen, setMobileLeaguesOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
    setMobileLeaguesOpen(false)
  }, [pathname])

  const isActive = (href) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-titos-surface/95 backdrop-blur-lg border-b border-titos-border/30 shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <Image
              src="/images/titosvl.png"
              alt="Tito's Courts"
              width={44}
              height={44}
              className="h-11 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => link.children && setDropdownOpen(true)}
                onMouseLeave={() => link.children && setDropdownOpen(false)}
              >
                <Link
                  href={link.href}
                  className={cn(
                    'relative px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1',
                    isActive(link.href)
                      ? 'text-titos-gold'
                      : 'text-titos-gray-200 hover:text-titos-white hover:bg-titos-white/5'
                  )}
                >
                  {link.isLive && <span className="live-dot" />}
                  {link.label}
                  {link.children && (
                    <ChevronDown className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      dropdownOpen ? 'rotate-180' : ''
                    )} />
                  )}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-titos-gold rounded-full" />
                  )}
                </Link>

                {/* Dropdown menu */}
                {link.children && (
                  <div
                    className={cn(
                      'absolute top-full left-0 mt-1 w-52 py-2 bg-titos-elevated border border-titos-border rounded-xl shadow-xl shadow-black/30 transition-all duration-200',
                      dropdownOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                    )}
                  >
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-4 py-2.5 text-sm transition-colors',
                          isActive(child.href)
                            ? 'text-titos-gold bg-titos-gold/10'
                            : 'text-titos-gray-200 hover:text-titos-white hover:bg-titos-white/5'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link
              href="/register"
              className="ml-3 px-5 py-2.5 bg-titos-gold hover:bg-titos-gold-light text-black font-bold text-sm rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-titos-gold/25"
            >
              Register
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-titos-gray-200 hover:text-titos-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileOpen
            ? 'max-h-[600px] opacity-100 bg-titos-surface/98 backdrop-blur-xl border-b border-titos-border/30'
            : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <div key={link.href}>
              {link.children ? (
                <>
                  <button
                    onClick={() => setMobileLeaguesOpen(!mobileLeaguesOpen)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-titos-gold/10 text-titos-gold'
                        : 'text-titos-gray-200 hover:bg-titos-white/5 hover:text-titos-white'
                    )}
                  >
                    <span>{link.label}</span>
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      mobileLeaguesOpen ? 'rotate-180' : ''
                    )} />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300',
                      mobileLeaguesOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="pl-6 py-1 space-y-1">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block px-4 py-2.5 rounded-lg text-sm transition-colors',
                            isActive(child.href)
                              ? 'text-titos-gold bg-titos-gold/10'
                              : 'text-titos-gray-300 hover:text-titos-white'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-titos-gold/10 text-titos-gold'
                      : 'text-titos-gray-200 hover:bg-titos-white/5 hover:text-titos-white'
                  )}
                >
                  {link.isLive && <span className="live-dot" />}
                  {link.label}
                </Link>
              )}
            </div>
          ))}
          <Link
            href="/register"
            className="block mt-3 px-4 py-3 bg-titos-gold hover:bg-titos-gold-light text-black font-bold text-center rounded-lg transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  )
}
