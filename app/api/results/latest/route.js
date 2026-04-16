import { NextResponse } from 'next/server'
import { getLatestResults } from '@/lib/server/leagues'

export async function GET() {
  try {
    const results = await getLatestResults()
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Results latest error:', error.message)
    return NextResponse.json({ results: [] })
  }
}
