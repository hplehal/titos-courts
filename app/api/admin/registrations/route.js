import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ registrations })
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, paymentStatus } = body

    await prisma.registration.update({
      where: { id },
      data: { paymentStatus },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration update error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
