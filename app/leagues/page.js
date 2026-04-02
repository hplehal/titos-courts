import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight, Users, Trophy, Calendar, ArrowUpDown } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import StatusBadge from '@/components/ui/StatusBadge'
import { getLeagueTimeDisplay } from '@/lib/utils'

export const metadata = { title: 'Leagues' }
export const dynamic = 'force-dynamic'

async function getLeagues() {
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    include: {
      seasons: {
        orderBy: { seasonNumber: 'desc' },
        take: 1,
        include: { _count: { select: { teams: true, tiers: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  return leagues.map(l => ({
    ...l,
    currentSeason: l.seasons[0] || null,
    teamCount: l.seasons[0]?._count?.teams || 0,
    tierCount: l.seasons[0]?._count?.tiers || l.tiersPerSlot * 2,
  }))
}

export default async function LeaguesPage() {
  const leagues = await getLeagues()

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          label="OUR LEAGUES"
          title="Volleyball Leagues"
          description="Competitive tier-based leagues running every week at Pakmen Courts, Mississauga."
        />

        {/* League Cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <Link key={league.id} href={`/leagues/${league.slug}`} className="card rounded-xl p-6 group block h-full">
              <h3 className="font-display text-xl font-bold text-titos-white mb-1 group-hover:text-titos-gold transition-colors">
                {league.name}
              </h3>
              <p className="text-titos-gold text-sm font-semibold mb-3">
                {league.dayOfWeek}s &middot; {getLeagueTimeDisplay(league.slug)}
              </p>

              {league.currentSeason && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-titos-gray-300 text-sm">{league.currentSeason.name}</span>
                  <StatusBadge status={league.currentSeason.status} />
                </div>
              )}

              {league.description && (
                <p className="text-titos-gray-400 text-sm mb-4">{league.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-titos-gray-400 mb-4">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{league.teamCount}/{league.maxTeams} teams</span>
                <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" />{league.tierCount} tiers</span>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-titos-border/50">
                <span className="text-titos-gold text-sm font-semibold flex items-center gap-1">
                  View Details <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <SectionHeading label="THE FORMAT" title="How Our Leagues Work" />

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-titos-gold/10"><ArrowUpDown className="w-5 h-5 text-titos-gold" /></div>
                <h3 className="font-display font-bold text-titos-white">The Tier System</h3>
              </div>
              <p className="text-titos-gray-300 text-sm leading-relaxed">
                Teams are grouped into tiers of 3. Each week you play round-robin within your tier — 6 games total (3 matchups × 2 rounds).
                <strong className="text-titos-gold"> 1st place moves up, 2nd stays, 3rd drops down.</strong> This means every week is a fresh challenge with different opponents.
              </p>
            </div>

            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-titos-gold/10"><Trophy className="w-5 h-5 text-titos-gold" /></div>
                <h3 className="font-display font-bold text-titos-white">Scoring & Points</h3>
              </div>
              <p className="text-titos-gray-300 text-sm leading-relaxed">
                Sets are played to 25 (cap 27). Each week you earn base points (10 for upper tiers, 9 for lower) plus 1 point per set won.
                Tiebreakers: Sets Won → Point Differential → Head-to-Head.
              </p>
            </div>

            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-titos-gold/10"><Calendar className="w-5 h-5 text-titos-gold" /></div>
                <h3 className="font-display font-bold text-titos-white">Season Structure</h3>
              </div>
              <p className="text-titos-gray-300 text-sm leading-relaxed">
                11 weeks total. <strong className="text-titos-gold">Week 1:</strong> Placement matches to seed tiers.
                <strong className="text-titos-gold"> Weeks 2-10:</strong> Regular season with tier movement.
                <strong className="text-titos-gold"> Week 11:</strong> Playoff championships.
              </p>
            </div>

            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-titos-gold/10"><Users className="w-5 h-5 text-titos-gold" /></div>
                <h3 className="font-display font-bold text-titos-white">Playoff Divisions</h3>
              </div>
              <p className="text-titos-gray-300 text-sm leading-relaxed">
                Final standings determine your playoff division. 5 divisions — Diamond, Platinum, Gold, Silver, and Bronze — competing in elimination brackets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
