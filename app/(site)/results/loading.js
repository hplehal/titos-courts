// Static loading skeleton for /results — matches client skeleton to prevent CLS.
export default function ResultsLoading() {
  return (
    <div className="py-10 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <div className="h-3 w-36 bg-titos-charcoal rounded mb-3 animate-pulse" />
          <div className="h-10 sm:h-12 lg:h-14 bg-titos-charcoal rounded w-48 animate-pulse" />
        </div>

        {/* League selector */}
        <div className="mb-6 min-h-[48px]">
          <div className="h-12 bg-titos-charcoal rounded-lg w-64 animate-pulse" />
        </div>

        {/* Reserved content height — matches ResultsClient's loading skeleton */}
        <div className="min-h-[1800px]" />
      </div>
    </div>
  )
}
