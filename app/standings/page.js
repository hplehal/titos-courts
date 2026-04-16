import StandingsClient from './StandingsClient'
import { getActiveLeagues, getLeagueStandings } from '@/lib/server/leagues'

export const metadata = {
  title: "Volleyball League Standings — Mississauga | Tito's Courts",
  description: "Live standings for all three Tito's Courts volleyball leagues in Mississauga: Tuesday Coed, Sunday Men's, and Thursday Rec Coed. Track team rankings, wins, and playoff divisions.",
  alternates: { canonical: 'https://titoscourts.com/standings' },
  openGraph: {
    title: "Volleyball League Standings — Mississauga",
    description: "Live standings for Tito's Courts volleyball leagues. Rankings, wins, losses, and playoff divisions across all three weekly leagues.",
    url: 'https://titoscourts.com/standings',
    type: 'website',
    images: ['/images/titosHero.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Volleyball League Standings — Mississauga",
    description: "Rankings and playoff divisions for Tito's Courts volleyball leagues in Mississauga.",
    images: ['/images/titosHero.jpg'],
  },
}
export const revalidate = 300

export default async function StandingsPage() {
  const leagues = await getActiveLeagues()
  const firstSlug = leagues[0]?.slug
  // Server-fetch the initial league's standings so Googlebot gets real data
  // in the HTML response, not an empty skeleton.
  const initialData = firstSlug ? await getLeagueStandings(firstSlug) : null
  return (
    <>
      <p className="sr-only">
        Current standings for Tito&apos;s Courts recreational volleyball leagues in Mississauga. Tracks team performance across Diamond, Platinum, Gold, Silver, and Bronze divisions for Tuesday Coed, Sunday Men&apos;s, and Thursday Rec Coed leagues at Pakmen Courts.
      </p>
      <StandingsClient leagues={leagues} initialSlug={firstSlug} initialData={initialData} />
    </>
  )
}
