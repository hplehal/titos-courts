'use client'

// Client-side tab switcher for bracket divisions. Syncs the selected
// division into the URL (?division=gold) so deep links share the right tab.
// For tournaments with a single bracket (e.g. crossover-single-elim, where
// there is only an 'Open' bracket), the caller can pass `divisions` to
// override the default Gold/Silver list — or skip rendering the tabs
// entirely.

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { DIVISIONS } from '@/lib/tournament/constants'
import { cn } from '@/lib/utils'

export default function DivisionTabs({ value, onChange, divisions = DIVISIONS }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (divisions.length <= 1) return null

  const setValue = (division) => {
    onChange?.(division)
    const params = new URLSearchParams(searchParams.toString())
    params.set('division', division.toLowerCase())
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div role="tablist" className="inline-flex gap-1 p-1 rounded-lg bg-titos-elevated border border-titos-border/30">
      {divisions.map(d => {
        const isActive = value === d
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setValue(d)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer',
              isActive ? 'bg-titos-gold text-titos-surface' : 'text-titos-gray-400 hover:text-titos-white',
            )}
          >
            {d}
          </button>
        )
      })}
    </div>
  )
}
