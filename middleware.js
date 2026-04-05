import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()

  // Restrict CORS on API routes to same origin only
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      'https://titoscourts.com',
      'https://www.titoscourts.com',
      'http://localhost:3000',
    ]

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    // Don't set wildcard — if origin is not in the list, no CORS header is sent

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
