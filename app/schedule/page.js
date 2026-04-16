import ScheduleClient from './ScheduleClient'
import { getActiveLeagues, getLeagueSchedule } from '@/lib/server/leagues'

export const metadata = {
  title: "Volleyball Schedule — Mississauga Indoor League | Tito's Courts",
  description: "Weekly game schedule for all three Tito's Courts volleyball leagues in Mississauga. Find your tier, court, opponents, and match times at Pakmen Courts and Michael Power.",
  alternates: { canonical: 'https://titoscourts.com/schedule' },
  openGraph: {
    title: "Volleyball Schedule — Mississauga Indoor League",
    description: "Weekly games, tier assignments, and court info for Tito's Courts volleyball leagues in Mississauga.",
    url: 'https://titoscourts.com/schedule',
    type: 'website',
    images: ['/images/titosHero.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Volleyball Schedule — Mississauga",
    description: "Weekly game schedule for Tito's Courts volleyball leagues.",
    images: ['/images/titosHero.jpg'],
  },
}
export const revalidate = 300

export default async function SchedulePage() {
  const leagues = await getActiveLeagues()
  const firstSlug = leagues[0]?.slug
  const initialData = firstSlug ? await getLeagueSchedule(firstSlug) : null
  return (
    <>
      <p className="sr-only">
        Weekly volleyball schedule for Tito&apos;s Courts recreational leagues in Mississauga. Shows tier assignments, court numbers, opponents, and match times for Tuesday Coed, Sunday Men&apos;s, and Thursday Rec Coed leagues at Pakmen Courts and Michael Power High School.
      </p>
      <ScheduleClient leagues={leagues} initialSlug={firstSlug} initialData={initialData} />
    </>
  )
}
