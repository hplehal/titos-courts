'use client'

import { useState } from 'react'
import LivePoller from '@/components/tournament/LivePoller'
import DivisionTabs from '@/components/tournament/DivisionTabs'
import BracketTree from '@/components/tournament/BracketTree'

function Body({ tournament, division, onDivisionChange }) {
  const bracket = tournament?.brackets?.find(b => b.division === division)

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <DivisionTabs value={division} onChange={onDivisionChange} />
        {tournament?.brackets?.length === 0 && (
          <span className="text-titos-gray-500 text-sm">Brackets not yet generated.</span>
        )}
      </div>

      {bracket ? (
        <BracketTree matches={bracket.matches} />
      ) : (
        <p className="text-titos-gray-500 text-sm">No {division} bracket yet.</p>
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
