import { notFound } from 'next/navigation'
import ResultsClient from '../ResultsClient'
import { getActiveLeagues, getLeagueSchedule } from '@/lib/server/leagues'

export const revalidate = 300

const LEAGUE_LABEL = {
  'tuesday-coed': 'Tuesday Coed',
  'sunday-mens': "Sunday Men's",
  'thursday-rec-coed': 'Thursday Rec Coed',
}

export async function generateStaticParams() {
  const leagues = await getActiveLeagues()
  return leagues.map(l => ({ slug: l.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const label = LEAGUE_LABEL[slug] || slug
  const title = `${label} Volleyball Results & Scores — Mississauga | Tito's Courts`
  const description = `Match results, tier scores, and team movement for ${label} volleyball league at Tito's Courts in Mississauga. Weekly scores, wins, losses, and playoff tracking.`
  return {
    title,
    description,
    alternates: { canonical: `https://titoscourts.com/results/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://titoscourts.com/results/${slug}`,
      type: 'website',
      images: ['/images/titosHero.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/titosHero.jpg'],
    },
  }
}

export default async function ResultsLeaguePage({ params }) {
  const { slug } = await params
  const [leagues, initialData] = await Promise.all([
    getActiveLeagues(),
    getLeagueSchedule(slug),
  ])

  if (!leagues.some(l => l.slug === slug)) notFound()

  const label = LEAGUE_LABEL[slug] || slug
  return (
    <>
      <p className="sr-only">
        {`Weekly match results and scores for the ${label} recreational volleyball league at Tito's Courts in Mississauga. Includes tier standings, winner/loser per match, set scores, and team movement between tiers.`}
      </p>
      <ResultsClient leagues={leagues} initialSlug={slug} initialData={initialData} />
    </>
  )
}
