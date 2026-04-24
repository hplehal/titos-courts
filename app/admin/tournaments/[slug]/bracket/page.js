'use client'

import { useCallback, useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, Trophy, Medal } from 'lucide-react'
import AuthGate from '@/components/admin/AuthGate'
import ScoreEntry from '@/components/tournament/ScoreEntry'
import BracketMatchMeta from '@/components/tournament/BracketMatchMeta'
import { BRACKET_ROUND } from '@/lib/tournament/constants'
import { cleanTeamName } from '@/lib/tournament/displayName'

// Small identity strip at the top of each match card. Admins kept asking
// "which match am I editing?" because court/ref controls floated above a
// collapsed score card with no shared framing — now the teams + status sit
// at the very top so the whole block reads as one match.
function MatchIdentity({ match }) {
  const home = cleanTeamName(match.homeTeam?.name) || match.homeSeedLabel || 'TBD'
  const away = cleanTeamName(match.awayTeam?.name) || match.awaySeedLabel || 'TBD'
  const statusTone =
    match.status === 'live' ? 'text-status-live'
    : match.status === 'completed' ? 'text-status-success'
    : 'text-titos-gray-500'
  const statusLabel =
    match.status === 'live' ? 'Live'
    : match.status === 'completed' ? 'Final'
    : 'Scheduled'
  return (
    <div className="px-3 py-2 bg-titos-elevated/40 border-b border-titos-border/40 flex items-center gap-3 flex-wrap">
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${statusTone}`}>
        {match.status === 'live' && (
          <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" aria-hidden="true" />
        )}
        {statusLabel}
      </span>
      <span className="text-sm font-semibold text-titos-white truncate flex-1 min-w-0">
        {home}
        <span className="text-titos-gray-600 mx-1.5">vs</span>
        {away}
      </span>
    </div>
  )
}

const ROUND_LABELS = {
  [BRACKET_ROUND.QUARTERFINAL]: 'Quarterfinals',
  [BRACKET_ROUND.SEMIFINAL]: 'Semifinals',
  [BRACKET_ROUND.FINAL]: 'Final',
}

function Inner({ slug }) {
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${slug}`)
      if (res.ok) setTournament(await res.json())
    } catch { /* non-fatal */ }
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
  if (!tournament) return <p className="p-8 text-titos-gray-400">Tournament not found.</p>

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/admin/tournaments/${slug}`} aria-label="Back to tournament admin" className="text-titos-gray-400 hover:text-titos-gold shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display text-lg sm:text-xl font-black text-titos-white truncate">
              <span className="text-titos-gray-400 font-normal">Bracket Scores · </span>{tournament.name}
            </h1>
          </div>
          <button onClick={load} aria-label="Refresh" className="inline-flex items-center justify-center text-titos-gray-400 hover:text-titos-white p-2 min-h-[40px] min-w-[40px]"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {(!tournament.brackets || tournament.brackets.length === 0) && (
          <p className="text-titos-gray-500">No brackets generated yet.</p>
        )}

        <div className="space-y-6">
          {tournament.brackets?.map(bracket => {
            const byRound = {}
            for (const m of bracket.matches) {
              const r = m.bracketRound || 1
              if (!byRound[r]) byRound[r] = []
              byRound[r].push(m)
            }
            return (
              <section key={bracket.id} className="card-flat rounded-xl overflow-hidden">
                <header className="px-5 py-3 border-b border-titos-border/30 bg-titos-gold/5 flex items-center gap-2">
                  {bracket.division === 'Gold' ? <Trophy className="w-4 h-4 text-titos-gold" /> : <Medal className="w-4 h-4 text-titos-gray-300" />}
                  <h2 className="font-display font-bold text-titos-gold text-sm">{bracket.division} Division</h2>
                </header>
                <div className="p-4 space-y-5">
                  {Object.entries(byRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, matches]) => (
                    <div key={round}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-titos-gray-500 mb-2">
                        {ROUND_LABELS[Number(round)] || `Round ${round}`}
                      </h3>
                      {/* 2-up at md+ so 4 QFs become 2 rows instead of 4.
                          SFs + Finals also pair up nicely when both divisions
                          are generated. Cuts page scroll roughly in half. */}
                      <div className="grid gap-3 md:grid-cols-2">
                        {matches.map(m => (
                          // Unified match card: identity strip → court/ref
                          // controls → score entry. Everything inside reads
                          // as belonging to ONE match, so there's no chance
                          // of editing the wrong row's court/ref.
                          <div
                            key={m.id}
                            className="card-flat rounded-lg overflow-hidden border border-titos-border/40"
                            data-status={m.status}
                          >
                            <MatchIdentity match={m} />
                            <BracketMatchMeta
                              match={m}
                              slug={slug}
                              tournamentTeams={tournament.tournamentTeams || []}
                              onSaved={load}
                              flush
                            />
                            <ScoreEntry
                              match={m}
                              saveUrl={`/api/admin/tournaments/${slug}/bracket-matches/${m.id}/scores`}
                              onSaved={load}
                              flush
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AdminBracketPage({ params }) {
  const { slug } = use(params)
  return <AuthGate><Inner slug={slug} /></AuthGate>
}
