// Static loading skeleton for /schedule — matches final page chrome to minimize CLS.
export default function ScheduleLoading() {
  return (
    <div className="py-10 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <div className="h-3 w-24 bg-titos-charcoal rounded mb-3 animate-pulse" />
          <div className="h-10 sm:h-12 lg:h-14 bg-titos-charcoal rounded w-56 animate-pulse" />
        </div>

        {/* League selector + team filter row (48-56px) */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 min-h-[48px]">
          <div className="h-12 bg-titos-charcoal rounded-lg w-full sm:w-64 animate-pulse" />
          <div className="h-12 bg-titos-charcoal rounded-lg w-full sm:w-48 animate-pulse" />
        </div>

        {/* Content area reservation — matches client skeleton height to prevent shift */}
        <div className="min-h-[2600px]" />
      </div>
    </div>
  )
}
