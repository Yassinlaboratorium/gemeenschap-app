import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AnalyticsData } from '@/types/database'

export async function GET(request: NextRequest) {
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom') ?? new Date(new Date().getFullYear(), 0, 1).toISOString()
  const dateTo = searchParams.get('dateTo') ?? new Date().toISOString()
  const municipalities = searchParams.getAll('municipality')

  const admin = createAdminClient()

  // ── Fetch raw session_registrations ──────────────────────
  let srQuery = admin
    .from('session_registrations')
    .select('id, user_id, child_id, activity_id, created_at, payment_status, paid_at, total_price_cents, children(first_name, birth_date, gender, school, municipality, neighborhood, postal_code), profiles!session_registrations_user_id_fkey(municipality, neighborhood)')
    .in('payment_status', ['paid'])
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)

  if (municipalities.length > 0) {
    srQuery = srQuery.in('children.municipality', municipalities)
  }

  // ── Fetch raw registrations (classic) ────────────────────
  let regQuery = admin
    .from('registrations')
    .select('id, user_id, activity_id, created_at, payment_status, paid_at, profiles!registrations_user_id_fkey(municipality, neighborhood, birth_date)')
    .in('payment_status', ['paid'])
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)

  if (municipalities.length > 0) {
    regQuery = regQuery.in('profiles.municipality', municipalities)
  }

  const [{ data: sessionRegs }, { data: classicRegs }, { data: activities }] = await Promise.all([
    srQuery,
    regQuery,
    admin.from('activities').select('id, title, tags, date').eq('is_published', true),
  ])

  const sr = (sessionRegs ?? []) as Array<Record<string, unknown>>
  const cr = (classicRegs ?? []) as Array<Record<string, unknown>>
  const acts = (activities ?? []) as Array<{ id: string; title: string; tags: string[]; date: string }>
  const actMap = new Map(acts.map(a => [a.id, a]))

  // ── Metrics ───────────────────────────────────────────────
  const allUserIds = new Set([
    ...sr.map(r => r.user_id as string),
    ...cr.map(r => r.user_id as string),
  ])
  const totalParticipants = allUserIds.size
  const totalRegistrations = sr.length + cr.length

  const activityIds = new Set([
    ...sr.map(r => r.activity_id as string),
    ...cr.map(r => r.activity_id as string),
  ])
  const totalActivities = activityIds.size

  const totalRevenueCents = sr.reduce((s, r) => s + ((r.total_price_cents as number) ?? 0), 0)

  // Average age from children
  const ages: number[] = sr
    .map(r => (r.children as Record<string, unknown> | null)?.birth_date as string | null)
    .filter(Boolean)
    .map(bd => {
      const diff = Date.now() - new Date(bd!).getTime()
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    })
    .filter(a => a >= 0 && a <= 25)

  const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null

  // Top municipality
  const munCount: Record<string, number> = {}
  for (const r of sr) {
    const c = r.children as Record<string, unknown> | null
    const mun = (c?.municipality as string) ?? (r.profiles as Record<string, unknown> | null)?.municipality as string ?? 'Onbekend'
    munCount[mun] = (munCount[mun] ?? 0) + 1
  }
  for (const r of cr) {
    const mun = (r.profiles as Record<string, unknown> | null)?.municipality as string ?? 'Onbekend'
    munCount[mun] = (munCount[mun] ?? 0) + 1
  }
  const topMunicipality = Object.entries(munCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // ── Participants over time ────────────────────────────────
  const currentYear = new Date(dateFrom).getFullYear()
  const lastYear = currentYear - 1
  const monthMap: Record<string, { thisYear: number; lastYear: number }> = {}
  for (let m = 1; m <= 12; m++) {
    const key = String(m).padStart(2, '0')
    monthMap[key] = { thisYear: 0, lastYear: 0 }
  }

  const allRegs = [
    ...sr.map(r => ({ created_at: r.created_at as string, user_id: r.user_id as string })),
    ...cr.map(r => ({ created_at: r.created_at as string, user_id: r.user_id as string })),
  ]

  for (const r of allRegs) {
    const d = new Date(r.created_at)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    if (d.getFullYear() === currentYear && monthMap[month]) monthMap[month].thisYear++
    if (d.getFullYear() === lastYear && monthMap[month]) monthMap[month].lastYear++
  }

  const MONTH_NAMES = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']
  const participantsOverTime = Object.entries(monthMap).map(([key, val]) => ({
    month: MONTH_NAMES[parseInt(key, 10) - 1],
    ...val,
  }))

  // ── By municipality ───────────────────────────────────────
  const total = Object.values(munCount).reduce((a, b) => a + b, 0) || 1
  const byMunicipality = Object.entries(munCount)
    .sort((a, b) => b[1] - a[1])
    .map(([municipality, count]) => ({ municipality, count, pct: Math.round((count / total) * 100) }))

  // ── By neighborhood ───────────────────────────────────────
  const neighCount: Record<string, number> = {}
  for (const r of sr) {
    const c = r.children as Record<string, unknown> | null
    const n = (c?.neighborhood as string) ?? (r.profiles as Record<string, unknown> | null)?.neighborhood as string
    if (n) neighCount[n] = (neighCount[n] ?? 0) + 1
  }
  const byNeighborhood = Object.entries(neighCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([neighborhood, count]) => ({ neighborhood, count }))

  // ── By age group ─────────────────────────────────────────
  const ageGroups = [
    { label: '0–5', min: 0, max: 5 },
    { label: '6–11', min: 6, max: 11 },
    { label: '12–15', min: 12, max: 15 },
    { label: '16–17', min: 16, max: 17 },
    { label: '18+', min: 18, max: 99 },
  ]

  const byAge = ageGroups.map(grp => {
    const counts = { male: 0, female: 0, other: 0 }
    for (const r of sr) {
      const c = r.children as Record<string, unknown> | null
      if (!c?.birth_date) continue
      const age = Math.floor((Date.now() - new Date(c.birth_date as string).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      if (age >= grp.min && age <= grp.max) {
        const g = (c.gender as string) ?? 'other'
        if (g === 'male') counts.male++
        else if (g === 'female') counts.female++
        else counts.other++
      }
    }
    return { group: grp.label, ...counts }
  })

  // ── By tag ───────────────────────────────────────────────
  const tagCount: Record<string, number> = {}
  for (const r of [...sr, ...cr]) {
    const act = actMap.get(r.activity_id as string)
    if (!act) continue
    for (const tag of (act.tags ?? [])) {
      tagCount[tag] = (tagCount[tag] ?? 0) + 1
    }
  }
  const tagTotal = Object.values(tagCount).reduce((a, b) => a + b, 0) || 1
  const sortedTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1])
  const top5 = sortedTags.slice(0, 5).map(([tag, count]) => ({
    tag, count, pct: Math.round((count / tagTotal) * 100),
  }))
  const overigCount = sortedTags.slice(5).reduce((s, [, c]) => s + c, 0)
  const byTag = overigCount > 0 ? [...top5, { tag: 'Overig', count: overigCount, pct: Math.round((overigCount / tagTotal) * 100) }] : top5

  // ── Repeat vs new ─────────────────────────────────────────
  const prevDateFrom = new Date(new Date(dateFrom).getTime() - (new Date(dateTo).getTime() - new Date(dateFrom).getTime())).toISOString()
  const { data: prevRegs } = await admin
    .from('registrations')
    .select('user_id')
    .in('payment_status', ['paid'])
    .gte('created_at', prevDateFrom)
    .lt('created_at', dateFrom)

  const prevUsers = new Set((prevRegs ?? []).map(r => r.user_id))
  let repeatCount = 0; let newCount = 0
  for (const uid of allUserIds) {
    if (prevUsers.has(uid)) repeatCount++
    else newCount++
  }
  const repeatVsNew = [
    { type: 'Nieuw', count: newCount },
    { type: 'Terugkerend', count: repeatCount },
  ]

  // ── Top schools ───────────────────────────────────────────
  const schoolCount: Record<string, number> = {}
  for (const r of sr) {
    const c = r.children as Record<string, unknown> | null
    if (c?.school) schoolCount[c.school as string] = (schoolCount[c.school as string] ?? 0) + 1
  }
  const topSchools = Object.entries(schoolCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([school, count]) => ({ school, count }))

  // ── Revenue by month ─────────────────────────────────────
  const revByMonth: Record<string, Record<string, number>> = {}
  for (let m = 1; m <= 12; m++) {
    revByMonth[String(m).padStart(2, '0')] = {}
  }
  for (const r of sr) {
    const d = new Date(r.created_at as string)
    if (d.getFullYear() !== currentYear) continue
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const act = actMap.get(r.activity_id as string)
    const tag = act?.tags?.[0] ?? 'Overig'
    revByMonth[month][tag] = (revByMonth[month][tag] ?? 0) + ((r.total_price_cents as number) ?? 0)
  }
  const revenueByMonth = Object.entries(revByMonth).map(([key, tags]) => ({
    month: MONTH_NAMES[parseInt(key, 10) - 1],
    ...Object.fromEntries(Object.entries(tags).map(([k, v]) => [k, Math.round(v / 100)])),
  }))

  const data: AnalyticsData = {
    metrics: { totalParticipants, totalRegistrations, totalActivities, totalRevenueCents, avgAge, topMunicipality },
    participantsOverTime,
    byMunicipality,
    byNeighborhood,
    byAge,
    byTag,
    repeatVsNew,
    topSchools,
    revenueByMonth,
  }

  return NextResponse.json(data)
}
