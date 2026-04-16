'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { Calendar, Users, Trophy, ArrowUp, ArrowDown, ArrowRight, Minus, MapPin } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { cn, formatDate, getTierColor, getSlotInfo, getDivisionInfo, getMovementIcon, getTeamAbbreviation, getLeagueTimeDisplay } from '@/lib/utils'

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
    { id: 'schedule', label: 'Schedule' },
    { id: 'teams', label: 'Teams' },
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
            <div className="px-5 py-3 border-b border-titos-border bg-titos-gold/5 flex items-center justify-between">
              <h3 className="font-display font-bold text-titos-gold">Overall Season Standings</h3>
              <span className="text-titos-gray-400 text-[11px] uppercase tracking-wider">PTS = Tier Factor + Sets Won</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-titos-border/50">
                    {['#', 'Team', 'SW', 'SL', '+/-', 'Tier', 'Sets', 'PTS', 'Div'].map(h => (
                      <th key={h} className={`px-2.5 py-3 text-[11px] font-semibold uppercase tracking-wider text-titos-gray-400 ${h === 'Team' ? 'text-left' : 'text-center'}`}>
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
                        <td className="px-2.5 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                            team.rank <= 3 ? 'bg-titos-gold/20 text-titos-gold' : 'text-titos-gray-400'
                          )}>{team.rank}</span>
                        </td>
                        <td className="px-2.5 py-3 text-left font-semibold text-titos-white text-sm">{team.name}</td>
                        <td className="px-2.5 py-3 text-center font-semibold text-status-success text-sm">{team.setsWon}</td>
                        <td className="px-2.5 py-3 text-center font-semibold text-status-live text-sm">{team.setsLost}</td>
                        <td className={`px-2.5 py-3 text-center font-bold text-sm ${team.pointDiff >= 0 ? 'text-status-success' : 'text-status-live'}`}>
                          {team.pointDiff > 0 ? '+' : ''}{team.pointDiff}
                        </td>
                        <td className="px-2.5 py-3 text-center text-titos-gray-400 text-sm">{team.basePoints || 0}</td>
                        <td className="px-2.5 py-3 text-center text-titos-gray-400 text-sm">{team.setsWon}</td>
                        <td className="px-2.5 py-3 text-center font-black text-titos-gold text-sm">{team.totalPoints}</td>
                        <td className="px-2.5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold text-${div.color}`}>{div.name}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results link */}
        {tab === 'standings' && completedWeeks.length > 0 && (
          <div className="mb-6">
            <Link
              href="/results"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-titos-gold/10 text-titos-gold text-sm font-bold hover:bg-titos-gold/15 transition-colors"
            >
              <Trophy className="w-4 h-4" />
              View Match Results & Scores
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* OLD This Week — replaced by Results tab */}
        {false && (
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
                      <div key={tier.tierNumber} className="card-flat rounded-xl overflow-hidden">
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
                              <span className="text-titos-gray-400 text-[11px] font-bold uppercase tracking-wider block mb-2">Teams</span>
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
                                      'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0',
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
                                      'text-[11px] font-black px-1.5 py-0.5 rounded flex-shrink-0',
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
                              <span className="text-titos-gray-400 text-[11px] font-bold uppercase tracking-wider block mb-2">Schedule</span>
                              <div className="bg-titos-elevated rounded-xl border border-titos-border/50 overflow-hidden">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-titos-border/30">
                                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-titos-gray-400 text-left">Game</th>
                                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-titos-gray-400 text-left">Match</th>
                                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-titos-gray-400 text-center">Ref</th>
                                      <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-titos-gray-400 text-center">Score</th>
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
                                                    <span className="text-titos-gray-500">-</span>
                                                    <span className={s.awayScore > s.homeScore ? 'text-titos-gold font-bold' : 'text-titos-gray-400'}>{s.awayScore}</span>
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-titos-gray-500 text-xs">--</span>
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
          <ScheduleTab weeks={weeks} league={league} />
        )}
      </div>
    </div>
  )
}

