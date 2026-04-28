import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Trophy, Calendar, MapPin } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getTournamentHub } from '@/lib/server/tournaments'
import TournamentHubClient from './TournamentHubClient'
import Countdown from '@/components/tournament/Countdown'
import PhotosLink from '@/components/PhotosLink'
import { getTournamentPhotosUrl } from '@/lib/photoLinks'
import { TOURNAMENT_STATUS } from '@/lib/tournament/constants'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const t = await getTournamentHub(slug)
  if (!t) return { title: 'Tournament Not Found' }
  const desc = t.description || `Tournament hub for ${t.name} — live scores, pool standings, and brackets.`
  const ogImage = t.imageUrl || '/images/titosHero.jpg'
  return {
    title: `${t.name} | Tito's Courts`,
    description: desc,
    alternates: { canonical: `https://titoscourts.com/tournaments/${slug}` },
    openGraph: {
      title: t.name,
      description: desc,
      url: `https://titoscourts.com/tournaments/${slug}`,
      type: 'website',
      images: [ogImage],
    },
  }
}

export default async function TournamentDetailPage({ params }) {
  const { slug } = await params
  const tournament = await getTournamentHub(slug)
  if (!tournament) notFound()

  const isUpcoming =
    tournament.status === TOURNAMENT_STATUS.REGISTRATION ||
    tournament.status === TOURNAMENT_STATUS.FULL ||
    tournament.status === TOURNAMENT_STATUS.ACTIVE
  const hasFutureDate = new Date(tournament.date).getTime() > Date.now()

  return (
    <div className="pb-12">
      {/* Hero — split layout when a poster exists (poster on left, title/meta on right)
          so the full flyer is always visible. Posters already carry their own typography
          and dates, so we don't overlay text on top of them. Falls back to a solid title
          band when no poster is uploaded. */}
      <section className="relative">
        {tournament.imageUrl ? (
          <div className="relative overflow-hidden">
            {/* Blurred backdrop fills the full width behind the split layout */}
            <div className="absolute inset-0" aria-hidden="true">
              <Image
                src={tournament.imageUrl}
                alt=""
                fill
                sizes="100vw"
                className="object-cover scale-110 blur-3xl opacity-30"
              />
              <div className="absolute inset-0 bg-titos-surface/70" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-6 sm:pt-12 sm:pb-10">
              <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:items-center">
                {/* Poster — object-contain keeps the whole flyer visible */}
                <div className="relative mx-auto w-full max-w-md md:max-w-none">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-titos-surface ring-1 ring-titos-border shadow-2xl shadow-black/40">
                    <Image
                      src={tournament.imageUrl}
                      alt={`${tournament.name} tournament poster`}
                      fill
                      priority
                      sizes="(min-width: 768px) 45vw, 100vw"
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Title + meta block */}
                <div>
                  <HeroContent tournament={tournament} overlay={false} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl px-4 pt-12">
            <HeroContent tournament={tournament} overlay={false} />
          </div>
        )}
      </section>

      {/* Countdown strip for upcoming tournaments with future dates */}
      {isUpcoming && hasFutureDate && (
        <section className="mx-auto max-w-6xl px-4 mt-8" aria-label="Time until tournament">
          <div className="rounded-2xl border border-titos-border bg-titos-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <Countdown date={tournament.date} size="md" label="Tip-off in" />
            <Link
              href={`/tournaments/${slug}/bracket`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-titos-gold px-5 py-2.5 text-sm font-semibold text-titos-surface hover:bg-titos-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:ring-offset-2 focus-visible:ring-offset-titos-surface"
            >
              <Trophy className="h-4 w-4" aria-hidden="true" /> View Bracket
            </Link>
            <PhotosLink url={getTournamentPhotosUrl(slug)} />
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 mt-10">
        <TournamentHubClient slug={slug} initialData={tournament} />

        {/* Secondary bracket CTA for completed/live tournaments (upcoming already has the sticky CTA above) */}
        {!(isUpcoming && hasFutureDate) && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/tournaments/${slug}/bracket`}
              className="inline-flex items-center gap-2 rounded-full bg-titos-gold px-6 py-3 text-sm font-semibold text-titos-surface hover:bg-titos-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:ring-offset-2 focus-visible:ring-offset-titos-surface"
            >
              <Trophy className="w-4 h-4" aria-hidden="true" /> View Bracket
            </Link>
            <PhotosLink url={getTournamentPhotosUrl(slug)} />
          </div>
        )}
      </div>
    </div>
  )
}

function HeroContent({ tournament, overlay }) {
  const titleColor = overlay ? 'text-titos-white drop-shadow-lg' : 'text-titos-white'
  const metaColor = overlay ? 'text-titos-gray-200' : 'text-titos-gray-400'
  const descColor = overlay ? 'text-titos-gray-200' : 'text-titos-gray-300'
  return (
    <header>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <StatusBadge status={tournament.status} />
        <span className={`${metaColor} text-sm flex items-center gap-1.5`}>
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />{formatDate(tournament.date)}
        </span>
        {tournament.venue && (
          <span className={`${metaColor} text-sm flex items-center gap-1.5`}>
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />{tournament.venue}
          </span>
        )}
      </div>
      <h1 className={`font-display font-bold uppercase tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl ${titleColor}`}>
        {tournament.name}
      </h1>
      {tournament.description && (
        <p className={`${descColor} mt-4 max-w-2xl text-base sm:text-lg leading-relaxed`}>
          {tournament.description}
        </p>
      )}
    </header>
  )
}
