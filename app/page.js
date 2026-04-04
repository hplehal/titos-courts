'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Users,
  Trophy,
  ChevronRight,
  ArrowUpDown,
  MapPin,
  Clock,
} from 'lucide-react'
import LatestResults from '@/components/home/LatestResults'

const coedChampions = [
  { season: 1, team: 'Safe Sets', image: null },
  { season: 2, team: 'Tip Pics', image: '/images/tipPics.jpg' },
  { season: 3, team: 'Despicable Pookies', image: null },
  { season: 4, team: 'Setsy & We Know It', image: null },
  { season: 5, team: 'Sauce Walkas', image: null },
  { season: 6, team: 'BounceTown', image: null },
  { season: 7, team: 'Net Losses', image: null },
  { season: 8, team: 'Net Losses', image: null },
]

const mensChampions = [
  { season: 1, team: 'Sets With Jerhomies', image: null },
  { season: 2, team: 'High & Holy', image: null },
  { season: 3, team: 'Sari Sari Squad', image: null },
  { season: 4, team: "David's Dictatorship", image: null },
  { season: 5, team: "Brandy's Angels", image: null },
  { season: 6, team: 'Spartans', image: null },
]

const leagues = [
  {
    name: 'Tuesday COED',
    slug: 'tuesday-coed',
    day: 'TUE',
    badge: 'FLAGSHIP',
    teams: 24,
    tiers: 8,
    tagline: 'The original. The biggest. 24 teams across 8 tiers.',
    status: 'SEASON 9 ACTIVE',
    statusColor: 'text-status-success',
  },
  {
    name: 'Sunday MENS',
    slug: 'sunday-mens',
    day: 'SUN',
    badge: 'COMPETITIVE',
    teams: 15,
    tiers: 5,
    tagline: 'High-level men\'s volleyball. 15 teams, 5 tiers.',
    status: 'SEASON 7 ACTIVE',
    statusColor: 'text-status-success',
  },
  {
    name: 'Thursday REC COED',
    slug: 'thursday-rec-coed',
    day: 'THU',
    badge: 'NEW',
    teams: 12,
    tiers: 4,
    tagline: 'Beginner-friendly. The perfect entry point.',
    status: 'REGISTRATION OPEN',
    statusColor: 'text-status-info',
  },
]


