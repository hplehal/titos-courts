// Inline CTA that surfaces the playoff bracket link on standings /
// schedule pages once the bracket exists. Server component — renders
// null when there's no bracket for the league so the banner only
// shows up during playoff weeks.
//
// Visual: prominent gold-tinted card, trophy icon, headline + sub
// line, arrow on the right. Touch target spans the whole card so
// thumbs on phones don't have to aim for a button.

import Link from 'next/link'
import { Trophy, ArrowRight } from 'lucide-react'
import { getLeaguePlayoffs } from '@/lib/server/playoffs'

export default async function PlayoffBracketCTA({ slug }) {
  if (!slug) return null
  let data
  try {
    data = await getLeaguePlayoffs(slug)
  } catch {
    return null
  }
  if (!data?.hasPlayoffs) return null

  const w10 = data.weeks?.[10]
  const w11 = data.weeks?.[11]
  const weekDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : null

  // Headline shifts a little depending on what's happening:
  //  - If W11 is completed → "View champions"
  //  - If W10/W11 has any live match → "Playoffs LIVE"
  //  - Otherwise (everything still scheduled) → "Playoff bracket is live"
  const allMatches = data.divisions.flatMap(d => d.matches)
  const hasLive = allMatches.some(m => m.status === 'live')
  const allDone = allMatches.length > 0 && allMatches.every(m => m.status === 'completed')

  let headline = 'Playoff bracket is here'
  let sub = `Diamond · Platinum · Gold · Silver — ${weekDate(w10?.date) ?? 'Week 10'} → ${weekDate(w11?.date) ?? 'Week 11'}`
  if (hasLive) {
    headline = 'Playoffs are LIVE'
    sub = 'Tap to follow your division bracket in real time.'
  } else if (allDone) {
    headline = 'See your division champion'
    sub = 'All brackets are final — tap to view the results.'
  }

  return (
    <Link
      href={`/playoffs/${slug}`}
      className="group block mb-6 rounded-2xl overflow-hidden ring-1 ring-titos-gold/40 hover:ring-titos-gold/70 bg-gradient-to-r from-titos-gold/10 via-titos-gold/5 to-transparent transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold cursor-pointer min-h-[56px]"
      aria-label="Open playoff bracket"
    >
      <div className="px-4 sm:px-5 py-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-titos-gold/20 text-titos-gold flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-base sm:text-lg font-black text-titos-white leading-tight">
              {headline}
            </span>
            {hasLive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-status-live bg-status-live/10 px-1.5 py-0.5 rounded ring-1 ring-status-live/30">
                <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" aria-hidden="true" />
                Live
              </span>
            )}
          </div>
          <p className="text-titos-gray-300 text-xs sm:text-sm mt-0.5 truncate">{sub}</p>
        </div>
        <ArrowRight
          className="w-5 h-5 text-titos-gold flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}
