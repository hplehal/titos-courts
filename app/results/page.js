import ResultsClient from './ResultsClient'
import { getActiveLeagues, getLeagueSchedule } from '@/lib/server/leagues'

export const metadata = {
  title: "Volleyball Results & Scores — Mississauga | Tito's Courts",
  description: "Weekly match results, tier scores, and standings for Tito's Courts volleyball leagues in Mississauga. Track wins, losses, and team movement between Diamond, Platinum, and Gold tiers.",
  alternates: { canonical: 'https://titoscourts.com/results' },
  openGraph: {
    title: "Volleyball Results & Scores — Mississauga",
    description: "Weekly match results and standings for Tito's Courts volleyball leagues in Mississauga.",
    url: 'https://titoscourts.com/results',
    type: 'website',
    images: ['/images/titosHero.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Volleyball Results & Scores — Mississauga",
    description: "Weekly match results for Tito's Courts volleyball leagues.",
    images: ['/images/titosHero.jpg'],
  },
}
export const revalidate = 300

export default async function ResultsPage() {
  const leagues = await getActiveLeagues()
  const firstSlug = leagues[0]?.slug
  const initialData = firstSlug ? await getLeagueSchedule(firstSlug) : null
  return (
    <>
      <p className="sr-only">
        Weekly match results and scores for Tito&apos;s Courts recreational volleyball leagues in Mississauga. Tracks winners, losers, set scores, tier standings, and team movement for Tuesday Coed, Sunday Men&apos;s, and Thursday Rec Coed leagues.
      </p>
      <ResultsClient leagues={leagues} initialSlug={firstSlug} initialData={initialData} />
    </>
  )
}
