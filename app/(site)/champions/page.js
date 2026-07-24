'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Crown } from 'lucide-react'

const coedChampions = [
  { season: 8, team: 'Net Losses', image: '/images/champions/netLosses2.jpg', year: '2026' },
  { season: 7, team: 'Net Losses', image: '/images/champions/netLosses.jpg', year: '2025' },
  { season: 6, team: 'BounceTown', image: '/images/champions/bounceTown.jpg', year: '2025' },
  { season: 5, team: 'Sauce Walkas', image: '/images/champions/sauceWalkas.jpg', year: '2025' },
  { season: 4, team: 'Setsy & We Know It', image: '/images/champions/sawki.jpg', year: '2024' },
  { season: 3, team: 'Despicable Pookies', image: '/images/champions/dPookies.jpg', year: '2024' },
  { season: 2, team: 'Tip Pics', image: '/images/champions/tipPics.jpg', year: '2024' },
  { season: 1, team: 'Safe Sets', image: '/images/champions/safeSets.jpg', year: '2023' },
]

const mensChampions = [
  { season: 6, team: 'Spartans', image: '/images/champions/spartans.jpg', year: '2026' },
  { season: 5, team: "Brandy's Angels", image: '/images/champions/bAngels.jpg', year: '2025' },
  { season: 4, team: "David's Dictatorship", image: '/images/champions/davidDictatorship.jpg', year: '2025' },
  { season: 3, team: 'Sari Sari Squad', image: '/images/champions/sarisari.jpg', year: '2025' },
  { season: 2, team: 'High & Holy', image: '/images/champions/High&Holy.jpg', year: '2024' },
  { season: 1, team: 'Sets With Jerhomies', image: '/images/champions/jerhomies.jpg', year: '2024' },
]

function ChampionCard({ champ, index, featured = false }) {
  const isLatest = index === 0

  return (
    <div className={`group relative ${featured ? '' : ''}`}>
      {/* Photo */}
      <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
        isLatest
          ? 'border-titos-gold/50 shadow-lg shadow-titos-gold/10 group-hover:shadow-titos-gold/20'
          : 'border-titos-border/30 group-hover:border-titos-gold/30'
      } ${featured ? 'aspect-[3/4]' : 'aspect-square'}`}>
        {champ.image ? (
          <Image src={champ.image} alt={`${champ.team} — Season ${champ.season} Champions`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-titos-card via-titos-elevated to-titos-card flex flex-col items-center justify-center gap-2">
            {isLatest ? (
              <Crown className="w-10 h-10 text-titos-gold/40" />
            ) : (
              <Trophy className="w-8 h-8 text-titos-gold/25" />
            )}
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Season badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded font-display font-black uppercase text-[11px] tracking-wider ${
          isLatest ? 'bg-titos-gold text-black' : 'bg-black/60 text-titos-gold'
        }`}>
          Season {champ.season}
        </div>

        {/* Defending champ badge */}
        {isLatest && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-titos-gold/20 border border-titos-gold/40 rounded text-titos-gold text-[11px] font-black uppercase tracking-wider">
            Defending
          </div>
        )}

        {/* Team name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className={`font-display font-black text-titos-white leading-tight ${featured ? 'text-lg' : 'text-sm'}`}>
            {champ.team}
          </h3>
          {champ.year && <span className="text-titos-gray-300 text-[11px]">{champ.year}</span>}
        </div>
      </div>
    </div>
  )
}

export default function ChampionsPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-titos-gold/10 border border-titos-gold/20 rounded-full mb-6">
            <Trophy className="w-4 h-4 text-titos-gold" />
            <span className="text-titos-gold text-xs font-bold uppercase tracking-wider">Diamond Division</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-titos-white leading-[0.9] mb-4">
            HALL OF<br />
            <span className="gradient-text">CHAMPIONS.</span>
          </h1>
          <p className="text-titos-gray-300 text-base sm:text-lg max-w-xl mx-auto">
            Every season, one team rises above the rest. These are the Diamond Division champions of Tito&apos;s Courts.
          </p>
        </div>

        {/* ═══ COED CHAMPIONS ═══ */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-0.5 bg-titos-gold" />
            <h2 className="font-display text-2xl font-black text-titos-white uppercase tracking-tight">COED Champions</h2>
            <div className="flex-1 h-px bg-titos-border/30" />
            <span className="text-titos-gray-500 text-xs font-bold uppercase tracking-wider">{coedChampions.length} Seasons</span>
          </div>

          {/* Featured: Latest champion */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 mb-4">
            <ChampionCard champ={coedChampions[0]} index={0} featured />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {coedChampions.slice(1, 7).map((champ, i) => (
                <ChampionCard key={champ.season} champ={champ} index={i + 1} />
              ))}
            </div>
          </div>
          {coedChampions.length > 7 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {coedChampions.slice(7).map((champ, i) => (
                <ChampionCard key={champ.season} champ={champ} index={i + 7} />
              ))}
            </div>
          )}

          {/* Back-to-back callout */}
          {coedChampions[0].team === coedChampions[1]?.team && (
            <div className="mt-6 card-flat rounded-xl p-4 flex items-center gap-3 border-titos-gold/20">
              <Crown className="w-5 h-5 text-titos-gold flex-shrink-0" />
              <p className="text-titos-gray-200 text-sm">
                <strong className="text-titos-gold font-black">{coedChampions[0].team}</strong> — Back-to-back Diamond Division champions (Season {coedChampions[1].season} & {coedChampions[0].season})
              </p>
            </div>
          )}
        </div>

        {/* ═══ MENS CHAMPIONS ═══ */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-0.5 bg-titos-gold" />
            <h2 className="font-display text-2xl font-black text-titos-white uppercase tracking-tight">MENS Champions</h2>
            <div className="flex-1 h-px bg-titos-border/30" />
            <span className="text-titos-gray-500 text-xs font-bold uppercase tracking-wider">{mensChampions.length} Seasons</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
            <ChampionCard champ={mensChampions[0]} index={0} featured />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mensChampions.slice(1).map((champ, i) => (
                <ChampionCard key={champ.season} champ={champ} index={i + 1} />
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-10">
          <p className="text-titos-gray-400 text-sm mb-4">Think your team has what it takes?</p>
          <Link href="/register" className="btn-primary">
            Join the League <Trophy className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
