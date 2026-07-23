// Static loading skeleton for /leagues/[slug] — minimizes CLS while server component fetches.
export default function LeagueDetailLoading() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb + heading */}
        <div className="mb-8">
          <div className="h-4 bg-titos-charcoal rounded w-40 mb-3 animate-pulse" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <div className="h-10 sm:h-12 bg-titos-charcoal rounded w-64 mb-2 animate-pulse" />
              <div className="h-5 bg-titos-charcoal rounded w-24 animate-pulse" />
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 min-h-[72px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card rounded-lg p-3 animate-pulse h-[72px]" />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 min-h-[48px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 w-28 bg-titos-charcoal rounded-lg animate-pulse flex-shrink-0" />
          ))}
        </div>

        {/* Content placeholder */}
        <div className="min-h-[1400px]">
          <div className="card rounded-xl min-h-[1400px] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
