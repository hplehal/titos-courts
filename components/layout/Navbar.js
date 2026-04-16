'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  { href: '/results', label: 'Results' },
  { href: '/rules', label: 'Rules & Info' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(null) // tracks which mobile submenu is open by label
  const [dropdownOpen, setDropdownOpen] = useState(null) // tracks which dropdown label is open
  const dropdownTimeout = useRef(null)
  const pathname = usePathname()

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close everything on route change
  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(null)
    setMobileSubmenuOpen(null)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = useCallback((href) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }, [pathname])

  // Dropdown hover handlers — track by label so multiple dropdowns work independently
  const openDropdown = (label) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current)
    setDropdownOpen(label)
  }

  const closeDropdown = () => {
    dropdownTimeout.current = setTimeout(() => setDropdownOpen(null), 150)
  }

  return (
    <>
      {/* Navbar */}
      <nav
        className={cn(
          'fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          scrolled
            ? 'top-3 left-4 right-4 bg-titos-surface/80 backdrop-blur-xl border border-white/[0.06] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'top-0 left-0 right-0 bg-transparent'
        )}
      >
        <div className={cn(
          'mx-auto transition-all duration-500',
          scrolled ? 'max-w-[calc(100%-0px)] px-5' : 'max-w-7xl px-4 sm:px-6 lg:px-8'
        )}>
          <div className="flex items-center justify-between h-16 lg:h-[72px]">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group flex-shrink-0"
            >
              <Image
                src="/images/titosvl.png"
                alt="Tito's Courts"
                width={240}
                height={127}
                quality={95}
                sizes="240px"
                className="h-11 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const hasChildren = !!link.children
                const active = isActive(link.href)

                return (
                  <div
                    key={link.href + link.label}
                    className="relative"
                    onMouseEnter={hasChildren ? () => openDropdown(link.label) : undefined}
                    onMouseLeave={hasChildren ? closeDropdown : undefined}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'relative flex items-center gap-1 px-3.5 py-2 rounded-lg text-[13px] font-semibold tracking-wide uppercase transition-all duration-200',
                        active
                          ? 'text-titos-gold'
                          : 'text-titos-gray-300 hover:text-titos-white hover:bg-white/[0.04]'
                      )}
                    >
                      <span className="relative z-10">{link.label}</span>
                      {hasChildren && (
                        <ChevronDown
                          className={cn(
                            'w-3 h-3 transition-transform duration-300',
                            dropdownOpen === link.label ? 'rotate-180' : ''
                          )}
                        />
                      )}
                      {/* Active indicator line */}
                      {active && (
                        <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-titos-gold rounded-full" />
                      )}
                    </Link>

                    {/* League Dropdown */}
                    {hasChildren && (
                      <div
                        className={cn(
                          'absolute top-full left-1/2 -translate-x-1/2 pt-3 w-56 transition-all duration-300',
                          dropdownOpen === link.label
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 -translate-y-2 pointer-events-none'
                        )}
                      >
                        <div className="bg-titos-elevated/90 backdrop-blur-2xl border border-white/[0.07] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
                          {/* Subtle gold accent line at top */}
                          <div className="h-[1px] bg-gradient-to-r from-transparent via-titos-gold/30 to-transparent" />
                          <div className="py-1.5">
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  'flex items-center gap-3 mx-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                  isActive(child.href)
                                    ? 'text-titos-gold bg-titos-gold/[0.08]'
                                    : 'text-titos-gray-200 hover:text-titos-white hover:bg-white/[0.05]'
                                )}
                              >
                                {/* Small dot indicator */}
                                <span className={cn(
                                  'w-1 h-1 rounded-full flex-shrink-0 transition-colors duration-200',
                                  isActive(child.href) ? 'bg-titos-gold' : 'bg-titos-gray-500'
                                )} />
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Register CTA */}
              <Link
                href="/register"
                className="btn-primary btn-sm ml-4"
                style={{ padding: '8px 20px', fontSize: '0.7rem', borderRadius: '10px' }}
              >
                <span>Register</span>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                'lg:hidden relative z-50 p-2 rounded-lg transition-all duration-200',
                mobileOpen
                  ? 'text-titos-white'
                  : 'text-titos-gray-200 hover:text-titos-white hover:bg-white/[0.05]'
              )}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <div className="relative w-6 h-6">
                <Menu
                  className={cn(
                    'w-6 h-6 absolute inset-0 transition-all duration-300',
                    mobileOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                  )}
                />
                <X
                  className={cn(
                    'w-6 h-6 absolute inset-0 transition-all duration-300',
                    mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu — Full-Screen Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-titos-surface/95 backdrop-blur-2xl transition-opacity duration-500',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Mobile Menu Content */}
        <div
          className={cn(
            'relative h-full flex flex-col pt-24 pb-8 px-6 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          )}
        >
          {/* Navigation Links */}
          <div className="flex-1 space-y-1">
            {navLinks.map((link, index) => (
              <div
                key={link.href + link.label}
                className={cn(
                  'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  mobileOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                )}
                style={{
                  transitionDelay: mobileOpen ? `${80 + index * 40}ms` : '0ms'
                }}
              >
                {link.children ? (
                  <>
                    <button
                      onClick={() => setMobileSubmenuOpen(mobileSubmenuOpen === link.label ? null : link.label)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-lg font-semibold transition-all duration-200 min-h-[48px]',
                        isActive(link.href)
                          ? 'text-titos-gold bg-titos-gold/[0.06]'
                          : 'text-titos-gray-100 active:bg-white/[0.04]'
                      )}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-titos-gray-400 transition-transform duration-300',
                          mobileSubmenuOpen === link.label ? 'rotate-180' : ''
                        )}
                      />
                    </button>

                    {/* Leagues Sub-menu */}
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]',
                        mobileSubmenuOpen === link.label
                          ? 'max-h-60 opacity-100'
                          : 'max-h-0 opacity-0'
                      )}
                    >
                      <div className="ml-4 pl-4 border-l border-titos-border-light/60 py-2 space-y-0.5">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 min-h-[48px]',
                              isActive(child.href)
                                ? 'text-titos-gold bg-titos-gold/[0.06]'
                                : 'text-titos-gray-300 active:text-titos-white active:bg-white/[0.04]'
                            )}
                          >
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full flex-shrink-0',
                              isActive(child.href) ? 'bg-titos-gold' : 'bg-titos-gray-500'
                            )} />
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
                      'flex items-center px-4 py-3.5 rounded-xl text-lg font-semibold transition-all duration-200 min-h-[48px]',
                      isActive(link.href)
                        ? 'text-titos-gold bg-titos-gold/[0.06]'
                        : 'text-titos-gray-100 active:bg-white/[0.04]'
                    )}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Register CTA — pinned to bottom area */}
          <div
            className={cn(
              'pt-6 mt-4 border-t border-titos-border/50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
              mobileOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0'
            )}
            style={{
              transitionDelay: mobileOpen ? `${80 + navLinks.length * 40 + 60}ms` : '0ms'
            }}
          >
            <Link
              href="/register"
              className="btn-primary w-full text-center"
              style={{ padding: '16px 36px' }}
              onClick={() => setMobileOpen(false)}
            >
              <span>Register Now</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
