// Admin league management.
//
// GET   /api/admin/leagues             every league (visible and hidden) + season counts
// POST  /api/admin/leagues             create a league — hidden unless isActive: true is sent
// PATCH /api/admin/leagues  { id, … }  rename, edit details/rules, or show/hide a league
//
// The slug (the league's URL, /leagues/<slug>) is fixed at creation so links,
// bookmarks and past registrations keep pointing at the right league.

import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { checkAdminPassword, unauthorized } from '@/lib/server/adminAuth'
import { revalidateLeague } from '@/lib/server/leagues'
import { parseLeagueInput, tiersPerSlotFor } from '@/lib/league/leagueInput'

export const dynamic = 'force-dynamic'

// League names, rules and visibility show on nearly every public page (nav,
// homepage, standings, schedule, register), so refresh the whole site.
function revalidateLeagues(slug) {
  revalidateTag('leagues')
  revalidateLeague(slug)
  revalidatePath('/', 'layout')
}

export async function GET(request) {
  if (!checkAdminPassword(request)) return unauthorized()
  try {
    const leagues = await prisma.league.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { seasons: true } } },
    })
    return NextResponse.json({ leagues })
  } catch (error) {
    console.error('Leagues GET error:', error)
    return NextResponse.json({ error: 'Failed to load leagues' }, { status: 500 })
  }
}

export async function POST(request) {
  if (!checkAdminPassword(request)) return unauthorized()
  try {
    const body = await request.json()
    const { data, error } = parseLeagueInput(body, { create: true })
    if (error) return NextResponse.json({ error }, { status: 400 })

    const taken = await prisma.league.findUnique({ where: { slug: data.slug }, select: { id: true } })
    if (taken) {
      return NextResponse.json({ error: `The URL name "${data.slug}" is already used by another league` }, { status: 409 })
    }

    const league = await prisma.league.create({
      data: { isActive: false, ...data, tiersPerSlot: tiersPerSlotFor(data) },
    })
    revalidateLeagues(league.slug)
    return NextResponse.json({ success: true, league })
  } catch (error) {
    console.error('League create error:', error)
    return NextResponse.json({ error: 'Failed to create league' }, { status: 500 })
  }
}

export async function PATCH(request) {
  if (!checkAdminPassword(request)) return unauthorized()
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const existing = await prisma.league.findUnique({ where: { id: body.id } })
    if (!existing) return NextResponse.json({ error: 'League not found' }, { status: 404 })
    if (body.slug !== undefined && body.slug !== existing.slug) {
      return NextResponse.json({ error: "A league's URL name can't be changed after it's created" }, { status: 400 })
    }

    const { data, error } = parseLeagueInput(body)
    if (error) return NextResponse.json({ error }, { status: 400 })
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    const league = await prisma.league.update({
      where: { id: existing.id },
      data: { ...data, tiersPerSlot: tiersPerSlotFor({ ...existing, ...data }) },
    })
    revalidateLeagues(league.slug)
    return NextResponse.json({ success: true, league })
  } catch (error) {
    console.error('League update error:', error)
    return NextResponse.json({ error: 'Failed to update league' }, { status: 500 })
  }
}
