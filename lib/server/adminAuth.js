// Server-side admin password check. Admin client pages store the password in
// sessionStorage and echo it back on every mutation via `x-admin-password`.
// This helper is cheap — single string compare against env — and should wrap
// every admin mutation route as a defense-in-depth measure.
//
// Fails closed: if ADMIN_PASSWORD is unset in the environment, no request is
// ever authorised. Do NOT reintroduce a hardcoded fallback — a leaked default
// becomes a universal backdoor the moment the env var goes missing.

export function checkAdminPassword(request) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const provided =
    request.headers.get('x-admin-password') ||
    request.headers.get('X-Admin-Password')
  return typeof provided === 'string' && provided === expected
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
