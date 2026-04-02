import prisma from '@/lib/prisma'
import StandingsClient from './StandingsClient'

export const metadata = { title: 'Standings' }
export const dynamic = 'force-dynamic'

async function getData() {
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    select: { slug: true, name: true, dayOfWeek: true },
    orderBy: { createdAt: 'asc' },
  })
  return { leagues }
}

export default async function StandingsPage() {
  const { leagues } = await getData()
  return <StandingsClient leagues={leagues} />
}
