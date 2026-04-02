'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Users,
  Trophy,
  Calendar,
  ChevronRight,
  Star,
  TrendingUp,
  ArrowUpDown,
  MapPin,
  Clock,
} from 'lucide-react'
import StatCounter from '@/components/ui/StatCounter'

const leagues = [
  {
    name: 'Tuesday COED',
    slug: 'tuesday-coed',
    day: 'TUE',
    badge: 'FLAGSHIP',
    teams: 24,
    tiers: 8,
    tagline: 'The original. The biggest. 24 teams across 8 tiers.',
    status: 'SEASON 10 ACTIVE',
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
    status: 'SEASON 10 ACTIVE',
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

const stats = [
  { value: '150', suffix: '+', label: 'Players', icon: Users },
  { value: '10', label: 'Seasons', icon: Trophy },
  { value: '3', label: 'Weekly Leagues', icon: Calendar },
  { value: '500', suffix: '+', label: 'Matches', icon: TrendingUp },
]

const testimonials = [
  { quote: "Best rec league in the GTA. The tier system keeps every game competitive and fresh.", name: "Alex M.", team: "Block Party" },
  { quote: "Joined as a free agent. Now my team is chasing Diamond division. The community is unreal.", name: "Sarah K.", team: "Net Worth" },
  { quote: "Tuesday nights at Pakmen are the highlight of my week. The organization is top tier.", name: "Dev P.", team: "Ace Ventura" },
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

        {/* Diagonal line accent */}
        <div className="absolute top-0 right-[20%] w-px h-full bg-gradient-to-b from-titos-gold/20 via-titos-gold/5 to-transparent" />
        <div className="absolute top-[20%] right-[40%] w-px h-[60%] bg-gradient-to-b from-titos-gold/10 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 items-end">
            {/* Left: Copy */}
            <div>
              <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-titos-gold/10 border border-titos-gold/20 rounded-full text-titos-gold text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-titos-gold rounded-full" />
                  Season 10 Now Playing
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
                Tue · Thu 8PM–12AM · Sun 9PM–12AM
              </div>
            </div>

            {/* Right: Logo */}
            <div className="hidden lg:flex justify-end items-end animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <Image
                src="/images/titosvl.png"
                alt="Tito's Volleyball League"
                width={420}
                height={200}
                className="w-auto h-auto max-h-[280px] opacity-80"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="relative -mt-1 z-10">
        <div className="section-line" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <StatCounter key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} icon={stat.icon} />
            ))}
          </div>
        </div>
        <div className="section-line" />
      </section>

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

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Community</span>
              <h2 className="text-4xl sm:text-5xl font-black text-titos-white leading-none">
                THE PLAYERS<br />
                <span className="text-titos-gray-400">HAVE SPOKEN.</span>
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="card-flat rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-titos-gold fill-titos-gold" />
                    ))}
                  </div>
                  <p className="text-titos-gray-100 text-base leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-4 border-t border-titos-border/50">
                  <p className="font-bold text-titos-white text-sm">{t.name}</p>
                  <p className="text-titos-gray-400 text-xs uppercase tracking-wider">{t.team}</p>
                </div>
              </div>
            ))}
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
            Whether you&apos;re chasing Diamond or just learning to serve, there&apos;s a tier waiting for you.
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
