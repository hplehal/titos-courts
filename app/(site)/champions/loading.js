// Static loading skeleton for /champions. Page doesn't fetch data but the
// fallback keeps viewport reserved while JS hydrates the font + images.
export default function ChampionsLoading() {
  return (
    <div className="py-12 sm:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero heading reservation — matches text-7xl font-black final size */}
        <div className="mb-12 sm:mb-16 min-h-[240px]">
          <div className="h-3 w-36 bg-titos-charcoal rounded mb-4 animate-pulse" />
          <div className="h-16 sm:h-20 lg:h-24 bg-titos-charcoal rounded w-80 mb-3 animate-pulse" />
          <div className="h-16 sm:h-20 lg:h-24 bg-titos-charcoal rounded w-96 animate-pulse" />
        </div>

        {/* Featured champion reservation */}
        <div className="mb-16 min-h-[480px] rounded-xl bg-titos-card animate-pulse" />

        {/* Grid of champions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-titos-card animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
