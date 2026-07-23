'use client'

import { useState } from 'react'
import LivePoller from '@/components/tournament/LivePoller'
import DivisionTabs from '@/components/tournament/DivisionTabs'
import BracketTree from '@/components/tournament/BracketTree'

function Body({ tournament, division, onDivisionChange }) {
  // Derive the divisions actually present on this tournament. Falls back to
  // Gold/Silver only when the tournament has those brackets; crossover-style
  // tournaments with a single 'Open' bracket just hide the tabs entirely.
  const availableDivisions = tournament?.brackets?.map(b => b.division) || []
  const bracket =
    tournament?.brackets?.find(b => b.division === division) ||
    tournament?.brackets?.[0] || null

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        {availableDivisions.length > 1 && (
          <DivisionTabs
            value={division}
            onChange={onDivisionChange}
            divisions={availableDivisions}
          />
        )}
        {tournament?.brackets?.length === 0 && (
          <span className="text-titos-gray-500 text-sm">Brackets not yet generated.</span>
        )}
      </div>

      {bracket ? (
        <BracketTree matches={bracket.matches} />
      ) : (
        <p className="text-titos-gray-500 text-sm">No bracket yet.</p>
      )}
    </>
  )
}

export default function BracketPageClient({ slug, initialData, initialDivision }) {
  const [division, setDivision] = useState(initialDivision)
  return (
    <LivePoller slug={slug} initialData={initialData}>
      {({ tournament }) => (
        <Body tournament={tournament} division={division} onDivisionChange={setDivision} />
      )}
    </LivePoller>
  )
}
