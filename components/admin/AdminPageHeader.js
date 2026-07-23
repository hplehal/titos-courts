import { cn } from '@/lib/utils'

export default function AdminPageHeader({ title, description, children, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="font-display text-2xl font-black text-titos-white">{title}</h1>
        {description && <p className="text-titos-gray-400 text-sm mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3 flex-shrink-0">{children}</div>}
    </div>
  )
}
