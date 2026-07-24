import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Trophy, ArrowLeft } from 'lucide-react'
import { getActiveLeagues } from '@/lib/server/leagues'
import { getLeaguePlayoffs } from '@/lib/server/playoffs'
import PlayoffsClient from './PlayoffsClient'

export const revalidate = 60

const LEAGUE_LABEL = {
  'tuesday-coed': 'Tuesday Coed',
  'sunday-mens': "Sunday Men's",
  'thursday-rec-coed': 'Thursday Rec Coed',
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const label = LEAGUE_LABEL[slug] || slug
  const title = `${label} Playoff Bracket — Mississauga | Tito's Courts`
  const description = `Live playoff bracket for ${label} at Tito's Courts in Mississauga. Diamond / Platinum / Gold / Silver division brackets — top-2 byes, 3v6 + 4v5 quarterfinals, reseeded SF + Final.`
  return {
    title, description,
    alternates: { canonical: `https://titoscourts.com/playoffs/${slug}` },
    openGraph: { title, description, url: `https://titoscourts.com/playoffs/${slug}`, type: 'website', images: ['/images/titosHero.jpg'] },
  }
}

export default async function PlayoffsLeaguePage({ params }) {
  const { slug } = await params
  const [leagues, data] = await Promise.all([
    getActiveLeagues(),
    getLeaguePlayoffs(slug),
  ])
  if (!leagues.some(l => l.slug === slug)) notFound()

  const label = LEAGUE_LABEL[slug] || slug

  return (
    <div className="py-10 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/standings/${slug}`}
            className="text-titos-gray-400 hover:text-titos-gold transition-colors cursor-pointer"
            aria-label="Back to standings"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <span className="section-label flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
            Championship Brackets
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none mb-6">
          {label.toUpperCase()} PLAYOFFS
        </h1>

        {!data.hasPlayoffs ? (
          <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-12 text-center">
            <Trophy className="w-12 h-12 text-titos-gray-600 mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-display text-xl font-black text-titos-white mb-2">Bracket not generated yet</h2>
            <p className="text-titos-gray-400 text-sm max-w-md mx-auto">
              The playoff bracket appears here once all regular-season scores are in and admin generates the bracket.
            </p>
          </div>
        ) : (
          <PlayoffsClient slug={slug} initialData={data} />
        )}
      </div>
    </div>
  )
}
