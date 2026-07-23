import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, ArrowRight, Trophy } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import LiveIndicator from '@/components/tournament/LiveIndicator'
import Countdown from '@/components/tournament/Countdown'
import { formatDate } from '@/lib/utils'

// Large, conversion-focused card for the next upcoming tournament. Two-column
// on desktop (image left / content right), single column on mobile with image
// on top. Countdown uses `date` as the tip-off target. Following the
// "Event/Conference Landing" pattern — hero + countdown + prominent CTA.
export default function FeaturedTournamentCard({ t }) {
  return (
    <Link
      href={`/tournaments/${t.slug}`}
      className="group block rounded-2xl overflow-hidden bg-titos-card border border-titos-border hover:border-titos-border-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:ring-offset-2 focus-visible:ring-offset-titos-surface"
      data-featured="true"
    >
      <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        {/* Image — uses object-contain so portrait flyers aren't cropped.
            Backdrop is a heavily-blurred copy of the same image, which gives
            the letterbox area visual interest regardless of poster aspect
            ratio (portrait posters on this landscape card would otherwise
            show flat black bars on the sides). */}
        <div className="relative w-full aspect-[4/5] md:aspect-auto md:min-h-[460px] overflow-hidden bg-titos-surface">
          {t.imageUrl ? (
            <>
              {/* Blurred backdrop fills the cell behind the contained poster */}
              <Image
                src={t.imageUrl}
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover scale-110 blur-2xl opacity-40"
              />
              <div className="absolute inset-0 bg-titos-surface/50" aria-hidden="true" />
              {/* Actual poster — fully visible, centered */}
              <Image
                src={t.imageUrl}
                alt={`${t.name} tournament poster`}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-titos-elevated via-titos-card to-titos-surface">
              <Trophy className="h-20 w-20 text-titos-gold/40" aria-hidden="true" />
            </div>
          )}
          {/* Top-left featured ribbon */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-titos-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-titos-surface shadow-lg shadow-black/30">
              Next Up
            </span>
            {t.hasLiveMatch && <LiveIndicator />}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-6 md:p-8 gap-5">
          <div className="flex items-center gap-3 flex-wrap">
            {t.hasLiveMatch ? <LiveIndicator /> : <StatusBadge status={t.status} />}
            <span className="inline-flex items-center gap-1.5 text-sm text-titos-gray-300">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(t.date)}
            </span>
            {t.venue && (
              <span className="inline-flex items-center gap-1.5 text-sm text-titos-gray-300">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {t.venue}
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-titos-white uppercase tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-5xl lg:text-6xl group-hover:text-titos-gold transition-colors">
            {t.name}
          </h3>

          {t.description && (
            <p className="text-titos-gray-300 text-base leading-relaxed line-clamp-3 max-w-prose">
              {t.description}
            </p>
          )}

          <Countdown date={t.date} size="lg" className="mt-1" />

          <div className="mt-auto pt-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-titos-gold px-5 py-2.5 text-sm font-semibold text-titos-surface group-hover:bg-titos-gold-light transition-colors">
              View Tournament
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
