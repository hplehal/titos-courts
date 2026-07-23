import { NextResponse } from 'next/server'
import { getLeagueStats } from '@/lib/server/playerStats'

export async function GET(_request, { params }) {
  const { slug } = await params
  try {
    const data = await getLeagueStats(slug)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Stats API error:', error.message)
    return NextResponse.json({ players: [], teams: [], weeks: [] }, { status: 500 })
  }
}
