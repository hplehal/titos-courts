import { Camera, ExternalLink } from 'lucide-react'

// "Photos" CTA — opens a Google Drive folder in a new tab. Renders
// nothing when no URL is provided so callers can drop it in
// unconditionally.
//
// Visual weight is intentionally secondary (outline, not filled gold)
// so it doesn't compete with primary CTAs like "View Bracket" on the
// same page.

export default function PhotosLink({ url, label = 'Photos', size = 'md', className = '' }) {
  if (!url) return null
  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-xs gap-1.5'
    : 'px-4 py-2 text-sm gap-2'
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-full border border-titos-gold/40 bg-titos-gold/10 text-titos-gold font-semibold cursor-pointer hover:bg-titos-gold/20 hover:border-titos-gold/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:ring-offset-2 focus-visible:ring-offset-titos-surface ${sizeClasses} ${className}`}
      aria-label={`${label} (opens Google Drive in a new tab)`}
    >
      <Camera className={iconSize} aria-hidden="true" />
      {label}
      <ExternalLink className={`${iconSize} opacity-60`} aria-hidden="true" />
    </a>
  )
}