export default function HomePage() {
  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[100vh] flex items-end pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background layers */}
        <div className="absolute inset-0 bg-titos-surface" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-titos-surface/90" />
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-titos-gold/[0.04] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-titos-surface to-transparent z-[1]" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl">
            <div>
              <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-titos-gold/10 border border-titos-gold/20 rounded-full text-titos-gold text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-titos-gold rounded-full" />
                  COED Season 9 Now Playing
                </span>
                <span className="ml-3 inline-flex items-center gap-2 px-3 py-1.5 bg-titos-gold/10 border border-titos-gold/20 rounded-full text-titos-gold text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-titos-gold rounded-full" />
                  Mens Season 7 Now Playing
                </span>
              </div>

              <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-display font-black leading-[0.9] tracking-tight mb-6 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                <span className="text-titos-white block">FIND YOUR</span>
                <span className="gradient-text block">TIER.</span>
              </h1>

              <p className="text-titos-gray-300 text-base sm:text-lg max-w-lg mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                Mississauga&apos;s premier recreational volleyball leagues. Three nights a week.
                Tier-based competition where every match matters.
              </p>

              <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                <Link href="/register" className="btn-primary">
                  Join a League <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/standings" className="btn-ghost">
                  View Standings
                </Link>
              </div>

              {/* Venue tag */}
              <div className="mt-10 flex items-center gap-3 text-titos-gray-400 text-xs uppercase tracking-wider animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                <MapPin className="w-3.5 h-3.5" />
                Pakmen Courts, Mississauga
                <span className="text-titos-border">|</span>
                <Clock className="w-3.5 h-3.5" />
                Tue 8PM–12AM · Sun 9PM–12AM
              </div>
              <div className="mt-3 flex items-center gap-3 text-titos-gray-400 text-xs uppercase tracking-wider animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                <MapPin className="w-3.5 h-3.5" />
                Michael Power - St. Joseph High School, Etobicoke
                <span className="text-titos-border">|</span>
                <Clock className="w-3.5 h-3.5" />
                Thu 8PM–12AM
              </div>
            </div>

            {/* Social links */}
            <div className="mt-8 flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.55s', animationFillMode: 'both' }}>
              <a href="https://www.instagram.com/titoscourts" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-titos-white/5 text-titos-gray-400 hover:text-titos-gold hover:bg-titos-white/10 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              <a href="https://www.youtube.com/@titoscourts" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-titos-white/5 text-titos-gray-400 hover:text-titos-gold hover:bg-titos-white/10 transition-colors" aria-label="YouTube">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-titos-surface to-transparent" />
      </section>

      {/* ═══ INFO STRIP ═══ */}
      <section className="relative -mt-1 z-10">
        <div className="section-line" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <span className="font-display text-3xl sm:text-4xl font-black text-titos-white">3</span>
              <span className="block text-titos-gray-400 text-[10px] uppercase tracking-wider mt-1">Leagues Per Week</span>
            </div>
            <div className="text-center">
              <span className="font-display text-3xl sm:text-4xl font-black text-titos-white">Tue · Sun · Thu</span>
              <span className="block text-titos-gray-400 text-[10px] uppercase tracking-wider mt-1">Game Nights</span>
            </div>
            <div className="text-center">
              <span className="font-display text-3xl sm:text-4xl font-black text-titos-gold">11</span>
              <span className="block text-titos-gray-400 text-[10px] uppercase tracking-wider mt-1">Weeks Per Season</span>
            </div>
            <div className="text-center">
              <span className="font-display text-3xl sm:text-4xl font-black text-titos-white">Pakmen</span>
              <span className="block text-titos-gray-400 text-[10px] uppercase tracking-wider mt-1">Home Court · Mississauga</span>
            </div>
          </div>
        </div>
        <div className="section-line" />
      </section>

      {/* ═══ LATEST RESULTS ═══ */}
      <LatestResults />

      {/* ═══ LEAGUES ═══ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section header — sport style */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Our Leagues</span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-titos-white leading-none">
                THREE NIGHTS.<br />
                <span className="text-titos-gray-400">EVERY WEEK.</span>
              </h2>
            </div>
            <Link href="/leagues" className="text-titos-gold text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all">
              All Leagues <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* League cards */}
          <div className="grid lg:grid-cols-3 gap-4">
            {leagues.map((league, i) => (
              <Link
                key={league.slug}
                href={`/leagues/${league.slug}`}
                className="group relative card-premium p-6 sm:p-8 block"
              >
                {/* Day badge — big and bold */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <span className="text-[3rem] sm:text-[4rem] font-black text-titos-white/10 leading-none block font-display">
                      {league.day}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-titos-gold/10 border border-titos-gold/25 rounded text-titos-gold text-[10px] font-bold uppercase tracking-wider">
                    {league.badge}
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-black text-titos-white mb-2 group-hover:text-titos-gold transition-colors duration-300">
                  {league.name}
                </h3>
                <p className="text-titos-gray-400 text-sm mb-6 leading-relaxed">
                  {league.tagline}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-titos-gray-400 mb-6">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{league.teams} teams</span>
                  <span className="flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" />{league.tiers} tiers</span>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-titos-border/50">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${league.statusColor}`}>{league.status}</span>
                  <span className="text-titos-gold text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-titos-elevated noise">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">The Format</span>
            <h2 className="text-4xl sm:text-5xl font-black text-titos-white">
              HOW IT WORKS
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'REGISTER', desc: 'Sign up with 6+ players. Pick your league night. Pay via e-transfer.' },
              { num: '02', title: 'GET PLACED', desc: 'Week 1 placement matches seed your team into a tier of 3 based on skill.' },
              { num: '03', title: 'COMPETE', desc: 'Play weekly. Win → move up a tier. Lose → drop down. Every game counts.' },
              { num: '04', title: 'PLAYOFFS', desc: '5 divisions from Diamond to Bronze. Season-end championship brackets.' },
            ].map((step) => (
              <div key={step.num} className="relative">
                <span className="text-[5rem] font-black text-titos-white/[0.04] leading-none block font-display mb-0 select-none">
                  {step.num}
                </span>
                <div className="-mt-8 relative">
                  <div className="w-10 h-0.5 bg-titos-gold mb-4" />
                  <h3 className="font-display text-lg font-black text-titos-white mb-2">{step.title}</h3>
                  <p className="text-titos-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tier system callout */}
          <div className="mt-16 card-flat rounded-2xl p-8 sm:p-10 text-center max-w-3xl mx-auto">
            <h3 className="font-display text-2xl font-black text-titos-white mb-3">THE TIER SYSTEM</h3>
            <p className="text-titos-gray-300 text-sm sm:text-base leading-relaxed">
              Teams are grouped into tiers of 3. Each week, you play round-robin within your tier — 6 games total.
              <strong className="text-titos-gold font-bold"> 1st place moves up. 2nd stays. 3rd drops down.</strong>
              {' '}By season&apos;s end, your cumulative standing determines your playoff division.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ COMMUNITY ═══ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Community</span>
              <h2 className="text-4xl sm:text-5xl font-black text-titos-white leading-none">
                MORE THAN<br />
                <span className="text-titos-gray-400">A LEAGUE.</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/titoscourts" target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                @titoscourts
              </a>
            </div>
          </div>

          {/* Photo grid — placeholder images, replace with real photos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden aspect-[4/3]">
              <Image src="/images/titosHero.jpg" alt="Game night at Pakmen Courts" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-titos-white font-display text-lg font-black">Game Night</span>
                <span className="block text-titos-gray-200 text-xs">Pakmen Courts, Mississauga</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square">
              <Image src="/images/IMG_20231005_001649_419.jpg" alt="Tito's Courts players" fill className="object-cover" />
            </div>
            {/* Placeholder cards — replace these with real photos */}
            <div className="relative rounded-xl overflow-hidden aspect-square bg-titos-card flex items-center justify-center border border-titos-border/30">
              <div className="text-center p-4">
                <span className="text-titos-gold text-4xl font-black font-display block">🏐</span>
                <span className="text-titos-gray-400 text-[9px] uppercase tracking-wider mt-2 block">Add Photo</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-titos-card flex items-center justify-center border border-titos-border/30">
              <div className="text-center p-4">
                <span className="text-titos-gold text-4xl font-black font-display block">🏐</span>
                <span className="text-titos-gray-400 text-[9px] uppercase tracking-wider mt-2 block">Add Photo</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-titos-card flex items-center justify-center border border-titos-border/30">
              <div className="text-center p-4">
                <span className="text-titos-gold text-4xl font-black font-display block">🏐</span>
                <span className="text-titos-gray-400 text-[9px] uppercase tracking-wider mt-2 block">Add Photo</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-titos-card flex items-center justify-center border border-titos-border/30">
              <div className="text-center p-4">
                <span className="text-titos-gold text-4xl font-black font-display block">🏐</span>
                <span className="text-titos-gray-400 text-[9px] uppercase tracking-wider mt-2 block">Add Photo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HIGHLIGHTS / MEDIA ═══ */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-titos-elevated/50 noise">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Follow Us</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none">
                CATCH THE<br />
                <span className="text-titos-gray-400">ACTION.</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/titoscourts" target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                @titoscourts
              </a>
              <a href="https://www.youtube.com/@titoscourts" target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                YouTube
              </a>
            </div>
          </div>

          {/* Photo grid — using available images + placeholders for more */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden aspect-[4/3]">
              <Image src="/images/titosHero.jpg" alt="Tito's Courts game night" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-titos-white text-sm font-bold">Game Night at Pakmen</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square">
              <Image src="/images/IMG_20231005_001649_419.jpg" alt="Tito's Courts team" fill className="object-cover" />
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-titos-card flex items-center justify-center">
              <div className="text-center p-4">
                <svg className="w-8 h-8 text-titos-gold mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                <a href="https://www.instagram.com/titoscourts" target="_blank" rel="noopener noreferrer" className="text-titos-gold text-xs font-bold uppercase tracking-wider hover:text-titos-gold-light">
                  Follow on IG
                </a>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-titos-card flex items-center justify-center">
              <div className="text-center p-4">
                <svg className="w-8 h-8 text-titos-gold mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                <a href="https://www.youtube.com/@titoscourts" target="_blank" rel="noopener noreferrer" className="text-titos-gold text-xs font-bold uppercase tracking-wider hover:text-titos-gold-light">
                  Watch on YT
                </a>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-gradient-to-br from-titos-gold/10 to-titos-surface flex items-center justify-center border border-titos-border/30">
              <div className="text-center">
                <span className="text-titos-gold text-3xl font-black font-display block">150+</span>
                <span className="text-titos-gray-400 text-xs uppercase tracking-wider">Players</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HALL OF CHAMPIONS TEASER ═══ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Hall of Champions</span>
              <h2 className="text-4xl sm:text-5xl font-black text-titos-white leading-none">
                DIAMOND<br />
                <span className="text-titos-gray-400">DIVISION WINNERS.</span>
              </h2>
            </div>
            <Link href="/champions" className="text-titos-gold text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all">
              View All Champions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Latest champions teaser */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* COED defending */}
            <Link href="/champions" className="group card-flat rounded-2xl overflow-hidden">
              <div className="p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-titos-gold/20 to-titos-card flex items-center justify-center flex-shrink-0 border border-titos-gold/30">
                  <Trophy className="w-7 h-7 text-titos-gold" />
                </div>
                <div>
                  <span className="text-titos-gray-400 text-[9px] font-bold uppercase tracking-wider block">COED · Defending Champion</span>
                  <h3 className="font-display text-xl font-black text-titos-white group-hover:text-titos-gold transition-colors">{coedChampions[0].team}</h3>
                  <span className="text-titos-gray-500 text-xs">Season {coedChampions[0].season} · Back-to-back 🏆🏆</span>
                </div>
              </div>
            </Link>

            {/* MENS defending */}
            <Link href="/champions" className="group card-flat rounded-2xl overflow-hidden">
              <div className="p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-titos-gold/20 to-titos-card flex items-center justify-center flex-shrink-0 border border-titos-gold/30">
                  <Trophy className="w-7 h-7 text-titos-gold" />
                </div>
                <div>
                  <span className="text-titos-gray-400 text-[9px] font-bold uppercase tracking-wider block">MENS · Defending Champion</span>
                  <h3 className="font-display text-xl font-black text-titos-white group-hover:text-titos-gold transition-colors">{mensChampions[0].team}</h3>
                  <span className="text-titos-gray-500 text-xs">Season {mensChampions[0].season}</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 noise">
        <div className="absolute inset-0 bg-gradient-to-br from-titos-gold/[0.06] to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-titos-white mb-6 leading-none">
            READY TO<br />
            <span className="gradient-text">HIT THE COURT?</span>
          </h2>
          <p className="text-titos-gray-300 text-lg mb-10 max-w-xl mx-auto">
            Whether you&apos;re chasing a championship or just learning the game, there&apos;s a place for you at Tito&apos;s Courts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary">
              Register Your Team <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="btn-ghost">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
