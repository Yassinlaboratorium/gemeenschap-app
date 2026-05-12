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
      <label className="flex items-center gap-1 text-sm font-semibold text-dark mb-1.5">
        {label}
        {optional && <span className="text-dark/40 font-normal">(optioneel)</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30 pointer-events-none" />
        <input
          {...props}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dark/10 bg-secondary text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors"
        />
      </div>
    </div>
  )
}
