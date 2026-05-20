import { notFound } from 'next/navigation'
import StatsClient from '../StatsClient'
import { getActiveLeagues } from '@/lib/server/leagues'
import { getLeagueStats } from '@/lib/server/playerStats'

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
  const title = `${label} Player Stats — Mississauga | Tito's Courts`
  const description = `Kill, assist, dig, ace, and block leaderboards for the ${label} volleyball league at Tito's Courts in Mississauga.`
  return {
    title, description,
    alternates: { canonical: `https://titoscourts.com/stats/${slug}` },
    openGraph: { title, description, url: `https://titoscourts.com/stats/${slug}`, type: 'website', images: ['/images/titosHero.jpg'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/titosHero.jpg'] },
  }
}

export default async function StatsLeaguePage({ params }) {
  const { slug } = await params
  const [leagues, initialData] = await Promise.all([
    getActiveLeagues(),
    getLeagueStats(slug),
  ])

  if (!leagues.some(l => l.slug === slug)) notFound()

  const label = LEAGUE_LABEL[slug] || slug
  return (
    <>
      <p className="sr-only">
        {`Player statistics leaderboards for the ${label} recreational volleyball league at Tito's Courts in Mississauga. Tracks kills, assists, digs, aces, and blocks across the season at Pakmen Courts and Michael Power High School.`}
      </p>
      <StatsClient leagues={leagues} initialSlug={slug} initialData={initialData} />
    </>
  )
}
