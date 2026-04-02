'use client'

import { cn } from '@/lib/utils'

export default function LeagueSelector({ leagues, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {leagues.map((league) => {
        const isActive = selected === league.slug
        return (
          <button
            key={league.slug}
            onClick={() => onSelect(league.slug)}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
              isActive
                ? 'bg-titos-gold/15 text-titos-gold border-titos-gold/30'
                : 'bg-titos-card text-titos-gray-300 border-titos-border hover:text-titos-white hover:border-titos-border-light'
            )}
          >
            {league.name}
          </button>
        )
      })}
    </div>
  )
}
