// Static loading skeleton for /admin/seasons.
export default function AdminSeasonsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Title + New Season button row */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-titos-charcoal rounded w-56 animate-pulse" />
        <div className="h-10 bg-titos-charcoal rounded w-36 animate-pulse" />
      </div>

      {/* Seasons by league */}
      <div className="space-y-8 min-h-[1200px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-6 bg-titos-charcoal rounded w-48 mb-4 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="card rounded-xl p-5 min-h-[140px] animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
