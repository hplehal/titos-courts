import { NextResponse } from 'next/server'
import { getLeaguePlayoffs } from '@/lib/server/playoffs'

export async function GET(_request, { params }) {
  const { slug } = await params
  try {
    const data = await getLeaguePlayoffs(slug)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Playoffs API error:', error.message)
    return NextResponse.json({ league: null, divisions: [] }, { status: 500 })
  }
}
