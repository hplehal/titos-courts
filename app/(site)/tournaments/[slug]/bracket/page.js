import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTournamentBracket } from '@/lib/server/tournaments'
import BracketPageClient from './BracketPageClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const t = await getTournamentBracket(slug)
  if (!t) return { title: 'Tournament Bracket Not Found' }
  return {
    title: `${t.name} · Bracket | Tito's Courts`,
    description: `Gold and Silver bracket for ${t.name} — single-elimination results as they happen.`,
    alternates: { canonical: `https://titoscourts.com/tournaments/${slug}/bracket` },
  }
}

export default async function TournamentBracketPage({ params, searchParams }) {
  const { slug } = await params
  const sp = searchParams ? await searchParams : {}
  const tournament = await getTournamentBracket(slug)
  if (!tournament) notFound()

  const divisionParam = (sp.division || 'gold').toString().toLowerCase()
  const initialDivision = divisionParam === 'silver' ? 'Silver' : 'Gold'

  return (
    <div className="py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/tournaments/${slug}`} className="text-titos-gray-400 hover:text-titos-gold">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-titos-white">{tournament.name} · Bracket</h1>
        </div>

        <BracketPageClient slug={slug} initialData={tournament} initialDivision={initialDivision} />
      </div>
    </div>
  )
}
