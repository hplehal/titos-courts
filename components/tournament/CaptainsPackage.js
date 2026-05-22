'use client'

// Captain's Package — public summary of the tournament rules, venue,
// format, and prize. Renders the tournament.rules markdown (a small
// subset: headings, bold, italic, bullet lists, code spans, paragraphs).
// We keep parsing intentionally tiny so we don't ship a 100KB markdown
// runtime for what is, in practice, a single rules card.
//
// Mobile-first: collapsed by default. The header is a compact two-line
// strip that still surfaces venue + prize + format at a glance, so teams
// can scroll past it directly to their schedule without losing access
// to the rules.

import { useState } from 'react'
import { MapPin, Trophy, ClipboardList, Banknote, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Very small markdown subset → React. Handles:
//   ## Heading
//   - bullet item
//   **bold**, *italic*, `code`
//   blank line = paragraph break
// Anything fancier (tables, links, blockquotes) renders as plain text —
// the source markdown should stay simple.
function renderMarkdownBlock(text, keyPrefix) {
  if (!text) return null
  const blocks = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  let blockIdx = 0
  while (i < lines.length) {
    const line = lines[i]

    // Skip blank lines between blocks
    if (!line.trim()) { i++; continue }

    // Heading (## or ###)
    if (/^##\s/.test(line)) {
      blocks.push(
        <h3 key={`${keyPrefix}-h-${blockIdx++}`} className="font-display text-lg sm:text-xl font-bold text-titos-white mt-6 first:mt-0 mb-2">
          {renderInline(line.replace(/^##+\s/, ''))}
        </h3>
      )
      i++
      continue
    }

    // Bullet list — gather consecutive `- ` lines
    if (/^\s*-\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*-\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s/, ''))
        i++
      }
      blocks.push(
        <ul key={`${keyPrefix}-ul-${blockIdx++}`} className="list-disc pl-5 space-y-1.5 text-titos-gray-200 text-sm sm:text-[15px] leading-relaxed mb-3">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Paragraph — accumulate non-blank, non-bullet, non-heading lines
    const para = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^##\s/.test(lines[i]) &&
      !/^\s*-\s/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={`${keyPrefix}-p-${blockIdx++}`} className="text-titos-gray-200 text-sm sm:text-[15px] leading-relaxed mb-3">
        {renderInline(para.join(' '))}
      </p>
    )
  }
  return blocks
}

// Inline: **bold**, *italic*, `code`. Returns an array of React nodes.
function renderInline(text) {
  const tokens = []
  let buffer = ''
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    // **bold**
    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        if (buffer) { tokens.push(buffer); buffer = '' }
        tokens.push(<strong key={`b-${i}`} className="font-bold text-titos-white">{text.slice(i + 2, end)}</strong>)
        i = end + 2
        continue
      }
    }
    // *italic*
    if (ch === '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1) {
        if (buffer) { tokens.push(buffer); buffer = '' }
        tokens.push(<em key={`i-${i}`} className="italic">{text.slice(i + 1, end)}</em>)
        i = end + 1
        continue
      }
    }
    // `code`
    if (ch === '`') {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        if (buffer) { tokens.push(buffer); buffer = '' }
        tokens.push(
          <code key={`c-${i}`} className="rounded bg-titos-elevated px-1.5 py-0.5 text-[0.85em] text-titos-gold font-mono">
            {text.slice(i + 1, end)}
          </code>
        )
        i = end + 1
        continue
      }
    }
    buffer += ch
    i++
  }
  if (buffer) tokens.push(buffer)
  return tokens
}

function formatLabel(fmt) {
  if (!fmt) return null
  if (fmt === 'pool-1set-25-cap-27') return '1 set to 25 (cap 27)'
  if (fmt === 'pool-2set-25-cap-27') return '2 sets to 25 (cap 27)'
  if (fmt === 'bo3-25-15-cap-17') return 'Best of 3 — 25/25, deciding to 15 (cap 17)'
  if (fmt === 'bo3-25-15-no-cap') return 'Best of 3 — 25/25, deciding to 15 (no cap)'
  return fmt
}

function bracketFormatLabel(fmt) {
  if (fmt === 'crossover-single-elim') return 'Crossover single-elimination'
  if (fmt === 'gold-silver') return 'Gold / Silver brackets'
  return fmt || '—'
}

