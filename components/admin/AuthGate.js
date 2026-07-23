'use client'

// Shared admin password gate — wraps any /admin/* page. Renders its children
// only once the user has typed the correct password. Stores the actual
// password in sessionStorage so mutation calls can echo it as a header for
// server-side re-verification (see lib/server/adminAuth.js + adminFetch).

import { useEffect, useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'

export const ADMIN_AUTH_KEY = 'admin_auth'
export const ADMIN_PW_KEY = 'admin_pw'

export default function AuthGate({ children }) {
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Require BOTH keys. If a stale session has only the flag (from before the
    // password-echo pattern was added), force re-login — otherwise mutation
    // calls silently send an empty x-admin-password header and get 401s.
    const hasFlag = sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
    const hasPw = !!sessionStorage.getItem(ADMIN_PW_KEY)
    if (hasFlag && hasPw) {
      setAuthed(true)
    } else if (hasFlag && !hasPw) {
      sessionStorage.removeItem(ADMIN_AUTH_KEY)
    }
    setReady(true)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setChecking(true); setErr('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.ok) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
        sessionStorage.setItem(ADMIN_PW_KEY, pw)
        setAuthed(true)
      } else {
        setErr('Invalid password')
      }
    } catch {
      setErr('Connection error')
    }
    setChecking(false)
  }

  if (!ready) return null
  if (authed) return children

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card rounded-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <Shield className="w-10 h-10 text-titos-gold mx-auto mb-3" />
          <h1 className="font-display text-2xl font-black text-titos-white">Admin Access</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50"
          />
          {err && <p className="text-status-live text-sm text-center">{err}</p>}
          <button type="submit" disabled={checking} className="w-full btn-primary justify-center">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
