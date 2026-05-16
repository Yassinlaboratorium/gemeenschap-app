import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: string
}

export function MetricCard({ label, value, sub, icon: Icon, color = 'text-[#9FB139]' }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D9] p-5 space-y-4 group hover:border-[#9FB139]/30 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#414141]/45 uppercase tracking-wider leading-none">{label}</p>
        <div className="w-8 h-8 rounded-xl bg-[#F8F8F8] flex items-center justify-center group-hover:bg-[#9FB139]/10 transition-colors">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-[#414141] leading-none">{value}</p>
        {sub && <p className="text-xs text-[#414141]/35 mt-2">{sub}</p>}
      </div>
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D9] p-5 space-y-4 animate-pulse shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-2.5 bg-[#D9D9D9] rounded w-20" />
        <div className="w-8 h-8 rounded-xl bg-[#F8F8F8]" />
      </div>
      <div className="h-8 bg-[#D9D9D9] rounded w-16" />
    </div>
  )
}
