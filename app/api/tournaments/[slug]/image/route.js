import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Serves the tournament poster uploaded through the admin UI (stored in-DB).
// Long-lived immutable cache — uploading a new image bumps nothing here, but
// posters are effectively set-once; the admin can hard-refresh if needed.
export async function GET(request, { params }) {
  const { slug } = await params
  const t = await prisma.tournament.findUnique({
    where: { slug },
    select: { imageData: true, imageType: true },
  })
  if (!t?.imageData) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(Buffer.from(t.imageData), {
    headers: {
      'Content-Type': t.imageType || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
