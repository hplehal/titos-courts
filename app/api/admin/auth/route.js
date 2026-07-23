import { NextResponse } from 'next/server'

// Admin login endpoint. Fails closed when ADMIN_PASSWORD is unset — there is
// deliberately no hardcoded fallback, because a leaked default becomes a
// universal backdoor the moment the env var goes missing.

export async function POST(request) {
  try {
    const { password } = await request.json()
    const adminPassword = process.env.ADMIN_PASSWORD

    if (adminPassword && password === adminPassword) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
