// Static loading skeleton for /standings — matches client skeleton to prevent CLS.
export default function StandingsLoading() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section heading (label + title + description) ≈ 120px */}
        <div className="mb-8 min-h-[120px]">
          <div className="h-3 w-24 bg-titos-charcoal rounded mb-3 animate-pulse" />
          <div className="h-10 bg-titos-charcoal rounded w-64 mb-3 animate-pulse" />
          <div className="h-4 bg-titos-charcoal rounded w-80 animate-pulse" />
        </div>

        {/* League selector + view toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 min-h-[48px]">
          <div className="h-12 bg-titos-charcoal rounded-lg w-56 animate-pulse" />
          <div className="h-12 bg-titos-charcoal rounded-lg w-40 animate-pulse" />
        </div>

        {/* Team filter reservation (56px) */}
        <div className="mb-6 min-h-[56px]" />

        {/* Standings table placeholder */}
        <div className="card rounded-xl overflow-hidden min-h-[1200px]">
          <div className="px-5 py-3 border-b border-titos-border bg-titos-card animate-pulse">
            <div className="h-5 bg-titos-elevated rounded w-40" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse py-1">
                <div className="w-7 h-7 rounded-full bg-titos-elevated" />
                <div className="h-4 bg-titos-elevated rounded flex-1 max-w-48" />
                <div className="h-4 bg-titos-elevated rounded w-10" />
                <div className="h-4 bg-titos-elevated rounded w-10" />
                <div className="h-4 bg-titos-elevated rounded w-10" />
                <div className="h-4 bg-titos-elevated rounded w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
