import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ScheduleClient from '../ScheduleClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const league = await prisma.league.findUnique({
    where: { slug },
    select: { name: true },
  })
  if (!league) return { title: 'Schedule' }
  return {
    title: `${league.name} Schedule`,
    description: `Weekly game schedule for ${league.name} at Tito's Courts. Find your tier, court, and opponents.`,
  }
}

async function getData() {
  try {
    const leagues = await prisma.league.findMany({
      where: { isActive: true },
      select: { slug: true, name: true, dayOfWeek: true },
      orderBy: { createdAt: 'asc' },
    })
    return { leagues }
  } catch (error) {
    console.error('Schedule slug page data error:', error.message)
    return { leagues: [] }
  }
}

export default async function ScheduleLeaguePage({ params }) {
  const { slug } = await params
  const { leagues } = await getData()

  const valid = leagues.some(l => l.slug === slug)
  if (!valid) notFound()

  return <ScheduleClient leagues={leagues} initialSlug={slug} />
}
