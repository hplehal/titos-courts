'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy, Plus, Loader2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'

export default function TournamentAdminPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then(data => {
      setTournaments(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display text-2xl font-black text-titos-white">Tournament Management</h1>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {tournaments.map(t => (
              <div key={t.id} className="card-flat rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display text-lg font-bold text-titos-white">{t.name}</h3>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-titos-gray-400 text-sm">
                      {formatDate(t.date)} &middot; {t._count?.tournamentTeams || 0} teams
                    </p>
                  </div>
                  <Link
                    href={`/tournaments/${t.slug}`}
                    className="text-titos-gold text-sm font-bold hover:text-titos-gold-light transition-colors"
                  >
                    View Bracket →
                  </Link>
                </div>
              </div>
            ))}

            {tournaments.length === 0 && (
              <div className="card rounded-xl p-8 text-center">
                <Trophy className="w-10 h-10 text-titos-gray-600 mx-auto mb-3" />
                <p className="text-titos-gray-400">No tournaments created yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
