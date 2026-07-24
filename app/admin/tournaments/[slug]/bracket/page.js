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
  const homeWon = match.status === 'completed' && match.winnerId && match.winnerId === match.homeTeamId
  const awayWon = match.status === 'completed' && match.winnerId && match.winnerId === match.awayTeamId
  const pill =
    match.status === 'live' ? 'bg-status-live/15 text-status-live border-status-live/30'
    : match.status === 'completed' ? 'bg-status-success/15 text-status-success border-status-success/30'
    : 'bg-titos-charcoal/60 text-titos-gray-400 border-titos-border/50'
  const statusLabel =
    match.status === 'live' ? 'Live'
    : match.status === 'completed' ? 'Final'
    : 'Scheduled'
  const time = match.scheduledTime
    ? new Date(match.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null
  return (
    <div className="px-3 py-2.5 bg-titos-elevated/60 border-b border-titos-border/40 flex items-center gap-2.5 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${pill}`}>
        {match.status === 'live' && (
          <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" aria-hidden="true" />
        )}
        {statusLabel}
      </span>
      <span className="text-[15px] font-bold truncate flex-1 min-w-0">
        <span className={homeWon ? 'text-status-success' : 'text-titos-white'}>{home}</span>
        <span className="text-titos-gray-600 mx-1.5 font-normal text-xs">vs</span>
        <span className={awayWon ? 'text-status-success' : 'text-titos-white'}>{away}</span>
      </span>
      {(time || match.courtNumber) && (
        <span className="text-[11px] text-titos-gray-400 tabular-nums shrink-0">
          {time}{time && match.courtNumber ? ' · ' : ''}{match.courtNumber ? `Court ${match.courtNumber}` : ''}
        </span>
      )}
    </div>
  )
}

const ROUND_LABELS = {
  [BRACKET_ROUND.QUARTERFINAL]: 'Quarterfinals',
  [BRACKET_ROUND.SEMIFINAL]: 'Semifinals',
  [BRACKET_ROUND.FINAL]: 'Final',
}

// Special "round" key used to group play-in matches. They have
// bracketRound=null in the DB (they sit BEFORE the bracket numbering),
// so the grouping logic uses this sentinel to surface them first.
const PLAYIN_ROUND_KEY = 0
const ROUND_LABEL_FOR = (k) => k === PLAYIN_ROUND_KEY ? 'Play-In' : (ROUND_LABELS[k] || `Round ${k}`)

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
            // Group matches by stage/round. Play-in matches (stage='play-in',
            // bracketRound=null) get the sentinel key 0 so they sort BEFORE
            // QF (1), SF (2), F (3). Legacy matches without a stage field
            // fall through to bracketRound-based grouping unchanged.
            const byRound = {}
            for (const m of bracket.matches) {
              const isPlayIn = m.stage === 'play-in'
              const r = isPlayIn ? PLAYIN_ROUND_KEY : (m.bracketRound || 1)
              if (!byRound[r]) byRound[r] = []
              byRound[r].push(m)
            }
            // For crossover format the single bracket is named 'Open' — no
            // gold/silver distinction. Show a less loud header in that case.
            const isOpenBracket = bracket.division === 'Open'
            return (
              <section key={bracket.id} className="card-flat rounded-xl overflow-hidden">
                <header className={`px-5 py-3 border-b border-titos-border/30 flex items-center gap-2 ${bracket.division === 'Silver' ? 'bg-titos-gray-400/5' : 'bg-titos-gold/5'}`}>
                  {bracket.division === 'Gold' || isOpenBracket
                    ? <Trophy className="w-4 h-4 text-titos-gold" />
                    : <Medal className="w-4 h-4 text-titos-gray-300" />}
                  <h2 className={`font-display font-bold text-sm ${bracket.division === 'Silver' ? 'text-titos-gray-200' : 'text-titos-gold'}`}>
                    {isOpenBracket ? 'Playoffs' : `${bracket.division} Division`}
                  </h2>
                </header>
                <div className="p-4 space-y-5">
                  {Object.entries(byRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, matches]) => (
                    <div key={round}>
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-titos-gray-300 mb-2.5">
                        <span className="w-1 h-3.5 rounded-full bg-titos-gold/70" aria-hidden="true" />
                        {ROUND_LABEL_FOR(Number(round))}
                        <span className="text-titos-gray-600 normal-case font-semibold tracking-normal">· {matches.length} match{matches.length === 1 ? '' : 'es'}</span>
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
                            className={`card-flat rounded-lg overflow-hidden border ${m.status === 'live' ? 'border-status-live/40 ring-1 ring-status-live/20' : m.status === 'completed' ? 'border-status-success/25' : 'border-titos-border/40'}`}
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
