'use client'

import { useState } from 'react'
import { Trophy, Medal, Crown, Swords, ArrowRight } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import { cn, getPoolColor } from '@/lib/utils'

function BracketMatchup({ match, large = false }) {
  const homeWon = match.status === 'completed' && (match.homeScore ?? 0) > (match.awayScore ?? 0)
  const awayWon = match.status === 'completed' && (match.awayScore ?? 0) > (match.homeScore ?? 0)

  return (
    <div className={cn('glass rounded-lg overflow-hidden flex-shrink-0', large ? 'w-64' : 'w-56')}>
      <div className={cn(
        'flex items-center justify-between px-3 py-2.5 border-b border-court-800/30',
        homeWon && 'bg-amber-400/10'
      )}>
        <span className={cn(
          'text-sm font-medium truncate mr-2',
          homeWon ? 'text-amber-400 font-bold' : match.home ? 'text-white' : 'text-court-600 italic'
        )}>
          {match.home || 'TBD'}
        </span>
        {match.status !== 'scheduled' && (
          <span className={cn('text-sm font-bold font-display', homeWon ? 'text-amber-400' : 'text-court-400')}>
            {match.homeScore ?? 0}
          </span>
        )}
      </div>
      <div className={cn(
        'flex items-center justify-between px-3 py-2.5',
        awayWon && 'bg-amber-400/10'
      )}>
        <span className={cn(
          'text-sm font-medium truncate mr-2',
          awayWon ? 'text-amber-400 font-bold' : match.away ? 'text-white' : 'text-court-600 italic'
        )}>
          {match.away || 'TBD'}
        </span>
        {match.status !== 'scheduled' && (
          <span className={cn('text-sm font-bold font-display', awayWon ? 'text-amber-400' : 'text-court-400')}>
            {match.awayScore ?? 0}
          </span>
        )}
      </div>
    </div>
  )
}

function BracketConnector() {
  return (
    <div className="flex items-center px-2">
      <div className="w-6 border-t-2 border-court-700/50" />
      <ArrowRight className="w-3 h-3 text-court-600" />
    </div>
  )
}

