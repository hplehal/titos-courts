import { notFound } from 'next/navigation'
import ScheduleClient from '../ScheduleClient'
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
  const title = `${label} Volleyball Schedule — Mississauga | Tito's Courts`
  const description = `Weekly game schedule for ${label} volleyball league at Tito's Courts in Mississauga. Find your tier, court assignment, opponents, and match times at Pakmen Courts and Michael Power.`
  return {
    title,
    description,
    alternates: { canonical: `https://titoscourts.com/schedule/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://titoscourts.com/schedule/${slug}`,
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

export default async function ScheduleLeaguePage({ params }) {
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
        {`Weekly game schedule for the ${label} recreational volleyball league at Tito's Courts in Mississauga. Includes tier assignments, court numbers, opponents, and match times for every week of the season.`}
      </p>
      <ScheduleClient leagues={leagues} initialSlug={slug} initialData={initialData} />
    </>
  )
}
