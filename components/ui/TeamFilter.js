'use client'

import { X } from 'lucide-react'

export default function TeamFilter({ teams, selected, onSelect, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="px-4 py-2.5 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50 min-w-[180px]"
      >
        <option value="">Filter by team</option>
        {teams.map(t => {
          const name = typeof t === 'string' ? t : t.name
          return <option key={name} value={name}>{name}</option>
        })}
      </select>
      {selected && (
        <button
          onClick={() => onSelect('')}
          className="p-1.5 rounded-lg text-titos-gray-400 hover:text-titos-white hover:bg-titos-card transition-colors"
          title="Clear filter"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
