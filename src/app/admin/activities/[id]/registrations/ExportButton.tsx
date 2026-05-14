'use client'

import { Download } from 'lucide-react'

interface Props {
  data: Record<string, string>[]
  filename: string
}

export function ExportButton({ data, filename }: Props) {
  function handleExport() {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const rows = data.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '')
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-[#2a2a2a] hover:border-white/10"
      title="Exporteer als CSV (opent in Excel)"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Exporteer CSV</span>
    </button>
  )
}
