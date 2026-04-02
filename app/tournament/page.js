import prisma from '@/lib/prisma'
import TournamentClient from './TournamentClient'

export const metadata = {
  title: 'Playoffs & Brackets',
  description: 'View the playoff brackets for Gold and Silver divisions at Tito\'s Courts.',
}

export const dynamic = 'force-dynamic'

async function getBracketData() {
  const activeSeason = await prisma.season.findFirst({ where: { isActive: true } })
  if (!activeSeason) return { pools: [], playoffMatches: [] }

  // Get pool standings for seeding
  const pools = await prisma.pool.findMany({
    where: { seasonId: activeSeason.id },
    include: {
      teams: {
        include: {
          homeMatches: { where: { status: 'completed', matchType: 'pool_play' }, include: { scores: true } },
          awayMatches: { where: { status: 'completed', matchType: 'pool_play' }, include: { scores: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Compute standings per pool
  const poolStandings = pools.map((pool) => {
    const teams = pool.teams.map((team) => {
      let wins = 0, losses = 0, pointDiff = 0
      const process = (match, isHome) => {
        let mw = 0, ml = 0
        for (const s of match.scores) {
          const my = isHome ? s.homeScore : s.awayScore
          const opp = isHome ? s.awayScore : s.homeScore
          pointDiff += (my - opp)
          if (my > opp) mw++; else ml++
        }
        if (mw > ml) wins++; else if (ml > mw) losses++
      }
      team.homeMatches.forEach(m => process(m, true))
      team.awayMatches.forEach(m => process(m, false))
      return { id: team.id, name: team.name, slug: team.slug, wins, losses, pointDiff }
    })
    teams.sort((a, b) => b.wins !== a.wins ? b.wins - a.wins : b.pointDiff - a.pointDiff)
    return { poolName: pool.name, teams }
  })

  // Get playoff matches
  const playoffMatches = await prisma.match.findMany({
    where: { seasonId: activeSeason.id, matchType: { in: ['gold_playoff', 'silver_playoff'] } },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true } },
      awayTeam: { select: { id: true, name: true, slug: true } },
      scores: { orderBy: { setNumber: 'asc' } },
    },
    orderBy: [{ bracketRound: 'asc' }, { bracketPosition: 'asc' }],
  })

  return { pools: poolStandings, playoffMatches }
}

export default async function TournamentPage() {
  const data = await getBracketData()
  return <TournamentClient {...data} />
}
