import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()

    const message = await prisma.contactMessage.create({
      data: {
        name: body.name,
        email: body.email,
        subject: body.subject,
        message: body.message,
      },
    })

    return NextResponse.json({ success: true, id: message.id })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
