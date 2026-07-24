import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Trophy, ArrowRight } from 'lucide-react'
import { getActiveLeagues } from '@/lib/server/leagues'
import { getLeaguePlayoffs } from '@/lib/server/playoffs'

export const revalidate = 300

const LEAGUE_LABEL = {
  'tuesday-coed': 'Tuesday Coed',
  'sunday-mens': "Sunday Men's",
  'thursday-rec-coed': 'Thursday Rec Coed',
}

export const metadata = {
  title: "Playoff Brackets — Mississauga Volleyball | Tito's Courts",
  description: "Championship brackets for all Tito's Courts volleyball leagues in Mississauga. Diamond / Platinum / Gold / Silver division playoffs.",
  alternates: { canonical: 'https://titoscourts.com/playoffs' },
}

export default async function PlayoffsIndexPage() {
  const leagues = await getActiveLeagues()

  // Pre-fetch each league's playoff state so we can decide which links
  // are live and (if there's exactly one) auto-redirect to it.
  const states = await Promise.all(
    leagues.map(async (l) => {
      try {
        const data = await getLeaguePlayoffs(l.slug)
        return { ...l, hasPlayoffs: !!data?.hasPlayoffs }
      } catch {
        return { ...l, hasPlayoffs: false }
      }
    }),
  )
  const live = states.filter(s => s.hasPlayoffs)
  if (live.length === 1) redirect(`/playoffs/${live[0].slug}`)

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <span className="section-label flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
          Championship Brackets
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none mb-6">
          PLAYOFFS
        </h1>
        <p className="text-titos-gray-400 text-sm sm:text-base mb-8 max-w-xl">
          Single-elimination playoff brackets per division. Top-2 byes, 3v6 + 4v5 quarterfinals, then SF + Final. Pick a league to see its bracket.
        </p>

        <div className="space-y-3">
          {states.map((l) => {
            const label = LEAGUE_LABEL[l.slug] || l.name
            return (
              <Link
                key={l.slug}
                href={`/playoffs/${l.slug}`}
                className={`group block rounded-xl ring-1 px-5 py-4 flex items-center gap-4 transition-all duration-200 cursor-pointer min-h-[56px] ${
                  l.hasPlayoffs
                    ? 'ring-titos-gold/40 hover:ring-titos-gold/70 bg-gradient-to-r from-titos-gold/8 to-transparent'
                    : 'ring-titos-border bg-titos-card hover:ring-titos-border-light'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  l.hasPlayoffs ? 'bg-titos-gold/20 text-titos-gold' : 'bg-titos-elevated text-titos-gray-500'
                }`}>
                  <Trophy className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base sm:text-lg font-black text-titos-white">{label}</div>
                  <div className="text-xs text-titos-gray-400 mt-0.5">
                    {l.hasPlayoffs ? 'Bracket live — tap to view' : 'Bracket not generated yet'}
                  </div>
                </div>
                <ArrowRight
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                    l.hasPlayoffs ? 'text-titos-gold' : 'text-titos-gray-500'
                  }`}
                  aria-hidden="true"
                />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