function DivisionBracket({ title, icon: Icon, color, matches, accentClass }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Icon className={`w-10 h-10 mx-auto mb-3 ${accentClass}`} />
        <h3 className={`font-display text-xl font-bold mb-2 ${accentClass}`}>{title}</h3>
        <p className="text-court-400 text-sm">
          Bracket will be generated after pool play is complete.
        </p>
      </div>
    )
  }

  // Group by round
  const rounds = {}
  matches.forEach(m => {
    const r = m.bracketRound || 1
    if (!rounds[r]) rounds[r] = []
    rounds[r].push(m)
  })

  const roundLabels = { 1: 'Quarterfinals', 2: 'Semifinals', 3: 'Final' }

  return (
    <div className="glass rounded-xl p-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <Icon className={`w-6 h-6 ${accentClass}`} />
        <h3 className={`font-display text-xl font-bold ${accentClass}`}>{title}</h3>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-6 min-w-fit items-center">
          {Object.entries(rounds).map(([round, rMatches]) => (
            <div key={round} className="flex items-center gap-2">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-court-500 text-center mb-1">
                  {roundLabels[round] || `Round ${round}`}
                </span>
                {rMatches.map((m, i) => (
                  <BracketMatchup key={i} match={m} large={parseInt(round) === 3} />
                ))}
              </div>
              {parseInt(round) < Math.max(...Object.keys(rounds).map(Number)) && <BracketConnector />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TournamentClient({ pools, playoffMatches }) {
  const [tab, setTab] = useState('bracket')

  // Generate projected bracket from pool standings
  const goldSeeds = []
  const silverSeeds = []

  pools.forEach(pool => {
    if (pool.teams.length >= 1) goldSeeds.push({ name: pool.teams[0]?.name, pool: pool.poolName, seed: 1 })
    if (pool.teams.length >= 2) goldSeeds.push({ name: pool.teams[1]?.name, pool: pool.poolName, seed: 2 })
    if (pool.teams.length >= 3) silverSeeds.push({ name: pool.teams[2]?.name, pool: pool.poolName, seed: 3 })
    if (pool.teams.length >= 4) silverSeeds.push({ name: pool.teams[3]?.name, pool: pool.poolName, seed: 4 })
  })

  // Build projected QF matchups: A1 vs D2, B1 vs C2, C1 vs B2, D1 vs A2
  const goldQF = goldSeeds.length >= 8 ? [
    { home: goldSeeds[0]?.name, away: goldSeeds[7]?.name, status: 'scheduled' },
    { home: goldSeeds[2]?.name, away: goldSeeds[5]?.name, status: 'scheduled' },
    { home: goldSeeds[4]?.name, away: goldSeeds[3]?.name, status: 'scheduled' },
    { home: goldSeeds[6]?.name, away: goldSeeds[1]?.name, status: 'scheduled' },
  ] : []

  const silverQF = silverSeeds.length >= 8 ? [
    { home: silverSeeds[0]?.name, away: silverSeeds[7]?.name, status: 'scheduled' },
    { home: silverSeeds[2]?.name, away: silverSeeds[5]?.name, status: 'scheduled' },
    { home: silverSeeds[4]?.name, away: silverSeeds[3]?.name, status: 'scheduled' },
    { home: silverSeeds[6]?.name, away: silverSeeds[1]?.name, status: 'scheduled' },
  ] : []

  const goldSF = [
    { home: null, away: null, status: 'scheduled' },
    { home: null, away: null, status: 'scheduled' },
  ]

  const goldFinal = [{ home: null, away: null, status: 'scheduled' }]
  const silverSF = [
    { home: null, away: null, status: 'scheduled' },
    { home: null, away: null, status: 'scheduled' },
  ]
  const silverFinal = [{ home: null, away: null, status: 'scheduled' }]

  // If there are actual playoff matches, use those instead
  const hasPlayoffs = playoffMatches.length > 0
  const goldMatches = hasPlayoffs
    ? playoffMatches.filter(m => m.matchType === 'gold_playoff').map(m => ({
        home: m.homeTeam.name,
        away: m.awayTeam.name,
        homeScore: m.scores.reduce((acc, s) => acc + (s.homeScore > s.awayScore ? 1 : 0), 0),
        awayScore: m.scores.reduce((acc, s) => acc + (s.awayScore > s.homeScore ? 1 : 0), 0),
        status: m.status,
        bracketRound: m.bracketRound,
      }))
    : null

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          label="Playoffs"
          title="Tournament Bracket"
          description="Single-elimination playoffs with Gold and Silver divisions."
        />

        {/* Tab toggle */}
        <div className="flex items-center justify-center gap-2 mt-8 mb-10">
          <button
            onClick={() => setTab('bracket')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'bracket'
                ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                : 'bg-court-800/50 text-court-300 border border-court-700/30 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4 inline mr-1.5" />
            Brackets
          </button>
          <button
            onClick={() => setTab('seeding')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'seeding'
                ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                : 'bg-court-800/50 text-court-300 border border-court-700/30 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1.5" />
            Seeding
          </button>
        </div>

        {tab === 'bracket' && (
          <div className="space-y-10">
            {/* Gold Division */}
            <div>
              <div className="glass rounded-xl p-6 lg:p-8 overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 rounded-xl bg-amber-400/10">
                    <Crown className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-amber-400">Gold Division</h3>
                    <p className="text-court-400 text-sm">Top 2 finishers from each pool</p>
                  </div>
                </div>

                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-8 lg:gap-12 min-w-fit items-start">
                    {/* QF */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-court-500 text-center mb-2">Quarterfinals</span>
                      <div className="flex flex-col gap-6">
                        {goldQF.map((m, i) => <BracketMatchup key={i} match={m} />)}
                      </div>
                    </div>
                    <BracketConnector />
                    {/* SF */}
                    <div className="flex flex-col gap-2 pt-10">
                      <span className="text-xs font-bold uppercase tracking-wider text-court-500 text-center mb-2">Semifinals</span>
                      <div className="flex flex-col gap-20">
                        {goldSF.map((m, i) => <BracketMatchup key={i} match={m} />)}
                      </div>
                    </div>
                    <BracketConnector />
                    {/* Final */}
                    <div className="flex flex-col gap-2 pt-32">
                      <span className="text-xs font-bold uppercase tracking-wider text-court-500 text-center mb-2">Final</span>
                      <BracketMatchup match={goldFinal[0]} large />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Silver Division */}
            <div>
              <div className="glass rounded-xl p-6 lg:p-8 overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 rounded-xl bg-court-500/10">
                    <Medal className="w-7 h-7 text-court-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-court-300">Silver Division</h3>
                    <p className="text-court-400 text-sm">3rd and 4th place finishers from each pool</p>
                  </div>
                </div>

                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-8 lg:gap-12 min-w-fit items-start">
                    {/* QF */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-court-500 text-center mb-2">Quarterfinals</span>
                      <div className="flex flex-col gap-6">
                        {silverQF.map((m, i) => <BracketMatchup key={i} match={m} />)}
                      </div>
                    </div>
                    <BracketConnector />
                    {/* SF */}
                    <div className="flex flex-col gap-2 pt-10">
                      <span className="text-xs font-bold uppercase tracking-wider text-court-500 text-center mb-2">Semifinals</span>
                      <div className="flex flex-col gap-20">
                        {silverSF.map((m, i) => <BracketMatchup key={i} match={m} />)}
                      </div>
                    </div>
                    <BracketConnector />
                    {/* Final */}
                    <div className="flex flex-col gap-2 pt-32">
                      <span className="text-xs font-bold uppercase tracking-wider text-court-500 text-center mb-2">Final</span>
                      <BracketMatchup match={silverFinal[0]} large />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'seeding' && (
          <div className="space-y-8">
            {/* Gold seeds */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-6 h-6 text-amber-400" />
                <h3 className="font-display text-xl font-bold text-amber-400">Gold Division Seeds</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {goldSeeds.map((team, i) => {
                  const poolColor = getPoolColor(team.pool)
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-court-900/50 border border-court-800/30">
                      <span className="w-8 h-8 rounded-full bg-amber-400/15 flex items-center justify-center text-sm font-bold text-amber-400">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{team.name}</p>
                        <p className="text-court-400 text-xs">{team.pool} - #{team.seed} seed</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${poolColor.bg} ${poolColor.text}`}>
                        {team.pool}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Silver seeds */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Medal className="w-6 h-6 text-court-400" />
                <h3 className="font-display text-xl font-bold text-court-300">Silver Division Seeds</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {silverSeeds.map((team, i) => {
                  const poolColor = getPoolColor(team.pool)
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-court-900/50 border border-court-800/30">
                      <span className="w-8 h-8 rounded-full bg-court-600/20 flex items-center justify-center text-sm font-bold text-court-400">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{team.name}</p>
                        <p className="text-court-400 text-xs">{team.pool} - #{team.seed} seed</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${poolColor.bg} ${poolColor.text}`}>
                        {team.pool}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Format explanation */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-display text-lg font-bold text-white mb-3">Playoff Format</h3>
              <ul className="space-y-2 text-court-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">1.</span>
                  Top 2 teams from each pool enter the Gold Division bracket (8 teams total)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">2.</span>
                  Bottom 2 teams from each pool enter the Silver Division bracket (8 teams total)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">3.</span>
                  Crossover seeding: Pool A #1 vs Pool D #2, Pool B #1 vs Pool C #2, etc.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">4.</span>
                  Single elimination: lose and you&apos;re out. Win to advance.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">5.</span>
                  Best of 3 sets per match. Sets to 25 (cap 27), deciding set to 15.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
