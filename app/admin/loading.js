// Static loading skeleton for /admin.
export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="h-8 bg-titos-charcoal rounded w-48 mb-6 animate-pulse" />

      {/* League selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-36 rounded-lg bg-titos-charcoal animate-pulse flex-shrink-0" />
        ))}
      </div>

      {/* Reserve content height */}
      <div className="min-h-[2000px]" />
    </div>
  )
}
