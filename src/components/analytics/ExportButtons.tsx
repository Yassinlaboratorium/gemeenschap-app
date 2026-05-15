'use client'

import { useState } from 'react'
import { FileSpreadsheet, FileText, Presentation, Loader2 } from 'lucide-react'
import type { AnalyticsData } from '@/types/database'

interface Props {
  data: AnalyticsData | null
  dateFrom: string
  dateTo: string
}

export function ExportButtons({ data, dateFrom, dateTo }: Props) {
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingPpt, setLoadingPpt] = useState(false)

  const period = `${dateFrom.slice(0, 10)}_${dateTo.slice(0, 10)}`

  async function exportExcel() {
    if (!data) return
    setLoadingExcel(true)
    try {
      const XLSX = await import('xlsx')

      const wb = XLSX.utils.book_new()

      // Sheet 1: Samenvatting
      const summary = [
        ['Metric', 'Waarde'],
        ['Totaal unieke deelnemers', data.metrics.totalParticipants],
        ['Totaal inschrijvingen', data.metrics.totalRegistrations],
        ['Totaal activiteiten', data.metrics.totalActivities],
        ['Totaal inkomsten (€)', (data.metrics.totalRevenueCents / 100).toFixed(2)],
        ['Gemiddelde leeftijd', data.metrics.avgAge ?? 'N/A'],
        ['Meest actieve gemeente', data.metrics.topMunicipality ?? 'N/A'],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Samenvatting')

      // Sheet 2: Gemeente
      const munSheet = [
        ['Gemeente', 'Deelnemers', '% van totaal'],
        ...data.byMunicipality.map(r => [r.municipality, r.count, `${r.pct}%`]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(munSheet), 'Per gemeente')

      // Sheet 3: Per activiteitstag
      const tagSheet = [
        ['Tag', 'Inschrijvingen', '% van totaal'],
        ...data.byTag.map(r => [r.tag, r.count, `${r.pct}%`]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tagSheet), 'Per activiteitstype')

      // Sheet 4: Leeftijd + gender
      const ageSheet = [
        ['Leeftijdsgroep', 'Jongens', 'Meisjes', 'Anders/onbekend'],
        ...data.byAge.map(r => [r.group, r.male, r.female, r.other]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ageSheet), 'Leeftijd & gender')

      // Sheet 5: Financieel per maand
      const revSheet = [
        ['Maand', 'Totaal (€)'],
        ...data.revenueByMonth.map(r => {
          const total = Object.entries(r).filter(([k]) => k !== 'month').reduce((s, [, v]) => s + (typeof v === 'number' ? v : 0), 0)
          return [r.month, total]
        }),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revSheet), 'Financieel per maand')

      XLSX.writeFile(wb, `impact-data-${period}.xlsx`)
    } finally {
      setLoadingExcel(false)
    }
  }

  async function exportPdf() {
    if (!data) return
    setLoadingPdf(true)
    try {
      const [jspdfMod, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const jsPDF = jspdfMod.default

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210; const pageH = 297
      const footer = 'info@degemeenschap.be'

      function addFooter(page: number, total: number) {
        pdf.setFontSize(8)
        pdf.setTextColor(120)
        pdf.text(footer, pageW / 2, pageH - 8, { align: 'center' })
        pdf.text(`${page} / ${total}`, pageW - 15, pageH - 8, { align: 'right' })
      }

      // Pagina 1: Titel
      pdf.setFillColor(10, 10, 10)
      pdf.rect(0, 0, pageW, pageH, 'F')
      pdf.setFillColor(255, 107, 53)
      pdf.rect(0, 0, 6, pageH, 'F')
      pdf.setFontSize(28)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Impact Analyse', 20, 80)
      pdf.setFontSize(14)
      pdf.setTextColor(180)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Periode: ${dateFrom.slice(0, 10)} — ${dateTo.slice(0, 10)}`, 20, 95)
      pdf.setFontSize(10)
      pdf.text('DE GEMEENSCHAP vzw', 20, 110)
      addFooter(1, 4)

      // Pagina 2: Key metrics
      pdf.addPage()
      pdf.setFillColor(10, 10, 10)
      pdf.rect(0, 0, pageW, pageH, 'F')
      pdf.setFillColor(255, 107, 53)
      pdf.rect(0, 0, 6, pageH, 'F')
      pdf.setFontSize(14)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Key Metrics', 20, 30)

      const metrics = [
        ['Unieke deelnemers', String(data.metrics.totalParticipants)],
        ['Totaal inschrijvingen', String(data.metrics.totalRegistrations)],
        ['Activiteiten', String(data.metrics.totalActivities)],
        ['Inkomsten', `€${(data.metrics.totalRevenueCents / 100).toFixed(2)}`],
        ['Gemiddelde leeftijd', data.metrics.avgAge ? `${data.metrics.avgAge} jaar` : 'N/A'],
        ['Top gemeente', data.metrics.topMunicipality ?? 'N/A'],
      ]
      metrics.forEach(([label, val], i) => {
        const col = i % 2; const row = Math.floor(i / 2)
        const x = 20 + col * 95; const y = 55 + row * 55
        pdf.setFillColor(26, 26, 26)
        pdf.roundedRect(x, y, 85, 45, 4, 4, 'F')
        pdf.setFontSize(22)
        pdf.setTextColor(255, 107, 53)
        pdf.setFont('helvetica', 'bold')
        pdf.text(val, x + 8, y + 22)
        pdf.setFontSize(9)
        pdf.setTextColor(150)
        pdf.setFont('helvetica', 'normal')
        pdf.text(label.toUpperCase(), x + 8, y + 35)
      })
      addFooter(2, 4)

      // Pagina 3-4: Grafieken
      const chartIds = ['chart-overtime', 'chart-municipality', 'chart-age', 'chart-tags']
      for (let i = 0; i < chartIds.length; i += 2) {
        pdf.addPage()
        pdf.setFillColor(10, 10, 10)
        pdf.rect(0, 0, pageW, pageH, 'F')
        pdf.setFillColor(255, 107, 53)
        pdf.rect(0, 0, 6, pageH, 'F')

        for (let j = 0; j < 2 && i + j < chartIds.length; j++) {
          const el = document.getElementById(chartIds[i + j])
          if (!el) continue
          const canvas = await html2canvas.default(el, { backgroundColor: '#1a1a1a', scale: 1.5 })
          const imgData = canvas.toDataURL('image/png')
          const imgY = 20 + j * 130
          pdf.addImage(imgData, 'PNG', 15, imgY, 180, 120)
        }
        addFooter(3 + Math.floor(i / 2), 4)
      }

      pdf.save(`impact-analyse-${period}.pdf`)
    } catch (err) {
      console.error('PDF export fout:', err)
    } finally {
      setLoadingPdf(false)
    }
  }

  async function exportPpt() {
    if (!data) return
    setLoadingPpt(true)
    try {
      const [pptxgen, html2canvas] = await Promise.all([
        import('pptxgenjs'),
        import('html2canvas'),
      ])

      const pptx = new pptxgen.default()
      pptx.layout = 'LAYOUT_WIDE'
      pptx.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' }

      const BG = '0a0a0a'; const ORANGE = 'ff6b35'; const WHITE = 'ffffff'; const GRAY = 'a0a0a0'

      // Slide 1: Titel
      const s1 = pptx.addSlide()
      s1.background = { color: BG }
      s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: ORANGE } })
      s1.addText('Impact Analyse', { x: 0.5, y: 2.2, w: 12, h: 1, fontSize: 40, bold: true, color: WHITE })
      s1.addText(`Periode: ${dateFrom.slice(0, 10)} — ${dateTo.slice(0, 10)}`, { x: 0.5, y: 3.4, w: 12, h: 0.5, fontSize: 18, color: GRAY })
      s1.addText('DE GEMEENSCHAP vzw', { x: 0.5, y: 4.2, w: 12, h: 0.4, fontSize: 14, color: ORANGE })

      // Slide 2: Key metrics
      const s2 = pptx.addSlide()
      s2.background = { color: BG }
      s2.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: ORANGE } })
      s2.addText('Key Metrics', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: WHITE })

      const metricsSlide = [
        { label: 'Unieke deelnemers', val: String(data.metrics.totalParticipants) },
        { label: 'Inschrijvingen', val: String(data.metrics.totalRegistrations) },
        { label: 'Activiteiten', val: String(data.metrics.totalActivities) },
        { label: 'Inkomsten', val: `€${(data.metrics.totalRevenueCents / 100).toFixed(0)}` },
      ]
      metricsSlide.forEach((m, i) => {
        const col = i % 2; const row = Math.floor(i / 2)
        const x = 0.5 + col * 6.3; const y = 1.3 + row * 2.5
        s2.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.8, h: 2, fill: { color: '131C31' }, line: { color: '1e3048', width: 1 }, rectRadius: 0.1 })
        s2.addText(m.val, { x: x + 0.3, y: y + 0.3, w: 5.2, h: 0.9, fontSize: 32, bold: true, color: ORANGE })
        s2.addText(m.label.toUpperCase(), { x: x + 0.3, y: y + 1.3, w: 5.2, h: 0.4, fontSize: 11, color: GRAY })
      })

      // Slides 3-6: Grafieken
      const chartIds = [
        { id: 'chart-overtime', title: 'Deelnemers over tijd' },
        { id: 'chart-municipality', title: 'Per gemeente' },
        { id: 'chart-age', title: 'Leeftijdsverdeling' },
        { id: 'chart-tags', title: 'Activiteitstypes' },
      ]

      for (const { id, title } of chartIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const canvas = await html2canvas.default(el, { backgroundColor: '#1a1a1a', scale: 1.5 })
        const imgData = canvas.toDataURL('image/png')

        const slide = pptx.addSlide()
        slide.background = { color: BG }
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: ORANGE } })
        slide.addText(title, { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 20, bold: true, color: WHITE })
        slide.addImage({ data: imgData, x: 0.5, y: 1.1, w: 12, h: 6 })
      }

      // Slide: Conclusies
      const conclusie = pptx.addSlide()
      conclusie.background = { color: BG }
      conclusie.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: ORANGE } })
      conclusie.addText('Conclusies', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 22, bold: true, color: WHITE })

      const bullets = [
        `${data.metrics.totalParticipants} unieke deelnemers bereikt in deze periode.`,
        data.metrics.topMunicipality ? `${data.metrics.topMunicipality} is de meest actieve gemeente.` : null,
        data.metrics.avgAge ? `Gemiddelde leeftijd van deelnemers: ${data.metrics.avgAge} jaar.` : null,
        data.byTag[0] ? `Populairste activiteitstype: "${data.byTag[0].tag}" (${data.byTag[0].pct}%).` : null,
        data.repeatVsNew[1]?.count > 0 ? `${data.repeatVsNew[1].count} terugkerende deelnemers — sterke loyaliteit.` : null,
      ].filter(Boolean) as string[]

      bullets.forEach((bullet, i) => {
        conclusie.addText(`• ${bullet}`, {
          x: 0.5, y: 1.3 + i * 0.8, w: 12, h: 0.6,
          fontSize: 14, color: GRAY,
        })
      })

      await pptx.writeFile({ fileName: `impact-presentatie-${period}.pptx` })
    } catch (err) {
      console.error('PPT export fout:', err)
    } finally {
      setLoadingPpt(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={exportExcel}
        disabled={!data || loadingExcel}
        className="flex items-center gap-2 bg-green-600/10 text-green-400 border border-green-600/20 font-semibold px-4 py-2 rounded-xl hover:bg-green-600/20 transition-colors disabled:opacity-40 text-sm"
      >
        {loadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        Excel
      </button>

      <button
        onClick={exportPdf}
        disabled={!data || loadingPdf}
        className="flex items-center gap-2 bg-red-600/10 text-red-400 border border-red-600/20 font-semibold px-4 py-2 rounded-xl hover:bg-red-600/20 transition-colors disabled:opacity-40 text-sm"
      >
        {loadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        PDF
      </button>

      <button
        onClick={exportPpt}
        disabled={!data || loadingPpt}
        className="flex items-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 font-semibold px-4 py-2 rounded-xl hover:bg-blue-600/20 transition-colors disabled:opacity-40 text-sm"
      >
        {loadingPpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
        PowerPoint
      </button>
    </div>
  )
}
