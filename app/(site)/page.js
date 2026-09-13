import HomePageClient from '@/components/home/HomePageClient'
import { getHomeLeagues, getLatestResults } from '@/lib/server/leagues'

// ISR — 1 min. Homepage results widget refreshes frequently during score entry.
export const revalidate = 60

export default async function HomePage() {
  // Fetch latest results on the server so initial HTML contains real team
  // names / scores / movement arrows for SEO. League cards come from the
  // database so renamed and newly visible leagues show up.
  const [initialResults, leagues] = await Promise.all([getLatestResults(), getHomeLeagues()])
  return <HomePageClient initialResults={initialResults} leagues={leagues} />
}
