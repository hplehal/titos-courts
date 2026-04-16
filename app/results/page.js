import prisma from '@/lib/prisma'
import ResultsClient from './ResultsClient'

export const metadata = {
  title: 'Results',
  description: 'Weekly match results and scores for all Tito\'s Courts volleyball leagues. See tier standings, match scores, and team movement.',
}
export const dynamic = 'force-dynamic'

async function getData() {
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    select: { slug: true, name: true, dayOfWeek: true },
    orderBy: { createdAt: 'asc' },
  })
  return { leagues }
}

export default async function ResultsPage() {
  const { leagues } = await getData()
  return <ResultsClient leagues={leagues} />
}
