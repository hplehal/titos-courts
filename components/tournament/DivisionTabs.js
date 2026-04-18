'use client'

// Client-side tab switcher for Gold/Silver bracket views. Syncs the selected
// division into the URL (?division=gold) so deep links share the right tab.

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { DIVISIONS } from '@/lib/tournament/constants'
import { cn } from '@/lib/utils'

export default function DivisionTabs({ value, onChange }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setValue = (division) => {
    onChange?.(division)
    const params = new URLSearchParams(searchParams.toString())
    params.set('division', division.toLowerCase())
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div role="tablist" className="inline-flex gap-1 p-1 rounded-lg bg-titos-elevated border border-titos-border/30">
      {DIVISIONS.map(d => {
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
