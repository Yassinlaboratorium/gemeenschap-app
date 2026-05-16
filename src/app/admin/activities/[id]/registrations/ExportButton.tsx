'use client'

import { useState } from 'react'
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react'

interface Props {
  data: Record<string, string | number>[]
  filename: string
}

export function ExportButton({ data, filename }: Props) {
  const [loadingXlsx, setLoadingXlsx] = useState(false)

  async function handleExcel() {
    if (data.length === 0) return
    setLoadingXlsx(true)
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Inschrijvingen')
      XLSX.writeFile(wb, `${filename}.xlsx`)
    } finally {
      setLoadingXlsx(false)
    }
  }

  function handleCsv() {
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
    <div className="flex items-center gap-2">
      <button
        onClick={handleExcel}
        disabled={data.length === 0 || loadingXlsx}
        className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 font-semibold px-3 py-2 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-40 text-sm"
        title="Exporteer als Excel (.xlsx)"
      >
        {loadingXlsx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        <span className="hidden sm:inline">Excel</span>
      </button>
      <button
        onClick={handleCsv}
        disabled={data.length === 0}
        className="flex items-center gap-2 text-sm font-semibold text-[#414141]/45 hover:text-[#414141] px-3 py-2 rounded-xl hover:bg-[#F8F8F8] transition-colors disabled:opacity-30 border border-[#D9D9D9] hover:border-[#9FB139]/40"
        title="Exporteer als CSV"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">CSV</span>
      </button>
    </div>
  )
}
