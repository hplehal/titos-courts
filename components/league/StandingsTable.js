'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn, getDivisionInfo } from '@/lib/utils'

const columns = [
  { key: 'rank', label: '#', className: 'w-12' },
  { key: 'name', label: 'Team', className: 'text-left' },
  { key: 'setsWon', label: 'SW' },
  { key: 'setsLost', label: 'SL' },
  { key: 'pointDiff', label: '+/-' },
  { key: 'totalPoints', label: 'PTS' },
]

export default function StandingsTable({ teams = [], showDivisions = false }) {
  const [sortKey, setSortKey] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : key === 'rank' ? 'asc' : 'desc')
    }
  }

  const sorted = [...teams].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (sortKey === 'name') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const allColumns = showDivisions
    ? [...columns, { key: 'division', label: 'Division', className: 'text-center' }]
    : columns

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-titos-border/50">
              {allColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.key !== 'division' && handleSort(col.key)}
                  className={cn(
                    'px-3 py-3 text-xs font-semibold uppercase tracking-wider text-titos-gray-400 transition-colors',
                    col.key !== 'division' && 'cursor-pointer hover:text-titos-white',
                    col.className || 'text-center'
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, i) => {
              const division = showDivisions
                ? getDivisionInfo(team.rank, teams.length)
                : null

              return (
                <tr
                  key={team.id || team.name || i}
                  className={cn(
                    'border-b border-titos-border/20 transition-colors hover:bg-titos-white/5',
                    division && division.bgClass
                  )}
                >
                  {/* Rank */}
                  <td className="px-3 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                        team.rank <= 3
                          ? 'bg-titos-gold/20 text-titos-gold'
                          : 'text-titos-gray-400'
                      )}
                    >
                      {team.rank}
                    </span>
                  </td>

                  {/* Team name */}
                  <td className="px-3 py-3 text-left">
                    <span className="font-semibold text-titos-white text-sm">
                      {team.name}
                    </span>
                  </td>

                  {/* Sets Won */}
                  <td className="px-3 py-3 text-center font-semibold text-status-success text-sm">
                    {team.setsWon}
                  </td>

                  {/* Sets Lost */}
                  <td className="px-3 py-3 text-center font-semibold text-status-live text-sm">
                    {team.setsLost}
                  </td>

                  {/* Point Diff */}
                  <td
                    className={cn(
                      'px-3 py-3 text-center font-bold text-sm',
                      team.pointDiff > 0
                        ? 'text-status-success'
                        : team.pointDiff < 0
                          ? 'text-status-live'
                          : 'text-titos-gray-400'
                    )}
                  >
                    {team.pointDiff > 0 ? '+' : ''}{team.pointDiff}
                  </td>

                  {/* Total Points */}
                  <td className="px-3 py-3 text-center font-bold text-titos-gold text-sm">
                    {team.totalPoints}
                  </td>

                  {/* Division badge */}
                  {showDivisions && division && (
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          `bg-${division.color}/15 text-${division.color} border border-${division.color}/30`
                        )}
                      >
                        {division.name}
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
