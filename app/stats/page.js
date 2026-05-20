import { redirect } from 'next/navigation'
import { getActiveLeagues, getLeagueSchedule } from '@/lib/server/leagues'
import { getLeagueStats } from '@/lib/server/playerStats'
import StatsClient from './StatsClient'

// Default landing — pick the league with the most stats recorded so the
// page never opens to an empty table. Falls back to the first active league.

export const metadata = {
  title: "Player Stats Leaderboards — Mississauga | Tito's Courts",
  description: "Player kill, assist, dig, ace, and block leaderboards for Tito's Courts volleyball leagues in Mississauga.",
  alternates: { canonical: 'https://titoscourts.com/stats' },
}
export const revalidate = 300

export default async function StatsPage() {
  const leagues = await getActiveLeagues()
  // Pick the league that has any stats; default to the first.
  let bestSlug = leagues[0]?.slug
  for (const l of leagues) {
    const s = await getLeagueStats(l.slug)
    if (s.players?.some(p => p.totals.kills + p.totals.assists + p.totals.digs + p.totals.aces + p.totals.blocks > 0)) {
      bestSlug = l.slug
      break
    }
  }
  if (bestSlug) redirect(`/stats/${bestSlug}`)

  return (
    <div className="py-12 px-4 text-center text-titos-gray-400">
      No active leagues yet.
    </div>
  )
}
