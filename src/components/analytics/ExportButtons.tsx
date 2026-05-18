'use client'

import { useState } from 'react'
import { FileSpreadsheet, FileText, Presentation, Loader2 } from 'lucide-react'
import type { AnalyticsData } from '@/types/database'

interface Props {
  data: AnalyticsData | null
  dateFrom: string
  dateTo: string
}

const TEAL = [27, 145, 147] as const    // #1B9193
const OLIVE = [159, 177, 57] as const   // #9FB139
const TEXT = [65, 65, 65] as const      // #414141
const LIGHT = [248, 248, 248] as const  // #F8F8F8
const BORDER = [217, 217, 217] as const // #D9D9D9
const WHITE = [255, 255, 255] as const

async function captureElement(id: string): Promise<string | null> {
  const el = document.getElementById(id)
  if (!el) return null
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 1.5,
      useCORS: true,
      logging: false,
    })
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
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

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Metric', 'Waarde'],
        ['Totaal unieke deelnemers', data.metrics.totalParticipants],
        ['Totaal inschrijvingen', data.metrics.totalRegistrations],
        ['Totaal activiteiten', data.metrics.totalActivities],
        ['Totaal inkomsten (€)', (data.metrics.totalRevenueCents / 100).toFixed(2)],
        ['Gemiddelde leeftijd', data.metrics.avgAge ?? 'N/A'],
        ['Meest actieve gemeente', data.metrics.topMunicipality ?? 'N/A'],
      ]), 'Samenvatting')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Gemeente', 'Deelnemers', '% van totaal'],
        ...data.byMunicipality.map(r => [r.municipality, r.count, `${r.pct}%`]),
      ]), 'Per gemeente')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Tag', 'Inschrijvingen', '% van totaal'],
        ...data.byTag.map(r => [r.tag, r.count, `${r.pct}%`]),
      ]), 'Per activiteitstype')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Leeftijdsgroep', 'Jongens', 'Meisjes', 'Anders/onbekend'],
        ...data.byAge.map(r => [r.group, r.male, r.female, r.other]),
      ]), 'Leeftijd & gender')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Maand', 'Totaal (€)'],
        ...data.revenueByMonth.map(r => {
          const total = Object.entries(r).filter(([k]) => k !== 'month').reduce((s, [, v]) => s + (typeof v === 'number' ? v : 0), 0)
          return [r.month, total]
        }),
      ]), 'Financieel per maand')

      XLSX.writeFile(wb, `impact-data-${period}.xlsx`)
    } finally {
      setLoadingExcel(false)
    }
  }

  async function exportPdf() {
    if (!data) return
    setLoadingPdf(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210; const H = 297
      const footer = 'info@degemeenschap.be'

      function addFooter(page: number, total: number) {
        pdf.setFontSize(8)
        pdf.setTextColor(...BORDER)
        pdf.text(footer, W / 2, H - 8, { align: 'center' })
        pdf.text(`${page} / ${total}`, W - 15, H - 8, { align: 'right' })
      }

      // ── Pagina 1: Titelblad ────────────────────────────────
      pdf.setFillColor(...TEAL)
      pdf.rect(0, 0, W, 60, 'F')
      pdf.setFillColor(...WHITE)
      pdf.rect(0, 60, W, H - 60, 'F')

      pdf.setFontSize(26)
      pdf.setTextColor(...WHITE)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Impact Analyse', 20, 35)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Periode: ${dateFrom.slice(0, 10)} — ${dateTo.slice(0, 10)}`, 20, 46)

      pdf.setFontSize(10)
      pdf.setTextColor(...TEXT)
      pdf.text('DE GEMEENSCHAP vzw', 20, 72)
      pdf.text(`Gegenereerd op ${new Date().toLocaleDateString('nl-BE')}`, 20, 80)
      addFooter(1, 4)

      // ── Pagina 2: Key metrics ──────────────────────────────
      pdf.addPage()
      pdf.setFillColor(...WHITE)
      pdf.rect(0, 0, W, H, 'F')
      pdf.setFillColor(...TEAL)
      pdf.rect(0, 0, W, 18, 'F')
      pdf.setFontSize(13)
      pdf.setTextColor(...WHITE)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Key Metrics', 20, 12)

      const metrics = [
        ['Unieke deelnemers', String(data.metrics.totalParticipants), OLIVE],
        ['Inschrijvingen',    String(data.metrics.totalRegistrations), TEAL],
        ['Activiteiten',      String(data.metrics.totalActivities), OLIVE],
        ['Inkomsten',         `€${(data.metrics.totalRevenueCents / 100).toFixed(2)}`, TEAL],
        ['Gem. leeftijd',     data.metrics.avgAge ? `${data.metrics.avgAge} jaar` : 'N/A', OLIVE],
        ['Top gemeente',      data.metrics.topMunicipality ?? 'N/A', TEAL],
      ] as [string, string, readonly [number, number, number]][]

      metrics.forEach(([label, val, color], i) => {
        const col = i % 2; const row = Math.floor(i / 2)
        const x = 15 + col * 95; const y = 28 + row * 48
        pdf.setFillColor(...LIGHT)
        pdf.roundedRect(x, y, 85, 40, 3, 3, 'F')
        pdf.setDrawColor(...BORDER)
        pdf.roundedRect(x, y, 85, 40, 3, 3, 'S')
        pdf.setFontSize(20)
        pdf.setTextColor(...color)
        pdf.setFont('helvetica', 'bold')
        pdf.text(val, x + 42.5, y + 18, { align: 'center' })
        pdf.setFontSize(8)
        pdf.setTextColor(...TEXT)
        pdf.setFont('helvetica', 'normal')
        pdf.text(label.toUpperCase(), x + 42.5, y + 30, { align: 'center' })
      })
      addFooter(2, 4)

      // ── Pagina 3–4: Grafieken ──────────────────────────────
      const chartIds = ['chart-overtime', 'chart-municipality', 'chart-age', 'chart-tags']
      for (let i = 0; i < chartIds.length; i += 2) {
        pdf.addPage()
        pdf.setFillColor(...WHITE)
        pdf.rect(0, 0, W, H, 'F')
        pdf.setFillColor(...TEAL)
        pdf.rect(0, 0, W, 18, 'F')
        pdf.setFontSize(13)
        pdf.setTextColor(...WHITE)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Grafieken', 20, 12)

        for (let j = 0; j < 2 && i + j < chartIds.length; j++) {
          const imgData = await captureElement(chartIds[i + j])
          if (imgData) {
            const imgY = 24 + j * 126
            pdf.setFillColor(...LIGHT)
            pdf.roundedRect(10, imgY - 2, W - 20, 118, 3, 3, 'F')
            pdf.addImage(imgData, 'PNG', 10, imgY, W - 20, 114)
          }
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
      const { default: pptxgen } = await import('pptxgenjs')
      const pptx = new pptxgen()
      pptx.layout = 'LAYOUT_WIDE'

      const BG = 'FFFFFF'
      const PTEAL = '1B9193'
      const POLIVE = '9FB139'
      const PTEXT = '414141'
      const PGRAY = 'A0A0A0'
      const PLIGHT = 'F8F8F8'

      // ── Slide 1: Titelblad ────────────────────────────────
      const s1 = pptx.addSlide()
      s1.background = { color: BG }
      s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 2.4, fill: { color: PTEAL } })
      s1.addText('Impact Analyse', { x: 0.5, y: 0.45, w: 12, h: 1, fontSize: 38, bold: true, color: BG })
      s1.addText(`Periode: ${dateFrom.slice(0, 10)} — ${dateTo.slice(0, 10)}`, { x: 0.5, y: 1.55, w: 12, h: 0.5, fontSize: 16, color: BG })
      s1.addText('DE GEMEENSCHAP vzw', { x: 0.5, y: 3, w: 12, h: 0.5, fontSize: 14, bold: true, color: PTEAL })
      s1.addText(`Gegenereerd op ${new Date().toLocaleDateString('nl-BE')}`, { x: 0.5, y: 3.6, w: 12, h: 0.4, fontSize: 11, color: PGRAY })

      // ── Slide 2: Key metrics ──────────────────────────────
      const s2 = pptx.addSlide()
      s2.background = { color: BG }
      s2.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: PTEAL } })
      s2.addText('Key Metrics', { x: 0.5, y: 0.15, w: 12, h: 0.6, fontSize: 20, bold: true, color: BG })

      const metricsSlide = [
        { label: 'Unieke deelnemers', val: String(data.metrics.totalParticipants), color: POLIVE },
        { label: 'Inschrijvingen',    val: String(data.metrics.totalRegistrations), color: PTEAL },
        { label: 'Activiteiten',      val: String(data.metrics.totalActivities), color: POLIVE },
        { label: 'Inkomsten',         val: `€${(data.metrics.totalRevenueCents / 100).toFixed(0)}`, color: PTEAL },
      ]
      metricsSlide.forEach((m, i) => {
        const col = i % 2; const row = Math.floor(i / 2)
        const x = 0.5 + col * 6.4; const y = 1.2 + row * 2.5
        s2.addShape(pptx.ShapeType.roundRect, { x, y, w: 6, h: 2.1, fill: { color: PLIGHT }, line: { color: 'D9D9D9', width: 1 }, rectRadius: 0.1 })
        s2.addText(m.val, { x: x + 0.3, y: y + 0.3, w: 5.4, h: 0.9, fontSize: 34, bold: true, color: m.color, align: 'center' })
        s2.addText(m.label.toUpperCase(), { x: x + 0.3, y: y + 1.4, w: 5.4, h: 0.4, fontSize: 10, color: PGRAY, align: 'center' })
      })

      // ── Slides 3–6: Grafieken ─────────────────────────────
      const chartSlides = [
        { id: 'chart-overtime',     title: 'Deelnemers over tijd' },
        { id: 'chart-municipality', title: 'Per gemeente' },
        { id: 'chart-age',          title: 'Leeftijdsverdeling' },
        { id: 'chart-tags',         title: 'Activiteitstypes' },
      ]
      for (const { id, title } of chartSlides) {
        const imgData = await captureElement(id)
        const slide = pptx.addSlide()
        slide.background = { color: BG }
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: PTEAL } })
        slide.addText(title, { x: 0.5, y: 0.15, w: 12, h: 0.6, fontSize: 20, bold: true, color: BG })
        if (imgData) {
          slide.addImage({ data: imgData, x: 0.5, y: 1.1, w: 12.33, h: 5.9 })
        } else {
          slide.addText('Grafiek kon niet worden geladen', { x: 0.5, y: 3.5, w: 12, h: 0.5, fontSize: 14, color: PGRAY, align: 'center' })
        }
      }

      // ── Slide: Conclusies ─────────────────────────────────
      const sc = pptx.addSlide()
      sc.background = { color: BG }
      sc.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: POLIVE } })
      sc.addText('Conclusies', { x: 0.5, y: 0.15, w: 12, h: 0.6, fontSize: 20, bold: true, color: BG })

      const bullets = [
        `${data.metrics.totalParticipants} unieke deelnemers bereikt in deze periode.`,
        data.metrics.topMunicipality ? `${data.metrics.topMunicipality} is de meest actieve gemeente.` : null,
        data.metrics.avgAge ? `Gemiddelde leeftijd van deelnemers: ${data.metrics.avgAge} jaar.` : null,
        data.byTag[0] ? `Populairste activiteitstype: "${data.byTag[0].tag}" (${data.byTag[0].pct}%).` : null,
        data.repeatVsNew[1]?.count > 0 ? `${data.repeatVsNew[1].count} terugkerende deelnemers.` : null,
      ].filter(Boolean) as string[]

      bullets.forEach((bullet, i) => {
        sc.addText(`• ${bullet}`, { x: 0.5, y: 1.2 + i * 0.85, w: 12, h: 0.7, fontSize: 14, color: PTEXT })
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
        className="flex items-center gap-2 bg-green-600/10 text-green-700 border border-green-600/20 font-semibold px-4 py-2 rounded-xl hover:bg-green-600/20 transition-colors disabled:opacity-40 text-sm"
      >
        {loadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        Excel
      </button>

      <button
        onClick={exportPdf}
        disabled={!data || loadingPdf}
        className="flex items-center gap-2 bg-red-600/10 text-red-700 border border-red-600/20 font-semibold px-4 py-2 rounded-xl hover:bg-red-600/20 transition-colors disabled:opacity-40 text-sm"
      >
        {loadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        PDF
      </button>

      <button
        onClick={exportPpt}
        disabled={!data || loadingPpt}
        className="flex items-center gap-2 bg-blue-600/10 text-blue-700 border border-blue-600/20 font-semibold px-4 py-2 rounded-xl hover:bg-blue-600/20 transition-colors disabled:opacity-40 text-sm"
      >
        {loadingPpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
        PowerPoint
      </button>
    </div>
  )
}
