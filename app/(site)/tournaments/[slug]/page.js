import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Trophy, Medal } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatDate, cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const t = await prisma.tournament.findUnique({ where: { slug } })
  if (!t) return { title: 'Tournament Not Found' }
  return { title: t.name }
}

async function getTournament(slug) {
  return prisma.tournament.findUnique({
    where: { slug },
    include: {
      tournamentTeams: { orderBy: { name: 'asc' } },
      pools: {
        include: {
          teams: true,
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              scores: { orderBy: { setNumber: 'asc' } },
            },
            orderBy: { id: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
      brackets: {
        include: {
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              scores: { orderBy: { setNumber: 'asc' } },
            },
            orderBy: [{ bracketRound: 'asc' }, { bracketPosition: 'asc' }],
          },
        },
      },
    },
  })
}

export default async function TournamentDetailPage({ params }) {
  const { slug } = await params
  const tournament = await getTournament(slug)
  if (!tournament) notFound()

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={tournament.status} />
            <span className="text-titos-gray-400 text-sm">{formatDate(tournament.date)}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-titos-white">{tournament.name}</h1>
          {tournament.description && <p className="text-titos-gray-300 mt-2">{tournament.description}</p>}
        </div>

        {/* Pool Play */}
        {tournament.pools.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-xl font-bold text-titos-white mb-4">Pool Play</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {tournament.pools.map(pool => (
                <div key={pool.id} className="card rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-titos-border bg-titos-gold/5">
                    <h3 className="font-display font-bold text-titos-gold text-sm">{pool.name}</h3>
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {pool.teams.map(t => <span key={t.id} className="text-titos-white text-xs bg-titos-surface rounded px-2 py-1">{t.name}</span>)}
                    </div>
                    {pool.matches.length > 0 && (
                      <div className="space-y-1">
                        {pool.matches.map(m => {
                          let hs = 0, as = 0
                          m.scores.forEach(s => { if (s.homeScore > s.awayScore) hs++; else as++ })
                          return (
                            <div key={m.id} className="flex items-center justify-between text-xs bg-titos-surface/50 rounded px-2 py-1">
                              <span className={cn('text-titos-gray-300', hs > as && 'text-titos-gold font-semibold')}>{m.homeTeam?.name || 'TBD'}</span>
                              <span className="text-titos-gray-500">{m.scores.map(s => `${s.homeScore}-${s.awayScore}`).join(', ')}</span>
                              <span className={cn('text-titos-gray-300', as > hs && 'text-titos-gold font-semibold')}>{m.awayTeam?.name || 'TBD'}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brackets */}
        {tournament.brackets.length > 0 && (
          <div className="space-y-8">
            {tournament.brackets.map(bracket => (
              <div key={bracket.id}>
                <div className="flex items-center gap-3 mb-4">
                  {bracket.division === 'Gold' ? <Trophy className="w-6 h-6 text-titos-gold" /> : <Medal className="w-6 h-6 text-titos-gray-400" />}
                  <h2 className={`font-display text-xl font-bold ${bracket.division === 'Gold' ? 'text-titos-gold' : 'text-titos-gray-300'}`}>
                    {bracket.division} Division
                  </h2>
                </div>

                <div className="card rounded-xl p-6 overflow-x-auto">
                  {(() => {
                    const rounds = {}
                    bracket.matches.forEach(m => { const r = m.bracketRound || 1; if (!rounds[r]) rounds[r] = []; rounds[r].push(m) })
                    const labels = { 1: 'Quarterfinals', 2: 'Semifinals', 3: 'Final' }
                    return (
                      <div className="flex gap-8 min-w-fit items-start">
                        {Object.entries(rounds).map(([round, matches]) => (
                          <div key={round} className="flex flex-col gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-titos-gray-500 text-center mb-2">{labels[round] || `Round ${round}`}</span>
                            <div className="flex flex-col gap-6">
                              {matches.map(m => {
                                let hs = 0, as = 0
                                m.scores.forEach(s => { if (s.homeScore > s.awayScore) hs++; else as++ })
                                const homeWon = m.status === 'completed' && hs > as
                                const awayWon = m.status === 'completed' && as > hs
                                return (
                                  <div key={m.id} className="card rounded-lg w-56">
                                    <div className={cn('flex items-center justify-between px-3 py-2.5 border-b border-titos-border/30', homeWon && 'bg-titos-gold/10')}>
                                      <span className={cn('text-sm font-medium truncate', homeWon ? 'text-titos-gold font-bold' : 'text-titos-white')}>{m.homeTeam?.name || 'TBD'}</span>
                                      {m.status !== 'scheduled' && <span className={cn('text-sm font-bold', homeWon ? 'text-titos-gold' : 'text-titos-gray-400')}>{hs}</span>}
                                    </div>
                                    <div className={cn('flex items-center justify-between px-3 py-2.5', awayWon && 'bg-titos-gold/10')}>
                                      <span className={cn('text-sm font-medium truncate', awayWon ? 'text-titos-gold font-bold' : 'text-titos-white')}>{m.awayTeam?.name || 'TBD'}</span>
                                      {m.status !== 'scheduled' && <span className={cn('text-sm font-bold', awayWon ? 'text-titos-gold' : 'text-titos-gray-400')}>{as}</span>}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
