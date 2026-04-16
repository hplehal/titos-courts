import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ResultsClient from '../ResultsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const league = await prisma.league.findUnique({
    where: { slug },
    select: { name: true },
  })
  if (!league) return { title: 'Results' }
  return {
    title: `${league.name} Results`,
    description: `Weekly match results and tier standings for ${league.name} at Tito's Courts.`,
  }
}

async function getData() {
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    select: { slug: true, name: true, dayOfWeek: true },
    orderBy: { createdAt: 'asc' },
  })
  return { leagues }
}

export default async function ResultsLeaguePage({ params }) {
  const { slug } = await params
  const { leagues } = await getData()

  // Validate slug belongs to an active league
  const valid = leagues.some(l => l.slug === slug)
  if (!valid) notFound()

  return <ResultsClient leagues={leagues} initialSlug={slug} />
}
