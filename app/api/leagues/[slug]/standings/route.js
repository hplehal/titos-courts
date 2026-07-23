import { NextResponse } from 'next/server'
import { getLeagueStandings } from '@/lib/server/leagues'

export async function GET(_request, { params }) {
  const { slug } = await params
  try {
    const data = await getLeagueStandings(slug)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Standings API error:', error.message)
    return NextResponse.json({ standings: [], currentTiers: [] }, { status: 500 })
  }
}
