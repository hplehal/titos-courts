import { NextResponse } from 'next/server'
import { getLeagueSchedule } from '@/lib/server/leagues'

export async function GET(_request, { params }) {
  const { slug } = await params
  try {
    const data = await getLeagueSchedule(slug)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Schedule API error:', error.message)
    return NextResponse.json({ weeks: [] }, { status: 500 })
  }
}
