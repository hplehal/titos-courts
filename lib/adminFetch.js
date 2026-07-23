// Client helper — wraps fetch() to inject the admin password header. Pair with
// lib/server/adminAuth.js on the server side. Reads the password from
// sessionStorage (set by the AuthGate component on successful login).

export async function adminFetch(url, options = {}) {
  const pw = typeof window !== 'undefined' ? sessionStorage.getItem('admin_pw') : null
  const headers = {
    ...(options.headers || {}),
    'x-admin-password': pw || '',
  }
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }
  return fetch(url, { ...options, headers })
}

/** Convenience: POST JSON with admin header. */
export function adminPost(url, body) {
  return adminFetch(url, { method: 'POST', body: JSON.stringify(body) })
}

/** Convenience: PATCH JSON with admin header. */
export function adminPatch(url, body) {
  return adminFetch(url, { method: 'PATCH', body: JSON.stringify(body) })
}

/** Convenience: DELETE with admin header. */
export function adminDelete(url, body) {
  return adminFetch(url, {
    method: 'DELETE',
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}
