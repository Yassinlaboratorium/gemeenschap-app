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
    <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-white">{value}</p>
      {sub && <p className="text-xs text-white/30">{sub}</p>}
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-5 space-y-3 animate-pulse">
      <div className="h-3 bg-white/10 rounded w-24" />
      <div className="h-8 bg-white/10 rounded w-16" />
      <div className="h-3 bg-white/10 rounded w-20" />
    </div>
  )
}
