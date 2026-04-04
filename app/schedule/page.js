import prisma from '@/lib/prisma'
import ScheduleClient from './ScheduleClient'

export const metadata = { title: 'Schedule' }
export const dynamic = 'force-dynamic'

async function getData() {
  try {
    const leagues = await prisma.league.findMany({
      where: { isActive: true },
      select: { slug: true, name: true, dayOfWeek: true },
      orderBy: { createdAt: 'asc' },
    })
    return { leagues }
  } catch (error) {
    console.error('Schedule page data error:', error.message)
    return { leagues: [] }
  }
}

export default async function SchedulePage() {
  const { leagues } = await getData()
  return <ScheduleClient leagues={leagues} />
}
