'use client'

import { useState, useEffect } from 'react'
import { Radio, Clock, CheckCircle2, RefreshCw, Wifi } from 'lucide-react'

export default function LiveClient() {
  const [data, setData] = useState({ active: [], recent: [] })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/live')
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch live data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="py-8 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {data.active.length > 0 ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-status-live/15 border border-status-live/30 rounded-full">
                <span className="live-dot" />
                <span className="text-status-live font-bold text-sm uppercase tracking-wider">Live Now</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-titos-card border border-titos-border rounded-full">
                <Wifi className="w-4 h-4 text-titos-gray-400" />
                <span className="text-titos-gray-400 font-semibold text-sm">Monitoring</span>
              </span>
            )}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold text-titos-white mb-2">Live Scores</h1>
          <p className="text-titos-gray-400 text-sm">
            Auto-refreshes every 15 seconds
            {lastUpdated && <span> &middot; {lastUpdated.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card rounded-xl p-6 animate-pulse"><div className="h-10 bg-titos-charcoal rounded" /></div>)}</div>
        ) : (
          <div className="space-y-8">
            {data.active.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-status-live mb-4">
                  <Radio className="w-5 h-5" /> In Progress
                </h2>
                <div className="space-y-4">
                  {data.active.map(match => <LiveMatchCard key={match.id} match={match} isLive />)}
                </div>
              </section>
            )}

            {data.recent.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-status-success mb-4">
                  <CheckCircle2 className="w-5 h-5" /> Recent Results
                </h2>
                <div className="space-y-3">
                  {data.recent.map(match => <LiveMatchCard key={match.id} match={match} />)}
                </div>
              </section>
            )}

            {data.active.length === 0 && data.recent.length === 0 && (
              <div className="text-center py-20">
                <RefreshCw className="w-12 h-12 text-titos-gray-500 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-titos-gray-300 mb-2">No Active Matches</h3>
                <p className="text-titos-gray-400 max-w-md mx-auto">
                  No matches are being played right now. This page will automatically update when games begin.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LiveMatchCard({ match, isLive = false }) {
  let homeSetWins = 0, awaySetWins = 0
  for (const s of (match.scores || [])) {
    if (s.homeScore > s.awayScore) homeSetWins++
    else awaySetWins++
  }
  const homeWon = match.status === 'completed' && homeSetWins > awaySetWins
  const awayWon = match.status === 'completed' && awaySetWins > homeSetWins

  return (
    <div className={`card rounded-xl p-5 sm:p-6 ${isLive ? 'border-status-live/30 shadow-lg shadow-status-live/5' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {match.tierNumber && <span className="text-titos-gray-500 text-xs">Tier {match.tierNumber}</span>}
          {match.courtNumber && <span className="text-titos-gray-500 text-xs">&middot; Court {match.courtNumber}</span>}
        </div>
        {isLive && <span className="flex items-center gap-1.5 text-status-live text-xs font-bold uppercase"><span className="live-dot" /> Live</span>}
        {match.status === 'completed' && <span className="text-status-success text-xs font-bold uppercase">Final</span>}
      </div>

      <div className="flex items-center">
        <div className="flex-1 text-right pr-4">
          <p className={`font-display text-lg sm:text-2xl font-bold ${homeWon ? 'text-titos-gold' : 'text-titos-white'}`}>
            {match.homeTeam?.name || 'TBD'}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3 px-4">
          <span className={`font-display text-3xl sm:text-4xl font-bold ${homeWon ? 'text-titos-gold' : 'text-titos-gray-300'}`}>{homeSetWins}</span>
          <span className="text-titos-gray-500 text-lg">:</span>
          <span className={`font-display text-3xl sm:text-4xl font-bold ${awayWon ? 'text-titos-gold' : 'text-titos-gray-300'}`}>{awaySetWins}</span>
        </div>
        <div className="flex-1 pl-4">
          <p className={`font-display text-lg sm:text-2xl font-bold ${awayWon ? 'text-titos-gold' : 'text-titos-white'}`}>
            {match.awayTeam?.name || 'TBD'}
          </p>
        </div>
      </div>

      {match.scores?.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-titos-border/30">
          {match.scores.map(s => (
            <span key={s.setNumber || s.id} className="text-sm text-titos-gray-400">
              <span className="text-titos-gray-500 text-xs mr-1">S{s.setNumber}</span>
              <span className={s.homeScore > s.awayScore ? 'text-titos-gold font-semibold' : ''}>{s.homeScore}</span>
              <span className="text-titos-gray-500">-</span>
              <span className={s.awayScore > s.homeScore ? 'text-titos-gold font-semibold' : ''}>{s.awayScore}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
