import HomePageClient from '@/components/home/HomePageClient'
import { getLatestResults } from '@/lib/server/leagues'

// ISR — 1 min. Homepage results widget refreshes frequently during score entry.
export const revalidate = 60

export default async function HomePage() {
  // Fetch latest results on the server so initial HTML contains real team
  // names / scores / movement arrows for SEO.
  const initialResults = await getLatestResults()
  return <HomePageClient initialResults={initialResults} />
}
