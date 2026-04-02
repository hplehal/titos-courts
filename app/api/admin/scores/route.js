import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET: Fetch matches for a specific week with scores
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const weekId = searchParams.get('weekId')

  if (!weekId) return NextResponse.json({ matches: [] })

  const matches = await prisma.match.findMany({
    where: { weekId },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      refTeam: { select: { id: true, name: true } },
      scores: { orderBy: { setNumber: 'asc' } },
    },
    orderBy: [{ tierNumber: 'asc' }, { gameOrder: 'asc' }],
  })

  return NextResponse.json({ matches })
}

// PATCH: Mark a week as completed
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { weekId, status } = body

    if (!weekId || !status) {
      return NextResponse.json({ error: 'weekId and status required' }, { status: 400 })
    }

    await prisma.week.update({
      where: { id: weekId },
      data: { status },
    })

    // Also mark all matches in this week as completed
    if (status === 'completed') {
      await prisma.match.updateMany({
        where: { weekId },
        data: { status: 'completed' },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Week update error:', error)
    return NextResponse.json({ error: 'Failed to update week' }, { status: 500 })
  }
}

// POST: Save scores for a match
export async function POST(request) {
  try {
    const body = await request.json()
    const { matchId, scores, status } = body

    // Update match status
    if (status) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status },
      })
    }

    // Upsert scores
    if (scores && scores.length > 0) {
      for (const s of scores) {
        await prisma.setScore.upsert({
          where: { matchId_setNumber: { matchId, setNumber: s.setNumber } },
          update: { homeScore: s.homeScore, awayScore: s.awayScore },
          create: { matchId, setNumber: s.setNumber, homeScore: s.homeScore, awayScore: s.awayScore },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Score save error:', error)
    return NextResponse.json({ error: 'Failed to save scores' }, { status: 500 })
  }
}
