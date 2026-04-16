import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import StandingsClient from '../StandingsClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const league = await prisma.league.findUnique({
    where: { slug },
    select: { name: true },
  })
  if (!league) return { title: 'Standings' }
  return {
    title: `${league.name} Standings`,
    description: `Current season standings for ${league.name} at Tito's Courts. Track rankings, wins, losses, and playoff divisions.`,
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

export default async function StandingsLeaguePage({ params }) {
  const { slug } = await params
  const { leagues } = await getData()

  const valid = leagues.some(l => l.slug === slug)
  if (!valid) notFound()

  return <StandingsClient leagues={leagues} initialSlug={slug} />
}