// ─── Schedule Tab Component ───
// ─── Results Tab Component ───
function ResultsTab({ weeks, league, completedWeeks, lastCompletedWeek, currentWeek, standings }) {
  // Build a lookup for overall rank
  const rankLookup = {}
  for (const s of (standings || [])) {
    rankLookup[s.id] = s.rank
  }
  const [selectedWeekNum, setSelectedWeekNum] = useState(lastCompletedWeek?.weekNumber || null)

  const selectedWeek = weeks.find(w => w.weekNumber === selectedWeekNum) || lastCompletedWeek
  const nextUpcoming = weeks.find(w => w.status === 'upcoming')
  const activeWeek = weeks.find(w => w.status === 'active')
  const selectableWeeks = completedWeeks.filter(w => w.weekNumber > 1)

  if (!selectedWeek && !activeWeek && !nextUpcoming) {
    return <p className="text-titos-gray-400 text-center py-8">No results available yet. Check back after Week 2.</p>
  }

  // Build tier data for selected week
  const tierGroups = {}
  if (selectedWeek) {
    for (const p of (selectedWeek.tierPlacements || [])) {
      const tn = p.tier?.tierNumber
      if (!tn) continue
      if (!tierGroups[tn]) tierGroups[tn] = { tier: p.tier, teams: [], matches: [] }
      tierGroups[tn].teams.push({ ...p.team, finishPosition: p.finishPosition, movement: p.movement })
    }
    for (const m of (selectedWeek.matches || [])) {
      if (tierGroups[m.tierNumber]) tierGroups[m.tierNumber].matches.push(m)
    }
  }
  const tiers = Object.values(tierGroups).sort((a, b) => a.tier.tierNumber - b.tier.tierNumber)

  return (
    <div>
      {/* Week selector */}
      {selectableWeeks.length > 0 && (
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <span className="text-titos-gray-400 text-xs font-bold uppercase tracking-wider flex-shrink-0">Week:</span>
          {selectableWeeks.map(w => (
            <button key={w.weekNumber} onClick={() => setSelectedWeekNum(w.weekNumber)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex-shrink-0',
                selectedWeekNum === w.weekNumber ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30' : 'bg-titos-card text-titos-gray-400 border border-titos-border hover:text-titos-white')}>
              {w.weekNumber}
            </button>
          ))}
        </div>
      )}

      {/* Selected week results — SCORES + STANDINGS TOGETHER */}
      {selectedWeek && tiers.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h3 className="font-display text-lg font-black text-titos-white">Week {selectedWeek.weekNumber} Results</h3>
            <span className="text-titos-gray-400 text-sm">{formatDate(selectedWeek.date)}</span>
          </div>

          <div className="space-y-4">
            {tiers.map(({ tier, teams, matches }) => {
              const slot = getSlotInfo(tier.tierNumber, tier.timeSlot)
              const slotVar = tier.tierNumber <= 4 ? 'slot-early' : 'slot-late'
              const sortedTeams = [...teams].sort((a, b) => (a.finishPosition || 99) - (b.finishPosition || 99))

              // Group matches by round
              const rounds = {}
              matches.forEach(m => { if (!rounds[m.roundNumber]) rounds[m.roundNumber] = []; rounds[m.roundNumber].push(m) })

              // Compute per-team stats for this week
              const teamWeekStats = {}
              for (const t of sortedTeams) {
                teamWeekStats[t.id] = { wins: 0, losses: 0, pointDiff: 0 }
              }
              for (const m of matches) {
                const score = m.scores?.[0]
                if (!score) continue
                const diff = score.homeScore - score.awayScore
                if (score.homeScore > score.awayScore) {
                  if (teamWeekStats[m.homeTeamId]) { teamWeekStats[m.homeTeamId].wins++; teamWeekStats[m.homeTeamId].pointDiff += diff }
                  if (teamWeekStats[m.awayTeamId]) { teamWeekStats[m.awayTeamId].losses++; teamWeekStats[m.awayTeamId].pointDiff -= diff }
                } else {
                  if (teamWeekStats[m.awayTeamId]) { teamWeekStats[m.awayTeamId].wins++; teamWeekStats[m.awayTeamId].pointDiff += Math.abs(diff) }
                  if (teamWeekStats[m.homeTeamId]) { teamWeekStats[m.homeTeamId].losses++; teamWeekStats[m.homeTeamId].pointDiff -= Math.abs(diff) }
                }
              }

              return (
                <div key={tier.tierNumber} className="card-flat rounded-xl overflow-hidden">
                  {/* Tier header */}
                  <div className={cn('px-5 py-3 flex items-center justify-between', slot.bg)} style={{ borderLeft: `3px solid var(--color-${slotVar})` }}>
                    <span className={cn('font-display text-base font-black', slot.color)}>Tier {tier.tierNumber}</span>
                    <span className="text-titos-gray-400 text-xs font-medium">Court {tier.courtNumber}</span>
                  </div>

                  {/* Standings table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[11px] font-bold uppercase tracking-wider text-titos-gray-400">
                          <th className="px-4 pt-3 pb-2 text-left">#</th>
                          <th className="pt-3 pb-2 text-left">Team</th>
                          <th className="pt-3 pb-2 text-center w-12">W</th>
                          <th className="pt-3 pb-2 text-center w-12">L</th>
                          <th className="pt-3 pb-2 text-center w-14">+/-</th>
                          <th className="px-4 pt-3 pb-2 text-right w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTeams.map((t, idx) => {
                          const stats = teamWeekStats[t.id] || { wins: 0, losses: 0, pointDiff: 0 }
                          return (
                            <tr key={t.id} className={cn('border-t border-titos-border/10',
                              idx === 0 ? 'bg-titos-gold/[0.05]' : idx === 2 ? 'bg-status-live/[0.03]' : ''
                            )}>
                              <td className="px-4 py-2.5">
                                <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black',
                                  idx === 0 ? 'bg-titos-gold/20 text-titos-gold' : idx === 2 ? 'bg-status-live/15 text-status-live' : 'bg-titos-charcoal text-titos-gray-400'
                                )}>{t.finishPosition || idx + 1}</span>
                              </td>
                              <td className="py-2.5 text-sm">
                                <span className="text-titos-white font-bold">{t.name}</span>
                                {rankLookup[t.id] && (
                                  <span className={cn('ml-2 text-[11px] font-black',
                                    rankLookup[t.id] <= 5 ? 'text-titos-gold' : 'text-titos-gray-500'
                                  )}>#{rankLookup[t.id]}</span>
                                )}
                              </td>
                              <td className="py-2.5 text-center text-status-success font-bold text-sm">{stats.wins}</td>
                              <td className="py-2.5 text-center text-status-live font-bold text-sm">{stats.losses}</td>
                              <td className={cn('py-2.5 text-center font-black text-sm',
                                stats.pointDiff > 0 ? 'text-status-success' : stats.pointDiff < 0 ? 'text-status-live' : 'text-titos-gray-500'
                              )}>{stats.pointDiff > 0 ? '+' : ''}{stats.pointDiff}</td>
                              <td className="px-4 py-2.5 text-right">
                                {t.movement && (
                                  <span className={cn('text-[11px] font-black',
                                    t.movement === 'up' ? 'text-status-success' : t.movement === 'down' ? 'text-status-live' : 'text-titos-gray-500')}>
                                    {t.movement === 'up' ? '▲' : t.movement === 'down' ? '▼' : '—'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Scores */}
                  {matches.length > 0 && (
                    <div className="border-t border-titos-border/15 px-4 py-2.5">
                      {matches.map((m, i) => {
                        const score = m.scores?.[0]
                        const homeWon = score && score.homeScore > score.awayScore
                        const awayWon = score && score.awayScore > score.homeScore
                        return (
                          <div key={m.id} className="grid grid-cols-[1fr_auto_1fr] items-center py-1 text-sm">
                            <span className={cn('text-right font-medium truncate pr-2', homeWon ? 'text-titos-gold' : 'text-titos-gray-300')}>{m.homeTeam?.name}</span>
                            {score ? (
                              <span className="font-mono text-center whitespace-nowrap px-1">
                                <span className={cn('font-bold', homeWon ? 'text-titos-gold' : 'text-titos-gray-500')}>{score.homeScore}</span>
                                <span className="text-titos-gray-500 mx-0.5">-</span>
                                <span className={cn('font-bold', awayWon ? 'text-titos-gold' : 'text-titos-gray-500')}>{score.awayScore}</span>
                              </span>
                            ) : <span className="text-center text-titos-gray-500">—</span>}
                            <span className={cn('text-left font-medium truncate pl-2', awayWon ? 'text-titos-gold' : 'text-titos-gray-300')}>{m.awayTeam?.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(!selectedWeek || tiers.length === 0) && !activeWeek && (
        <div className="card rounded-xl p-8 text-center">
          <p className="text-titos-gray-400">No completed results yet. Check back after Week 2.</p>
        </div>
      )}
    </div>
  )
}

function ScheduleTab({ weeks, league }) {
  const [expandedWeek, setExpandedWeek] = useState(null)
  const [teamFilter, setTeamFilter] = useState('')

  // Collect all unique team names for the filter
  const allTeams = new Set()
  for (const week of weeks) {
    for (const match of (week.matches || [])) {
      if (match.homeTeam?.name) allTeams.add(match.homeTeam.name)
      if (match.awayTeam?.name) allTeams.add(match.awayTeam.name)
    }
    for (const p of (week.tierPlacements || [])) {
      if (p.team?.name) allTeams.add(p.team.name)
    }
  }
  const teamList = [...allTeams].sort()

  // Auto-expand the active or most recent week
  const activeWeek = weeks.find(w => w.status === 'active') || weeks.find(w => w.status === 'upcoming')
  if (expandedWeek === null && activeWeek) {
    // Use a ref-free approach: just set on first render logic
  }

  const isMens = league.slug?.includes('sunday') || league.slug?.includes('mens')
  const timeDisplay = isMens ? '9 PM – 12 AM' : '8 PM – 12 AM'

  return (
    <div>
      {/* Team filter */}
      <div className="mb-6">
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-4 py-2.5 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50 min-w-[200px]"
        >
          <option value="">All Teams</option>
          {teamList.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Week list */}
      <div className="space-y-3">
        {weeks.map(week => {
          const isExpanded = expandedWeek === week.id
          const hasMatches = (week.matches?.length || 0) > 0

          // Group matches by tier
          const tierGroups = {}
          for (const p of (week.tierPlacements || [])) {
            const tn = p.tier?.tierNumber
            if (!tn) continue
            if (!tierGroups[tn]) tierGroups[tn] = { tier: p.tier, teams: [], matches: [] }
            tierGroups[tn].teams.push(p.team)
          }
          for (const m of (week.matches || [])) {
            if (tierGroups[m.tierNumber]) tierGroups[m.tierNumber].matches.push(m)
          }

          // Filter by team
          const tiers = Object.values(tierGroups).sort((a, b) => a.tier.tierNumber - b.tier.tierNumber)
          const filteredTiers = teamFilter
            ? tiers.filter(t => t.teams.some(tm => tm.name === teamFilter) || t.matches.some(m => m.homeTeam?.name === teamFilter || m.awayTeam?.name === teamFilter))
            : tiers

          // If filtering and no matches in this week for this team, dim it
          const hasTeamInWeek = !teamFilter || filteredTiers.length > 0

          return (
            <div key={week.id} className={cn('card-flat rounded-xl overflow-hidden', !hasTeamInWeek && 'opacity-40')}>
              {/* Week header — clickable */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : week.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-titos-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                    week.weekNumber === 1 ? 'bg-titos-gold/20 text-titos-gold' : 'bg-titos-charcoal text-titos-gray-300'
                  )}>
                    {week.weekNumber}
                  </span>
                  <div>
                    <span className="text-titos-white text-sm font-bold">
                      {week.weekNumber === 1 ? 'Placement Week' : week.isPlayoff ? 'Playoffs' : `Week ${week.weekNumber}`}
                    </span>
                    <span className="text-titos-gray-400 text-sm ml-2">{formatDate(week.date)}</span>
                  </div>
                  <StatusBadge status={week.status} />
                  {hasMatches && <span className="text-titos-gray-500 text-xs">{week.matches.length} games</span>}
                </div>
                <svg className={cn('w-4 h-4 text-titos-gray-400 transition-transform', isExpanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-titos-border/30 p-4">
                  {filteredTiers.length > 0 ? (
                    <div className="space-y-4">
                      {filteredTiers.map(({ tier, teams, matches }) => {
                        const slotC = getSlotInfo(tier.tierNumber, tier.timeSlot)
                        const slotVar = tier.tierNumber <= 4 ? 'slot-early' : 'slot-late'
                        return (
                          <div key={tier.tierNumber} className="bg-titos-surface rounded-xl overflow-hidden border border-titos-border/30">
                            <div className={cn('px-4 py-2.5 flex items-center justify-between', slotC.bg)} style={{ borderLeft: `3px solid var(--color-${slotVar})` }}>
                              <span className={cn('font-display font-bold text-sm', slotC.color)}>Tier {tier.tierNumber} (Court {tier.courtNumber})</span>
                            </div>

                            {matches.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] divide-y sm:divide-y-0 sm:divide-x divide-titos-border/20">
                                {/* Left: Roster */}
                                <div className="p-3 space-y-1.5">
                                  <span className="text-titos-gray-400 text-[11px] font-bold uppercase tracking-wider">Roster</span>
                                  {teams.map(t => (
                                    <div key={t.id} className={cn(
                                      'flex items-center gap-2 px-2 py-1 rounded',
                                      teamFilter === t.name ? 'bg-titos-gold/15' : ''
                                    )}>
                                      <span className="text-titos-gold text-[11px] font-bold w-6">{getTeamAbbreviation(t.name)}</span>
                                      <span className={cn('text-xs font-medium truncate', teamFilter === t.name ? 'text-titos-gold' : 'text-titos-white')}>{t.name}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Right: Match table */}
                                <div className="p-3">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-titos-gray-400 text-[11px] font-bold uppercase tracking-wider">
                                          <th className="text-left pb-1.5 w-[45%]">Match</th>
                                          <th className="text-center pb-1.5 w-[25%]">Score</th>
                                          <th className="text-right pb-1.5 w-[30%]">Ref</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(() => {
                                          // Group by round
                                          const rounds = {}
                                          matches.forEach(m => {
                                            if (!rounds[m.roundNumber]) rounds[m.roundNumber] = []
                                            rounds[m.roundNumber].push(m)
                                          })
                                          return Object.entries(rounds).map(([roundNum, roundMatches]) => (
                                            <Fragment key={roundNum}>
                                              {parseInt(roundNum) > 1 && (
                                                <tr><td colSpan={3} className="py-1"><div className="border-t border-dashed border-titos-border/30" /></td></tr>
                                              )}
                                              <tr><td colSpan={3} className="text-titos-gray-500 text-[11px] uppercase tracking-wider font-bold pb-0.5 pt-1">Round {roundNum}</td></tr>
                                              {roundMatches.map(m => {
                                                const isMyMatch = teamFilter && (m.homeTeam?.name === teamFilter || m.awayTeam?.name === teamFilter)
                                                const score = m.scores?.[0]
                                                const homeWon = score && score.homeScore > score.awayScore
                                                const awayWon = score && score.awayScore > score.homeScore
                                                return (
                                                  <tr key={m.id} className={cn(
                                                    'transition-colors',
                                                    isMyMatch && 'bg-titos-gold/[0.05]'
                                                  )}>
                                                    <td className="py-1.5 pr-2">
                                                      <span className={cn('font-medium', homeWon ? 'text-titos-gold' : 'text-titos-white')}>{getTeamAbbreviation(m.homeTeam?.name)}</span>
                                                      <span className="text-titos-gray-500 mx-1.5">v</span>
                                                      <span className={cn('font-medium', awayWon ? 'text-titos-gold' : 'text-titos-white')}>{getTeamAbbreviation(m.awayTeam?.name)}</span>
                                                    </td>
                                                    <td className="py-1.5 text-center">
                                                      {score ? (
                                                        <span className="font-mono text-xs">
                                                          <span className={homeWon ? 'text-titos-gold font-bold' : 'text-titos-gray-300'}>{score.homeScore}</span>
                                                          <span className="text-titos-gray-500"> - </span>
                                                          <span className={awayWon ? 'text-titos-gold font-bold' : 'text-titos-gray-300'}>{score.awayScore}</span>
                                                        </span>
                                                      ) : (
                                                        <span className="text-titos-gray-500 text-xs">—</span>
                                                      )}
                                                    </td>
                                                    <td className="py-1.5 text-right text-titos-gray-400 text-xs">
                                                      {m.refTeam?.name || '—'}
                                                    </td>
                                                  </tr>
                                                )
                                              })}
                                            </Fragment>
                                          ))
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {teams.map(t => (
                                    <span key={t.id} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-titos-elevated text-titos-white border border-titos-border/50">{t.name}</span>
                                  ))}
                                </div>
                                <p className="text-titos-gray-500 text-xs">Schedule not generated yet.</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : !hasMatches && (week.tierPlacements || []).length === 0 ? (
                    <p className="text-titos-gray-500 text-sm text-center py-4">No schedule available for this week yet.</p>
                  ) : teamFilter ? (
                    <p className="text-titos-gray-500 text-sm text-center py-4">{teamFilter} is not in this week&apos;s schedule.</p>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
