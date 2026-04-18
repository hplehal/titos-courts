'use client'

// Sports-poster style countdown. Shows Days / Hours / Minutes blocks counting
// down to a target date. Re-renders on a 60s interval — second-precision isn't
// meaningful for tournament tip-off. No animation on the numbers themselves
// (respects prefers-reduced-motion by default; nothing to opt out of).

import { useEffect, useMemo, useState } from 'react'

function diffParts(target) {
  const now = Date.now()
  const ms = target - now
  if (ms <= 0) return { done: true, days: 0, hours: 0, minutes: 0 }
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return { done: false, days, hours, minutes }
}

export default function Countdown({ date, size = 'md', className = '', label = 'Tournament starts in' }) {
  const target = useMemo(() => new Date(date).getTime(), [date])
  const [parts, setParts] = useState(() => diffParts(target))

  useEffect(() => {
    setParts(diffParts(target))
    const id = setInterval(() => setParts(diffParts(target)), 60_000)
    return () => clearInterval(id)
  }, [target])

  if (parts.done) {
    return (
      <div className={`inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-titos-gold ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-titos-gold" aria-hidden="true" />
        Tournament underway
      </div>
    )
  }

  const blocks = [
    { value: parts.days, label: parts.days === 1 ? 'Day' : 'Days' },
    { value: parts.hours, label: parts.hours === 1 ? 'Hour' : 'Hours' },
    { value: parts.minutes, label: parts.minutes === 1 ? 'Min' : 'Mins' },
  ]

  const sizing = size === 'lg'
    ? { num: 'text-4xl sm:text-5xl', lbl: 'text-[10px] sm:text-xs', pad: 'px-4 py-3', gap: 'gap-3' }
    : { num: 'text-2xl sm:text-3xl', lbl: 'text-[10px]', pad: 'px-3 py-2', gap: 'gap-2' }

  return (
    <div className={className} aria-live="polite">
      {label && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-titos-gray-400 mb-2">
          {label}
        </p>
      )}
      <div className={`flex ${sizing.gap}`}>
        {blocks.map(b => (
          <div
            key={b.label}
            className={`flex flex-col items-center justify-center rounded-lg bg-titos-elevated border border-titos-border ${sizing.pad} min-w-[72px] tabular-nums`}
          >
            <span className={`font-display font-bold text-titos-white leading-none ${sizing.num}`}>
              {String(b.value).padStart(2, '0')}
            </span>
            <span className={`font-semibold uppercase tracking-[0.12em] text-titos-gray-400 mt-1 ${sizing.lbl}`}>
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
