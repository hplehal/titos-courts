import Link from 'next/link'
import Image from 'next/image'
import { Mail, MapPin } from 'lucide-react'

const quickNav = [
  { href: '/leagues', label: 'Leagues' },
  { href: '/standings', label: 'Standings' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/champions', label: 'Champions' },
]

const infoLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/rules', label: 'Rules & Info' },
  { href: '/register', label: 'Register' },
  { href: '/waiver', label: 'Player Waiver' },
  { href: '/contact', label: 'Contact' },
]

const socialLinks = [
  {
    href: 'https://www.instagram.com/titoscourts',
    label: 'Instagram',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    href: 'https://www.youtube.com/@titoscourts',
    label: 'YouTube',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    href: 'mailto:info@titoscourts.com',
    label: 'Email',
    icon: <Mail className="w-5 h-5" />,
  },
]

export default function Footer() {
  return (
    <footer className="relative bg-titos-surface overflow-hidden">
      {/* Gold gradient line at top */}
      <div className="section-line-gold" />

      {/* Subtle gold ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-[0.04]"
        style={{
          background:
            'radial-gradient(ellipse at center, #F2A527 0%, transparent 70%)',
        }}
      />

      {/* Main footer content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand — spans 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <Image
                src="/images/titos.png"
                alt="Tito's Courts"
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            <p className="text-titos-gray-300 font-body text-sm leading-relaxed max-w-sm">
              Mississauga&apos;s premier recreational volleyball leagues.
              Bringing the community together through friendly competition,
              fitness, and fun.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('mailto') ? undefined : '_blank'}
                  rel={
                    social.href.startsWith('mailto')
                      ? undefined
                      : 'noopener noreferrer'
                  }
                  className="group flex items-center justify-center w-10 h-10 rounded-xl bg-titos-card border border-titos-border/50 text-titos-gray-400 transition-all duration-200 hover:text-titos-gold hover:border-titos-gold/30 hover:bg-titos-gold/[0.06]"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Nav */}
          <div>
            <h3 className="font-display font-bold text-titos-white text-xs uppercase tracking-widest mb-5">
              Quick Nav
            </h3>
            <ul className="space-y-3">
              {quickNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-titos-gray-400 hover:text-titos-gold font-body text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-display font-bold text-titos-white text-xs uppercase tracking-widest mb-5">
              Info
            </h3>
            <ul className="space-y-3">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-titos-gray-400 hover:text-titos-gold font-body text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-titos-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            {/* Venues and email */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-6 gap-y-2.5">
              <div className="flex items-center gap-2 text-titos-gray-400 text-xs">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-titos-gray-400" />
                <span>Pakmen Courts, 1775 Sismet Rd, Mississauga</span>
              </div>
              <div className="flex items-center gap-2 text-titos-gray-400 text-xs">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-titos-gray-400" />
                <span>Michael Power &mdash; St. Joseph HS, Etobicoke</span>
              </div>
              <div className="flex items-center gap-2 text-titos-gray-400 text-xs">
                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-titos-gray-400" />
                <a
                  href="mailto:info@titoscourts.com"
                  className="hover:text-titos-gold transition-colors duration-200"
                >
                  info@titoscourts.com
                </a>
              </div>
            </div>

            {/* Copyright */}
            <p className="text-titos-gray-500 text-xs whitespace-nowrap">

              &copy; 2026 Tito&apos;s Courts. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
