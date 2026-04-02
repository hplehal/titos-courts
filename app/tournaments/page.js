import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, Users, ArrowRight } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Tournaments' }
export const dynamic = 'force-dynamic'

async function getTournaments() {
  return prisma.tournament.findMany({
    include: { _count: { select: { tournamentTeams: true } } },
    orderBy: { date: 'desc' },
  })
}

export default async function TournamentsPage() {
  const tournaments = await getTournaments()
  const upcoming = tournaments.filter(t => t.status === 'registration' || t.status === 'active')
  const past = tournaments.filter(t => t.status === 'completed')

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionHeading label="EVENTS" title="Tournaments" description="One-day volleyball tournaments open to all teams. Multiple events per month." />

        {upcoming.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display text-lg font-bold text-titos-white mb-4">Upcoming</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {upcoming.map(t => (
                <Link key={t.id} href={`/tournaments/${t.slug}`} className="card rounded-xl p-6 group block">
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={t.status} />
                    {t.registrationFee && <span className="text-titos-gold font-bold">${t.registrationFee}/team</span>}
                  </div>
                  <h4 className="font-display text-xl font-bold text-titos-white group-hover:text-titos-gold transition-colors mb-2">{t.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-titos-gray-400 mb-3">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(t.date)}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{t._count.tournamentTeams}{t.maxTeams ? `/${t.maxTeams}` : ''} teams</span>
                  </div>
                  {t.description && <p className="text-titos-gray-400 text-sm mb-3">{t.description}</p>}
                  <span className="text-titos-gold text-sm font-semibold flex items-center gap-1">View Details <ArrowRight className="w-4 h-4" /></span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-lg font-bold text-titos-white mb-4">Past Results</h3>
            <div className="space-y-3">
              {past.map(t => (
                <Link key={t.id} href={`/tournaments/${t.slug}`} className="card rounded-xl p-4 flex items-center justify-between group block">
                  <div>
                    <h4 className="font-semibold text-titos-white group-hover:text-titos-gold transition-colors">{t.name}</h4>
                    <span className="text-titos-gray-400 text-sm">{formatDate(t.date)} &middot; {t._count.tournamentTeams} teams</span>
                  </div>
                  <StatusBadge status="completed" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {tournaments.length === 0 && (
          <div className="mt-10 card rounded-xl p-8 text-center">
            <p className="text-titos-gray-400">No tournaments scheduled yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}