export default function CaptainsPackage({ tournament, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!tournament) return null
  const hasRules = !!tournament.rules?.trim()
  const hasVenue = !!tournament.venue
  const hasPrize = Number.isFinite(tournament.prizePool)
  const hasFormat = !!tournament.format || !!tournament.bracketFormat || !!tournament.poolMatchFormat
  if (!hasRules && !hasVenue && !hasPrize && !hasFormat) return null

  const bodyId = 'captains-package-body'

  return (
    <section
      aria-labelledby="captains-package-heading"
      className="mb-6 sm:mb-8 rounded-2xl border border-titos-border bg-titos-card overflow-hidden"
    >
      {/* Collapsed header — always visible. Click to expand. The header
          itself surfaces venue + prize + format inline so the user gets
          the at-a-glance info without expanding. Touch target is 56px
          tall on mobile to satisfy the 44px+ guideline plus comfortable
          tap padding. */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center gap-3 text-left hover:bg-titos-elevated/30 transition-colors duration-200 cursor-pointer min-h-[56px]"
      >
        <ClipboardList className="w-5 h-5 text-titos-gold flex-shrink-0" aria-hidden="true" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 id="captains-package-heading" className="font-display text-base sm:text-lg font-bold text-titos-white leading-tight">
              Captain&apos;s Package
            </h2>
            {tournament.format && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-titos-elevated text-[10px] font-bold uppercase tracking-wider text-titos-gold border border-titos-gold/30">
                {tournament.format}
              </span>
            )}
          </div>
          {/* Inline summary chips — venue + prize. Stays on one line on
              desktop, wraps on narrow phones. Tap-through to maps on the
              address chip happens via stopPropagation so opening the
              accordion doesn't fight the link. */}
          <div className="mt-1 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-titos-gray-400">
            {hasVenue && (
              <span className="inline-flex items-center gap-1 truncate max-w-full">
                <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{tournament.venue}</span>
              </span>
            )}
            {hasPrize && (
              <span className="inline-flex items-center gap-1 text-titos-gold font-semibold">
                <Banknote className="w-3 h-3" aria-hidden="true" />
                ${tournament.prizePool}
              </span>
            )}
            {hasRules && !open && (
              <span className="text-titos-gray-500">· Tap to read the rules</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn('w-5 h-5 text-titos-gray-500 transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {/* Expanded body — venue/prize/format grid + rules markdown. */}
      {open && (
        <div id={bodyId} className="border-t border-titos-border/40">
          <div className="grid sm:grid-cols-3 gap-px bg-titos-border/30">
            {/* Venue */}
            <div className="bg-titos-card p-4 sm:p-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-titos-gray-500 inline-flex items-center gap-1.5 mb-2">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                Venue
              </span>
              <p className="font-display text-base sm:text-lg font-bold text-titos-white leading-tight">
                {tournament.venue || 'TBD'}
              </p>
              {tournament.venueAddress && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(tournament.venueAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-xs text-titos-gray-400 hover:text-titos-gold transition-colors underline-offset-2 hover:underline"
                >
                  {tournament.venueAddress}
                </a>
              )}
            </div>

            {/* Prize */}
            <div className="bg-titos-card p-4 sm:p-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-titos-gray-500 inline-flex items-center gap-1.5 mb-2">
                <Banknote className="w-3 h-3" aria-hidden="true" />
                Prize Pool
              </span>
              <p className="font-display text-2xl sm:text-3xl font-black text-titos-gold leading-none">
                {hasPrize ? `$${tournament.prizePool}` : '—'}
              </p>
              <p className="text-xs text-titos-gray-500 mt-1">to the champion</p>
            </div>

            {/* Format */}
            <div className="bg-titos-card p-4 sm:p-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-titos-gray-500 inline-flex items-center gap-1.5 mb-2">
                <Trophy className="w-3 h-3" aria-hidden="true" />
                Format
              </span>
              <p className="text-sm font-bold text-titos-white leading-snug">
                {bracketFormatLabel(tournament.bracketFormat)}
              </p>
              {tournament.poolMatchFormat && (
                <p className="text-[11px] text-titos-gray-400 mt-1.5">
                  <span className="font-bold uppercase tracking-wider text-titos-gray-500">Pool</span>: {formatLabel(tournament.poolMatchFormat)}
                </p>
              )}
              {tournament.bracketMatchFormat && (
                <p className="text-[11px] text-titos-gray-400">
                  <span className="font-bold uppercase tracking-wider text-titos-gray-500">Playoff</span>: {formatLabel(tournament.bracketMatchFormat)}
                </p>
              )}
            </div>
          </div>

          {/* Rules markdown */}
          {hasRules && (
            <div className="px-4 sm:px-5 py-5 sm:py-6 border-t border-titos-border/40">
              {renderMarkdownBlock(tournament.rules, 'rules')}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
