// Server component wrapper — fetches results on the server so Googlebot sees
// real team names, scores, and movement arrows in the initial HTML.
// The client `LatestResults` component then hydrates the tabs and interactions.

import LatestResults from './LatestResults'
import { getLatestResults } from '@/lib/server/leagues'

export default async function LatestResultsSection() {
  const results = await getLatestResults()
  return <LatestResults initialResults={results} />
}
