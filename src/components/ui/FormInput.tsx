'use client'

import { type LucideIcon } from 'lucide-react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: LucideIcon
  optional?: boolean
}

export function FormInput({ label, icon: Icon, optional, ...props }: FormInputProps) {
  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-semibold text-[#414141] mb-1.5" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
        {label}
        {optional && <span className="text-[#414141]/40 font-normal">(optioneel)</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#414141]/40 pointer-events-none" />
        <input
          {...props}
          className="w-full pl-10 pr-4 py-2.5 rounded-[30px] border border-[#D9D9D9] bg-[#F8F8F8] text-[#414141] placeholder:text-[#414141]/35 focus:outline-none focus:ring-2 focus:ring-[#9FB139]/30 focus:border-[#9FB139] text-sm transition-colors"
        />
      </div>
    </div>
  )
}
