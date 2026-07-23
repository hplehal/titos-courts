import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight, MapPin } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import StatusBadge from '@/components/ui/StatusBadge'
import LiveIndicator from '@/components/tournament/LiveIndicator'
import FeaturedTournamentCard from '@/components/tournament/FeaturedTournamentCard'
import { formatDate } from '@/lib/utils'
import { getAllTournaments } from '@/lib/server/tournaments'
import { TOURNAMENT_STATUS } from '@/lib/tournament/constants'

export const metadata = {
  title: "Volleyball Tournaments Mississauga | Tito's Courts",
  description: "One-day volleyball tournaments at Tito's Courts in Mississauga and Toronto. Bracket play, prizes, and competitive divisions open to teams across the GTA.",
  alternates: { canonical: 'https://titoscourts.com/tournaments' },
  openGraph: {
    title: "Volleyball Tournaments Mississauga",
    description: "One-day volleyball tournaments at Tito's Courts in Mississauga and Toronto.",
    url: 'https://titoscourts.com/tournaments',
    type: 'website',
    images: ['/images/titosHero.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Volleyball Tournaments Mississauga",
    description: "One-day volleyball tournaments at Tito's Courts.",
    images: ['/images/titosHero.jpg'],
  },
}

// Skip build-time prerender — the list page reads live DB state through the
// cached data layer; ISR would need DB access at build which we don't always
// have. Runtime caching (unstable_cache, 60s) still keeps it fast.
export const dynamic = 'force-dynamic'

export default async function TournamentsPage() {
  const tournaments = await getAllTournaments()
  const live = tournaments.filter(t => t.hasLiveMatch)
  const upcomingAll = tournaments.filter(t =>
    !t.hasLiveMatch && (
      t.status === TOURNAMENT_STATUS.REGISTRATION ||
      t.status === TOURNAMENT_STATUS.FULL ||
      t.status === TOURNAMENT_STATUS.ACTIVE
    ),
  )
  // Upcoming sorted by soonest-first so the nearest tournament gets the hero slot.
  const upcomingSorted = [...upcomingAll].sort((a, b) => new Date(a.date) - new Date(b.date))
  const [featured, ...restUpcoming] = upcomingSorted
  const past = tournaments.filter(t => t.status === TOURNAMENT_STATUS.COMPLETED)

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          label="EVENTS"
          title="Tournaments"
          description="One-day volleyball tournaments open to all teams. Pool play into Gold and Silver brackets."
        />

        {live.length > 0 && (
          <section className="mt-10" aria-labelledby="live-section">
            <h3 id="live-section" className="font-display text-lg font-bold text-titos-white mb-4 flex items-center gap-2">
              <LiveIndicator /> Happening Now
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {live.map(t => <TournamentCard key={t.id} t={t} highlight />)}
            </div>
          </section>
        )}

        {featured && (
          <section className="mt-10" aria-labelledby="featured-section">
            <h3 id="featured-section" className="sr-only">Next tournament</h3>
            <FeaturedTournamentCard t={featured} />
          </section>
        )}

        {restUpcoming.length > 0 && (
          <section className="mt-12" aria-labelledby="upcoming-section">
            <h3 id="upcoming-section" className="font-display text-lg font-bold text-titos-white mb-4">More Upcoming</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {restUpcoming.map(t => <TournamentCard key={t.id} t={t} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="mt-12" aria-labelledby="past-section">
            <h3 id="past-section" className="font-display text-lg font-bold text-titos-white mb-4">Past Results</h3>
            <div className="space-y-3">
              {past.map(t => (
                <Link key={t.id} href={`/tournaments/${t.slug}`} className="card rounded-xl p-4 flex items-center justify-between group block">
                  <div>
                    <h4 className="font-semibold text-titos-white group-hover:text-titos-gold transition-colors">{t.name}</h4>
                    <span className="text-titos-gray-400 text-sm">{formatDate(t.date)}</span>
                  </div>
                  <StatusBadge status="completed" />
                </Link>
              ))}
            </div>
          </section>
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

function TournamentCard({ t, highlight }) {
  return (
    <Link
      href={`/tournaments/${t.slug}`}
      className="card rounded-xl overflow-hidden group block"
      data-live={t.hasLiveMatch ? 'true' : 'false'}
      data-highlight={highlight ? 'true' : undefined}
    >
      {t.imageUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-titos-gray-900">
          <Image
            src={t.imageUrl}
            alt={`${t.name} tournament poster`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          {t.hasLiveMatch ? <LiveIndicator /> : <StatusBadge status={t.status} />}
        </div>
        <h4 className="font-display text-xl font-bold text-titos-white group-hover:text-titos-gold transition-colors mb-2">
          {t.name}
        </h4>
        <div className="flex items-center gap-4 text-sm text-titos-gray-400 mb-3 flex-wrap">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(t.date)}</span>
          {t.venue && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{t.venue}</span>}
        </div>
        {t.description && <p className="text-titos-gray-400 text-sm mb-3 line-clamp-2">{t.description}</p>}
        <span className="text-titos-gold text-sm font-semibold flex items-center gap-1">
          View Details <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}
