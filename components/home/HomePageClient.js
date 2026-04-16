'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Users,
  Trophy,
  ArrowUpDown,
  MapPin,
  Clock,
  Calendar,
  ChevronRight,
  Star,
  Zap,
  Target,
  Award,
} from 'lucide-react'
import LatestResults from '@/components/home/LatestResults'

/* ═══ DATA ═══ */
const coedChampions = [
  { season: 1, team: 'Safe Sets', image: '/images/champions/safeSets.jpg' },
  { season: 2, team: 'Tip Pics', image: '/images/champions/tipPics.jpg' },
  { season: 3, team: 'Despicable Pookies', image: '/images/champions/dPookies.jpg' },
  { season: 4, team: 'Setsy & We Know It', image: '/images/champions/sawki.jpg' },
  { season: 5, team: 'Sauce Walkas', image: '/images/champions/sauceWalkas.jpg' },
  { season: 6, team: 'BounceTown', image: '/images/champions/bounceTown.jpg' },
  { season: 7, team: 'Net Losses', image: '/images/champions/netLosses.jpg' },
  { season: 8, team: 'Net Losses', image: '/images/champions/netLosses2.jpg' },
]

const mensChampions = [
  { season: 1, team: 'Sets With Jerhomies', image: '/images/champions/jerhomies.jpg' },
  { season: 2, team: 'High & Holy', image: '/images/champions/High&Holy.jpg' },
  { season: 3, team: 'Sari Sari Squad', image: '/images/champions/sarisari.jpg' },
  { season: 4, team: "David's Dictatorship", image: '/images/champions/davidDictatorship.jpg' },
  { season: 5, team: "Brandy's Angels", image: '/images/champions/bAngels.jpg' },
  { season: 6, team: 'Spartans', image: '/images/champions/spartans.jpg' },
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
    icon: Star,
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
    icon: Zap,
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
    icon: Target,
  },
]

const steps = [
  { num: '01', title: 'REGISTER', desc: 'Sign up with 6+ players. Pick your league night. Pay via e-transfer.', icon: Users },
  { num: '02', title: 'GET PLACED', desc: 'Week 1 placement matches seed your team into a tier of 3 based on skill.', icon: Target },
  { num: '03', title: 'COMPETE', desc: 'Play weekly. Win = move up a tier. Lose = drop down. Every game counts.', icon: Zap },
  { num: '04', title: 'PLAYOFFS', desc: '5 divisions from Diamond to Bronze. Season-end championship brackets.', icon: Trophy },
]

const stats = [
  { value: '51+', label: 'Teams', suffix: '' },
  { value: '3', label: 'Leagues Weekly', suffix: '' },
  { value: '11', label: 'Weeks Per Season', suffix: '' },
  { value: '150+', label: 'Active Players', suffix: '' },
]

