'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Users, Trophy, ArrowUp, ArrowDown, Minus, MapPin } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { cn, formatDate, getTierColor, getDivisionInfo, getMovementIcon, getTeamAbbreviation, getLeagueTimeDisplay } from '@/lib/utils'

export default function LeagueDetailClient({ data }) {
  const { league, season, standings, weeks } = data
  const [tab, setTab] = useState('standings')

  if (!season) {
    return (
      <div className="py-12 px-4 max-w-5xl mx-auto text-center">
        <h1 className="font-display text-3xl font-bold text-titos-white mb-4">{league.name}</h1>
        <p className="text-titos-gray-400">No active season. Check back soon!</p>
      </div>
    )
  }

  const tabs = [
    { id: 'standings', label: 'Standings' },
    { id: 'thisweek', label: 'This Week' },
    { id: 'teams', label: 'Teams' },
    { id: 'schedule', label: 'Schedule' },
  ]

  const currentWeek = weeks.find(w => w.status === 'upcoming') || weeks.find(w => w.status === 'active') || weeks[weeks.length - 1]
  const completedWeeks = weeks.filter(w => w.status === 'completed')
  const lastCompletedWeek = completedWeeks[completedWeeks.length - 1]

  const leagueType = (league.slug && (league.slug.includes('sunday') || league.slug.includes('mens'))) ? 'mens' : 'coed'
  const timeDisplay = getLeagueTimeDisplay(league.slug)

  // Time slot labels vary by league type
  const isMens = leagueType === 'mens'
  const singleSlotLabel = '9:00 PM – 12:00 AM'
  const earlySlotLabel = '8:00 PM – 10:00 PM'
  const lateSlotLabel = '10:00 PM – 12:00 AM'
  const numRounds = isMens ? 3 : 2

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-titos-gray-400 text-sm mb-2">
            <Link href="/leagues" className="hover:text-titos-gold transition-colors">Leagues</Link>
            <span>/</span>
            <span className="text-titos-gray-200">{league.name}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-titos-white">{league.name}</h1>
              <p className="text-titos-gold font-semibold mt-1">{season.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={season.status} />
              <span className="text-titos-gray-400 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {league.dayOfWeek}s &middot; {timeDisplay}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Teams', value: season.teams.length },
              { label: 'Weeks Played', value: completedWeeks.length },
              { label: 'Total Weeks', value: season.totalWeeks },
              { label: 'Matches', value: completedWeeks.reduce((sum, w) => sum + w.matches.length, 0) },
            ].map(s => (
              <div key={s.label} className="card rounded-lg p-3 text-center">
                <div className="font-display text-xl font-bold text-titos-gold">{s.value}</div>
                <div className="text-titos-gray-400 text-xs uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors',
                tab === t.id
                  ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30'
                  : 'bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Standings Tab */}
        {tab === 'standings' && (
          <div className="card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-titos-border bg-titos-gold/5">
              <h3 className="font-display font-bold text-titos-gold">Overall Season Standings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-titos-border/50">
                    {['#', 'Team', 'SW', 'SL', '+/-', 'PTS', 'Division'].map(h => (
                      <th key={h} className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-titos-gray-400 ${h === 'Team' ? 'text-left' : 'text-center'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team) => {
                    const div = getDivisionInfo(team.rank, standings.length, leagueType)
                    return (
                      <tr key={team.id} className={`border-b border-titos-border/30 hover:bg-titos-card/50 transition-colors ${div.bgClass}`}>
                        <td className="px-3 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                            team.rank <= 3 ? 'bg-titos-gold/20 text-titos-gold' : 'text-titos-gray-400'
                          )}>{team.rank}</span>
                        </td>
                        <td className="px-3 py-3 text-left font-semibold text-titos-white">{team.name}</td>
                        <td className="px-3 py-3 text-center font-semibold text-status-success">{team.setsWon}</td>
                        <td className="px-3 py-3 text-center font-semibold text-status-live">{team.setsLost}</td>
                        <td className={`px-3 py-3 text-center font-bold ${team.pointDiff >= 0 ? 'text-status-success' : 'text-status-live'}`}>
                          {team.pointDiff > 0 ? '+' : ''}{team.pointDiff}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-titos-white">{team.totalPoints}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold text-${div.color}`}>{div.name}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* This Week Tab */}
        {tab === 'thisweek' && (
          <div>
            {currentWeek ? (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="font-display text-xl font-black text-titos-white">
                    Week {currentWeek.weekNumber}
                  </h3>
                  <span className="text-titos-gray-400 text-sm">{formatDate(currentWeek.date)}</span>
                  <StatusBadge status={currentWeek.status} />
                </div>

                {/* Group by time slot */}
                {(() => {
                  const targetWeek = currentWeek.status === 'upcoming' ? currentWeek : lastCompletedWeek
                  if (!targetWeek) return <p className="text-titos-gray-400">No data available yet.</p>

                  const tierGroups = {}
                  for (const p of targetWeek.tierPlacements) {
                    const tn = p.tier.tierNumber
                    if (!tierGroups[tn]) tierGroups[tn] = { tier: p.tier, teams: [], matches: [] }
                    tierGroups[tn].teams.push({ ...p.team, finishPosition: p.finishPosition, movement: p.movement })
                  }
                  for (const m of targetWeek.matches) {
                    if (tierGroups[m.tierNumber]) tierGroups[m.tierNumber].matches.push(m)
                  }

                  const tiers = Object.values(tierGroups).sort((a, b) => a.tier.tierNumber - b.tier.tierNumber)
                  const singleTiers = tiers.filter(t => t.tier.timeSlot === 'single')
                  const earlyTiers = tiers.filter(t => t.tier.timeSlot === 'early')
                  const lateTiers = tiers.filter(t => t.tier.timeSlot === 'late')

                  const renderTierBlock = ({ tier, teams, matches }) => {
                    const tc = getTierColor(tier.tierNumber)
                    const sortedTeams = [...teams].sort((a, b) => (a.finishPosition || 99) - (b.finishPosition || 99))

                    // Build abbreviation map
                    const abbrevMap = {}
                    for (const t of sortedTeams) {
                      abbrevMap[t.id] = getTeamAbbreviation(t.name)
                    }

                    // Build round-robin schedule from 3 teams: A, B, C
                    // Pattern per round: A vs B (Ref: C), C vs A (Ref: B), B vs C (Ref: A)
                    // COED = 2 rounds (6 games), MENS = 3 rounds (9 games)
                    const [teamA, teamB, teamC] = sortedTeams
                    const scheduleRows = teamA && teamB && teamC ? Array.from({ length: numRounds }, (_, r) => [
                      { home: teamA, away: teamB, ref: teamC, round: r + 1, game: r * 3 + 1 },
                      { home: teamC, away: teamA, ref: teamB, round: r + 1, game: r * 3 + 2 },
                      { home: teamB, away: teamC, ref: teamA, round: r + 1, game: r * 3 + 3 },
                    ]).flat() : []

                    // Find matching actual match for a schedule row
                    const findMatch = (homeId, awayId, round) => {
                      return matches.find(m =>
                        m.homeTeam.id === homeId && m.awayTeam.id === awayId && m.roundNumber === round
                      )
                    }

                    return (
                      <div key={tier.tierNumber} className="card-flat rounded-2xl overflow-hidden">
                        {/* Tier header */}
                        <div className={`px-5 py-3 flex items-center justify-between ${tc.bg}`} style={{ borderLeft: `3px solid var(--color-${tc.accent})` }}>
                          <div className="flex items-center gap-3">
                            <span className={`font-display text-lg font-black ${tc.text}`}>Tier {tier.tierNumber}</span>
                            <span className="text-titos-gray-400 text-xs font-medium">(Court {tier.courtNumber})</span>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex flex-col lg:flex-row gap-4">
                            {/* Left: Team roster */}
                            <div className="lg:w-1/3 space-y-1.5">
                              <span className="text-titos-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-2">Teams</span>
                              {sortedTeams.map((t, idx) => (
                                <div
                                  key={t.id}
                                  className={cn(
                                    'flex items-center justify-between px-3 py-2 rounded-lg',
                                    idx === 0 ? 'bg-titos-gold/[0.07] border border-titos-gold/20' :
                                    idx === 2 ? 'bg-status-live/[0.05] border border-status-live/15' :
                                    'bg-titos-elevated border border-titos-border/50'
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={cn(
                                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0',
                                      idx === 0 ? 'bg-titos-gold/20 text-titos-gold' :
                                      idx === 2 ? 'bg-status-live/15 text-status-live' :
                                      'bg-titos-charcoal text-titos-gray-400'
                                    )}>
                                      {abbrevMap[t.id]}
                                    </span>
                                    <span className="text-titos-white font-semibold text-sm truncate">{t.name}</span>
                                  </div>
                                  {t.movement && (
                                    <span className={cn(
                                      'text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0',
                                      t.movement === 'up' ? 'text-status-success bg-status-success/10' :
                                      t.movement === 'down' ? 'text-status-live bg-status-live/10' :
                                      'text-titos-gray-500'
                                    )}>
                                      {t.movement === 'up' ? '^ UP' : t.movement === 'down' ? 'v DN' : '-- ST'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Right: Game schedule table */}
                            <div className="lg:w-2/3">
                              <span className="text-titos-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-2">Schedule</span>
                              <div className="bg-titos-elevated rounded-xl border border-titos-border/50 overflow-hidden">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-titos-border/30">
                                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 text-left">Game</th>
                                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 text-left">Match</th>
                                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 text-center">Ref</th>
                                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 text-center">Score</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {scheduleRows.map((row, idx) => {
                                      const actualMatch = findMatch(row.home.id, row.away.id, row.round)
                                      const isNewRound = idx > 0 && idx % 3 === 0

                                      return (
                                        <tr key={idx} className={cn(
                                          'border-b border-titos-border/20 last:border-b-0',
                                          isNewRound && 'border-t-2 border-t-titos-border/40'
                                        )}>
                                          <td className="px-3 py-2 text-xs text-titos-gray-500 font-medium">{idx + 1}</td>
                                          <td className="px-3 py-2 text-sm">
                                            <span className="text-titos-white font-semibold">{abbrevMap[row.home.id]}</span>
                                            <span className="text-titos-gray-500 mx-1.5">vs</span>
                                            <span className="text-titos-white font-semibold">{abbrevMap[row.away.id]}</span>
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span className="text-titos-gray-400 text-xs">{abbrevMap[row.ref.id]}</span>
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            {actualMatch && actualMatch.scores && actualMatch.scores.length > 0 ? (
                                              <div className="flex items-center justify-center gap-2">
                                                {actualMatch.scores.map(s => (
                                                  <span key={s.setNumber} className="text-xs">
                                                    <span className={s.homeScore > s.awayScore ? 'text-titos-gold font-bold' : 'text-titos-gray-400'}>{s.homeScore}</span>
                                                    <span className="text-titos-gray-600">-</span>
                                                    <span className={s.awayScore > s.homeScore ? 'text-titos-gold font-bold' : 'text-titos-gray-400'}>{s.awayScore}</span>
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-titos-gray-600 text-xs">--</span>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-8">
                      {/* MENS single slot */}
                      {singleTiers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.15em]">All Courts</span>
                            <span className="text-titos-gray-500 text-xs">{singleSlotLabel}</span>
                            <div className="flex-1 h-px bg-titos-border/50" />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {singleTiers.map(renderTierBlock)}
                          </div>
                        </div>
                      )}

                      {/* COED early/late slots */}
                      {earlyTiers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.15em]">Early Slot</span>
                            <span className="text-titos-gray-500 text-xs">{earlySlotLabel}</span>
                            <div className="flex-1 h-px bg-titos-border/50" />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {earlyTiers.map(renderTierBlock)}
                          </div>
                        </div>
                      )}

                      {lateTiers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.15em]">Late Slot</span>
                            <span className="text-titos-gray-500 text-xs">{lateSlotLabel}</span>
                            <div className="flex-1 h-px bg-titos-border/50" />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {lateTiers.map(renderTierBlock)}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <p className="text-titos-gray-400">No week data available.</p>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {tab === 'teams' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {season.teams.map((team, i) => {
              const standing = standings.find(s => s.id === team.id)
              return (
                <div key={team.id} className="card rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-titos-gold/10 flex items-center justify-center">
                      <span className="font-display font-bold text-titos-gold">{team.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-titos-white text-sm">{team.name}</h4>
                      <p className="text-titos-gray-400 text-xs">
                        {standing ? `${standing.setsWon}W - ${standing.setsLost}L • ${standing.totalPoints} pts` : 'No results yet'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Schedule Tab */}
        {tab === 'schedule' && (
          <div className="space-y-3">
            {weeks.map(week => (
              <div key={week.id} className="card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      week.isPlayoff ? 'bg-titos-gold/20 text-titos-gold' : 'bg-titos-card text-titos-gray-300'
                    )}>
                      {week.weekNumber}
                    </span>
                    <div>
                      <span className="text-titos-white text-sm font-medium">
                        {week.isPlayoff ? 'Playoffs' : week.weekNumber === 1 ? 'Placement Week' : `Week ${week.weekNumber}`}
                      </span>
                      <span className="text-titos-gray-400 text-sm ml-2">{formatDate(week.date)}</span>
                    </div>
                  </div>
                  <StatusBadge status={week.status} />
                </div>
                {week.status === 'completed' && (
                  <p className="text-titos-gray-400 text-xs mt-2 ml-11">
                    {week.matches.length} matches played
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
