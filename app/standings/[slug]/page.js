import { notFound } from 'next/navigation'
import StandingsClient from '../StandingsClient'
import { getActiveLeagues, getLeagueStandings } from '@/lib/server/leagues'

// ISR — revalidate every 5 min. Admin score updates bust the cache via tag.
export const revalidate = 300

const LEAGUE_LABEL = {
  'tuesday-coed': "Tuesday Coed",
  'sunday-mens': "Sunday Men's",
  'thursday-rec-coed': 'Thursday Rec Coed',
}

export async function generateStaticParams() {
  // Pre-render known league slugs at build time so Googlebot gets cached HTML
  // with real standings rather than an empty shell.
  const leagues = await getActiveLeagues()
  return leagues.map(l => ({ slug: l.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const label = LEAGUE_LABEL[slug] || slug
  const title = `${label} Volleyball Standings — Mississauga | Tito's Courts`
  const description = `Live standings for ${label} volleyball league at Tito's Courts in Mississauga. Track team rankings, wins, losses, point differentials, and playoff divisions across Diamond, Platinum, Gold, Silver, and Bronze tiers.`
  return {
    title,
    description,
    alternates: { canonical: `https://titoscourts.com/standings/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://titoscourts.com/standings/${slug}`,
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

export default async function StandingsLeaguePage({ params }) {
  const { slug } = await params
  const [leagues, initialData] = await Promise.all([
    getActiveLeagues(),
    getLeagueStandings(slug),
  ])

  if (!leagues.some(l => l.slug === slug)) notFound()

  const label = LEAGUE_LABEL[slug] || slug
  return (
    <>
      {/* Googlebot-indexable copy — hidden visually but semantically first so crawlers see real text */}
      <p className="sr-only">
        {`Current standings for the ${label} recreational volleyball league at Tito's Courts in Mississauga. Tracks team performance across Diamond, Platinum, Gold, Silver, and Bronze divisions at Pakmen Courts and Michael Power High School.`}
      </p>
      <StandingsClient leagues={leagues} initialSlug={slug} initialData={initialData} />
    </>
  )
}