/* ═══ ANIMATED COUNTER ═══ */
function AnimatedStat({ value, label }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="text-center">
      <span
        className={`font-display text-4xl sm:text-5xl font-black text-titos-white block transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {value}
      </span>
      <span className="block text-titos-gray-400 text-[11px] uppercase tracking-[0.15em] mt-2 font-medium">
        {label}
      </span>
    </div>
  )
}

/* ═══ PAGE ═══ */
export default function HomePageClient({ initialResults }) {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef(null)

  // Defer video load until after the page is fully loaded / idle — keeps the
  // hero image as the LCP element and avoids bandwidth contention.
  useEffect(() => {
    const start = () => setShouldLoadVideo(true)
    if (typeof window === 'undefined') return
    if (document.readyState === 'complete') {
      // Page already loaded (e.g., soft-nav) — wait for idle
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500))
      const id = idle(start)
      return () => {
        if (window.cancelIdleCallback && typeof id === 'number') window.cancelIdleCallback(id)
        else clearTimeout(id)
      }
    }
    window.addEventListener('load', start, { once: true })
    return () => window.removeEventListener('load', start)
  }, [])

  // Once the video element exists and we've decided to load it, start playing
  useEffect(() => {
    if (!shouldLoadVideo || !videoRef.current) return
    const v = videoRef.current
    v.load()
    const onCanPlay = () => setVideoReady(true)
    v.addEventListener('canplaythrough', onCanPlay, { once: true })
    v.play().catch(() => {/* autoplay can fail on some browsers; image remains as poster */})
    return () => v.removeEventListener('canplaythrough', onCanPlay)
  }, [shouldLoadVideo])

  return (
    <div>
      {/* ═══════════════════════════════════════
          HERO — Image-first (LCP), video is progressive enhancement
          ═══════════════════════════════════════ */}
      <section className="relative h-screen min-h-[600px] max-h-[1000px] flex items-end overflow-hidden -mt-16 lg:-mt-20">
        {/* LCP image — always in SSR HTML so `priority` emits a preload link */}
        <Image
          src="/images/titosHero.jpg"
          alt="Tito's Courts volleyball game night"
          fill
          priority
          sizes="100vw"
          quality={75}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAAIAAsDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ACJqAAH/2Q=="
          className="object-cover z-[1]"
        />

        {/* Background video — lazy, loads after page 'load' event */}
        {shouldLoadVideo && (
          <video
            ref={videoRef}
            muted loop playsInline
            preload="none"
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover z-[2] transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src="/images/hero-video.mp4" type="video/mp4" />
          </video>
        )}

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-black/50 z-[3]" />
        <div className="absolute inset-0 bg-gradient-to-t from-titos-surface via-transparent to-transparent z-[3]" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-titos-surface to-transparent z-[3]" />

        {/* Decorative orb */}
        <div className="orb orb-gold w-[500px] h-[500px] -bottom-48 -right-24 absolute z-[4]" />

        {/* Content */}
        <div className="relative z-[5] w-full pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              {/* Season badges */}
              <div className="mb-6 animate-fade-in flex flex-wrap gap-2" style={{ animationDelay: '0.1s' }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-titos-gold/10 border border-titos-gold/20 rounded-full text-titos-gold text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 bg-titos-gold rounded-full animate-pulse-live" />
                  COED Season 9
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-titos-gold/10 border border-titos-gold/20 rounded-full text-titos-gold text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 bg-titos-gold rounded-full animate-pulse-live" />
                  Mens Season 7
                </span>
              </div>

              {/* Headline */}
              <h1
                className="text-[clamp(3rem,7vw,6rem)] font-display font-black leading-[0.88] tracking-tight mb-6 animate-slide-up"
                style={{ animationDelay: '0.15s' }}
              >
                <span className="text-titos-white block">FIND YOUR</span>
                <span className="gradient-text block">TIER.</span>
              </h1>

              {/* Subtext */}
              <p
                className="text-titos-gray-300 text-base sm:text-lg max-w-lg mb-8 leading-relaxed animate-fade-in"
                style={{ animationDelay: '0.3s' }}
              >
                Mississauga&apos;s premier recreational volleyball leagues.
                Three nights a week. Tier-based competition where every match matters.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Link href="/register" className="btn-primary">
                  <span>Join a League</span> <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/standings" className="btn-ghost">
                  <span>View Standings</span>
                </Link>
              </div>

              {/* Venue info */}
              <div className="mt-10 space-y-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex flex-wrap items-center gap-3 text-titos-gray-400 text-xs uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Pakmen Courts, Mississauga</span>
                  <span className="text-titos-gray-500">|</span>
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Tue 8PM-12AM &middot; Sun 9PM-12AM</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-titos-gray-400 text-xs uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Michael Power - St. Joseph HS, Etobicoke</span>
                  <span className="text-titos-gray-500">|</span>
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Thu 8PM-12AM</span>
                </div>
              </div>

              {/* Social */}
              <div className="mt-6 flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.55s' }}>
                <a href="https://www.instagram.com/titoscourts" target="_blank" rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-titos-gray-400 hover:text-titos-gold hover:border-titos-gold/20 hover:bg-titos-gold/5 transition-all duration-200" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="https://www.youtube.com/@titoscourts" target="_blank" rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-titos-gray-400 hover:text-titos-gold hover:border-titos-gold/20 hover:bg-titos-gold/5 transition-all duration-200" aria-label="YouTube">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          STATS STRIP — animated counters
          ═══════════════════════════════════════ */}
      <section className="relative z-10 border-y border-titos-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <AnimatedStat key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          LATEST RESULTS
          ═══════════════════════════════════════ */}
      <LatestResults initialResults={initialResults} />

      {/* ═══════════════════════════════════════
          LEAGUES — three-column showcase
          ═══════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <div>
              <span className="section-label">Our Leagues</span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-titos-white leading-none">
                THREE NIGHTS.<br />
                <span className="text-titos-gray-400">EVERY WEEK.</span>
              </h2>
            </div>
            <Link href="/leagues" className="text-titos-gold text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all group">
              All Leagues <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* League cards */}
          <div className="grid lg:grid-cols-3 gap-5">
            {leagues.map((league) => {
              const Icon = league.icon
              return (
                <Link
                  key={league.slug}
                  href={`/leagues/${league.slug}`}
                  className="group card-premium p-7 sm:p-8 block"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-titos-gold/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-titos-gold" />
                      </div>
                      <span className="text-[3rem] sm:text-[3.5rem] font-black text-white/[0.06] leading-none font-display select-none">
                        {league.day}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-titos-gold/10 border border-titos-gold/20 rounded-lg text-titos-gold text-[11px] font-bold uppercase tracking-wider">
                      {league.badge}
                    </span>
                  </div>

                  {/* Title + desc */}
                  <h3 className="font-display text-xl sm:text-2xl font-black text-titos-white mb-2 group-hover:text-titos-gold transition-colors duration-300">
                    {league.name}
                  </h3>
                  <p className="text-titos-gray-400 text-sm mb-6 leading-relaxed">
                    {league.tagline}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-titos-gray-400 mb-6">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {league.teams} teams
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      {league.tiers} tiers
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-5 border-t border-titos-border/50">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${league.statusColor}`}>
                      {league.status}
                    </span>
                    <span className="text-titos-gold text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      View <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS — 4-step process
          ═══════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-titos-elevated noise overflow-hidden">
        {/* Decorative orbs */}
        <div className="orb orb-gold w-[400px] h-[400px] -top-48 -left-24 absolute" />
        <div className="orb orb-blue w-[300px] h-[300px] -bottom-32 -right-16 absolute" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">The Format</span>
            <h2 className="text-4xl sm:text-5xl font-black text-titos-white">
              HOW IT WORKS
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="relative group">
                  {/* Step number watermark */}
                  <span className="text-[5rem] font-black text-white/[0.03] leading-none block font-display mb-0 select-none">
                    {step.num}
                  </span>
                  <div className="-mt-8 relative">
                    {/* Icon + gold line */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-titos-gold/10 flex items-center justify-center group-hover:bg-titos-gold/20 transition-colors">
                        <Icon className="w-4 h-4 text-titos-gold" />
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-titos-gold/30 to-transparent" />
                    </div>
                    <h3 className="font-display text-lg font-black text-titos-white mb-2">{step.title}</h3>
                    <p className="text-titos-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tier system callout */}
          <div className="mt-20 card-glass rounded-xl p-8 sm:p-10 text-center max-w-3xl mx-auto glow-gold">
            <div className="w-12 h-12 rounded-xl bg-titos-gold/10 flex items-center justify-center mx-auto mb-4">
              <ArrowUpDown className="w-6 h-6 text-titos-gold" />
            </div>
            <h3 className="font-display text-2xl font-black text-titos-white mb-3">THE TIER SYSTEM</h3>
            <p className="text-titos-gray-300 text-sm sm:text-base leading-relaxed">
              Teams are grouped into tiers of 3. Each week, you play round-robin within your tier — 6 games total.
              <strong className="text-titos-gold font-bold"> 1st place moves up. 2nd stays. 3rd drops down.</strong>
              {' '}By season&apos;s end, your cumulative standing determines your playoff division.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          COMMUNITY — photo gallery
          ═══════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="section-label">Community</span>
              <h2 className="text-4xl sm:text-5xl font-black text-titos-white leading-none">
                MORE THAN<br />
                <span className="text-titos-gray-400">A LEAGUE.</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/titoscourts" target="_blank" rel="noopener noreferrer"
                className="btn-ghost btn-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                <span>@titoscourts</span>
              </a>
            </div>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden aspect-[4/3] group">
              <Image src="/images/community/community3.jpg" alt="Banquet Night at Hilton" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <span className="text-titos-white font-display text-lg font-black">Banquet Night</span>
                <span className="block text-titos-gray-200 text-xs mt-0.5">Hilton, Mississauga</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square group">
              <Image src="/images/community/community5.jpg" alt="Game night action" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square group">
              <Image src="/images/community/community2.jpg" alt="Community gathering" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square group">
              <Image src="/images/community/community6.jpg" alt="Volleyball match" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square group">
              <Image src="/images/community/community1.jpg" alt="Team celebration" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HIGHLIGHTS / MEDIA
          ═══════════════════════════════════════ */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 lg:px-8 bg-titos-elevated/50 noise">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="section-label">Follow Us</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none">
                CATCH THE<br />
                <span className="text-titos-gray-400">ACTION.</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/titoscourts" target="_blank" rel="noopener noreferrer"
                className="btn-ghost btn-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                <span>@titoscourts</span>
              </a>
              <a href="https://www.youtube.com/@titoscourts" target="_blank" rel="noopener noreferrer"
                className="btn-ghost btn-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                <span>YouTube</span>
              </a>
            </div>
          </div>

          {/* Media grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden aspect-[4/3] group">
              <Image src="/images/titosHero.jpg" alt="Tito's Courts game night" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <span className="text-titos-white text-sm font-bold">Game Night at Pakmen</span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square group">
              <Image src="/images/IMG_20231005_001649_419.jpg" alt="Tito's Courts team" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-titos-card flex items-center justify-center border border-titos-border/30 group hover:border-titos-gold/20 transition-colors">
              <a href="https://www.instagram.com/titoscourts" target="_blank" rel="noopener noreferrer" className="text-center p-4">
                <svg className="w-8 h-8 text-titos-gold mx-auto mb-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                <span className="text-titos-gold text-xs font-bold uppercase tracking-wider">Follow on IG</span>
              </a>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-titos-card flex items-center justify-center border border-titos-border/30 group hover:border-titos-gold/20 transition-colors">
              <a href="https://www.youtube.com/@titoscourts" target="_blank" rel="noopener noreferrer" className="text-center p-4">
                <svg className="w-8 h-8 text-titos-gold mx-auto mb-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                <span className="text-titos-gold text-xs font-bold uppercase tracking-wider">Watch on YT</span>
              </a>
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-square bg-gradient-to-br from-titos-gold/[0.08] to-titos-surface flex items-center justify-center border border-titos-border/30">
              <div className="text-center">
                <span className="text-titos-gold text-3xl font-black font-display block">150+</span>
                <span className="text-titos-gray-400 text-xs uppercase tracking-wider">Players</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HALL OF CHAMPIONS
          ═══════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="section-label">Hall of Champions</span>
              <h2 className="text-4xl sm:text-5xl font-black text-titos-white leading-none">
                DEFENDING<br />
                <span className="text-titos-gray-400">CHAMPIONS.</span>
              </h2>
            </div>
            <Link href="/champions" className="text-titos-gold text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:gap-3 transition-all group">
              View All Champions <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* COED Champion */}
            {(() => {
              const champ = coedChampions[coedChampions.length - 1]
              return (
                <Link href="/champions" className="group card-flat rounded-xl overflow-hidden">
                  <div className="relative aspect-[16/9] sm:aspect-[2/1]">
                    {champ.image ? (
                      <Image src={champ.image} alt={champ.team} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-titos-card to-titos-elevated flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-titos-gold/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 bg-titos-gold text-black text-[11px] font-black uppercase tracking-wider rounded-lg">
                        COED Season {champ.season}
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <h3 className="font-display text-2xl font-black text-titos-white group-hover:text-titos-gold transition-colors duration-300">{champ.team}</h3>
                      <span className="text-titos-gray-300 text-xs flex items-center gap-1 mt-1">
                        <Award className="w-3 h-3 text-titos-gold" />
                        Diamond Division Champions &middot; Back-to-back
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })()}

            {/* MENS Champion */}
            {(() => {
              const champ = mensChampions[mensChampions.length - 1]
              return (
                <Link href="/champions" className="group card-flat rounded-xl overflow-hidden">
                  <div className="relative aspect-[16/9] sm:aspect-[2/1]">
                    {champ.image ? (
                      <Image src={champ.image} alt={champ.team} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-titos-card to-titos-elevated flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-titos-gold/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 bg-titos-gold text-black text-[11px] font-black uppercase tracking-wider rounded-lg">
                        MENS Season {champ.season}
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <h3 className="font-display text-2xl font-black text-titos-white group-hover:text-titos-gold transition-colors duration-300">{champ.team}</h3>
                      <span className="text-titos-gray-300 text-xs flex items-center gap-1 mt-1">
                        <Award className="w-3 h-3 text-titos-gold" />
                        Diamond Division Champions
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })()}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA — final conversion
          ═══════════════════════════════════════ */}
      <section className="relative py-28 sm:py-36 px-4 sm:px-6 lg:px-8 noise overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-titos-gold/[0.04] via-transparent to-titos-gold/[0.02]" />
        <div className="orb orb-gold w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 absolute opacity-10" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-titos-white mb-6 leading-none">
            READY TO<br />
            <span className="gradient-text">HIT THE COURT?</span>
          </h2>
          <p className="text-titos-gray-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Whether you&apos;re chasing a championship or just learning the game,
            there&apos;s a place for you at Tito&apos;s Courts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary">
              <span>Register Your Team</span> <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="btn-ghost">
              <span>Get in Touch</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
