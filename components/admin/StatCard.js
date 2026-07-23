import { cn } from '@/lib/utils'

export default function StatCard({ icon: Icon, label, value, sub, tone = 'gold' }) {
  const tones = {
    gold: 'bg-titos-gold/12 text-titos-gold',
    info: 'bg-status-info/12 text-status-info',
    success: 'bg-status-success/12 text-status-success',
    warning: 'bg-status-warning/12 text-status-warning',
  }
  return (
    <div className="card-flat rounded-xl p-4 flex items-start gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', tones[tone])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-titos-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <p className="font-display text-xl font-black text-titos-white leading-tight">{value}</p>
        {sub && <p className="text-titos-gray-400 text-xs mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}
