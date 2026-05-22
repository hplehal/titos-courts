// Captain's Package — public summary of the tournament rules, venue,
// format, and prize. Renders the tournament.rules markdown (a small
// subset: headings, bold, italic, bullet lists, code spans, paragraphs).
// We keep parsing intentionally tiny so we don't ship a 100KB markdown
// runtime for what is, in practice, a single rules card.

import { MapPin, Trophy, ClipboardList, Banknote } from 'lucide-react'

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

export default function CaptainsPackage({ tournament }) {
  if (!tournament) return null
  const hasRules = !!tournament.rules?.trim()
  const hasVenue = !!tournament.venue
  const hasPrize = Number.isFinite(tournament.prizePool)
  const hasFormat = !!tournament.format || !!tournament.bracketFormat || !!tournament.poolMatchFormat
  if (!hasRules && !hasVenue && !hasPrize && !hasFormat) return null

  return (
    <section
      aria-labelledby="captains-package-heading"
      className="mb-10 rounded-2xl border border-titos-border bg-titos-card overflow-hidden"
    >
      <header className="px-5 sm:px-6 py-4 border-b border-titos-border/40 flex items-center gap-2.5 flex-wrap">
        <ClipboardList className="w-5 h-5 text-titos-gold" aria-hidden="true" />
        <h2 id="captains-package-heading" className="font-display text-xl sm:text-2xl font-bold text-titos-white">
          Captain&apos;s Package
        </h2>
        {tournament.format && (
          <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full bg-titos-elevated text-xs font-bold uppercase tracking-wider text-titos-gold border border-titos-gold/30">
            {tournament.format}
          </span>
        )}
      </header>

      <div className="grid md:grid-cols-3 gap-px bg-titos-border/30">
        {/* Venue */}
        <div className="bg-titos-card p-5 sm:p-6">
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
        <div className="bg-titos-card p-5 sm:p-6">
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
        <div className="bg-titos-card p-5 sm:p-6">
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
        <div className="px-5 sm:px-6 py-5 sm:py-6 border-t border-titos-border/40">
          {renderMarkdownBlock(tournament.rules, 'rules')}
        </div>
      )}
    </section>
  )
}
