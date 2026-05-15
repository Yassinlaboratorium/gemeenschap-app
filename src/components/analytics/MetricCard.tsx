import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: string
}

export function MetricCard({ label, value, sub, icon: Icon, color = 'text-primary' }: MetricCardProps) {
  return (
    <div className="bg-[#131C31] rounded-[28px] border border-white/5 p-5 space-y-4 group hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider leading-none">{label}</p>
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/8 transition-colors">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-white/25 mt-2">{sub}</p>}
      </div>
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-[#131C31] rounded-[28px] border border-white/5 p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-2.5 bg-white/10 rounded w-20" />
        <div className="w-8 h-8 rounded-xl bg-white/5" />
      </div>
      <div className="h-8 bg-white/10 rounded w-16" />
    </div>
  )
}
