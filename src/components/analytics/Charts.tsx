'use client'

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { AnalyticsData } from '@/types/database'

const COLORS = ['#2563EB', '#22C55E', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444']
const GENDER_COLORS = { male: '#3B82F6', female: '#EC4899', other: '#6B7280' }
const TOOLTIP_STYLE = {
  background: '#0d1827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
}
const AXIS_TICK = { fill: 'rgba(255,255,255,0.3)', fontSize: 11 }
const GRID_STROKE = 'rgba(255,255,255,0.05)'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  id?: string
}

function ChartCard({ title, subtitle, children, id }: ChartCardProps) {
  return (
    <div id={id} className="bg-[#131C31] rounded-[28px] border border-white/5 p-6 space-y-5">
      <div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-60 bg-white/5 rounded-xl animate-pulse" />
}

interface Props {
  data: AnalyticsData | null
  loading: boolean
}

export function Charts({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-[#131C31] rounded-[28px] border border-white/5 p-6 space-y-4">
            <div className="h-4 bg-white/10 rounded w-40 animate-pulse" />
            <ChartSkeleton />
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  const tagKeys = [...new Set(data.revenueByMonth.flatMap(m => Object.keys(m).filter(k => k !== 'month')))]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* A. Deelnemers over tijd */}
      <ChartCard title="Deelnemers over tijd" subtitle="Vergelijking huidig jaar vs vorig jaar" id="chart-overtime">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.participantsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            <Line type="monotone" dataKey="thisYear" name="Dit jaar" stroke="#2563EB" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="lastYear" name="Vorig jaar" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* B. Geografische spreiding */}
      <ChartCard title="Deelnemers per gemeente" subtitle="Geografische spreiding" id="chart-municipality">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart layout="vertical" data={data.byMunicipality} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
            <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis dataKey="municipality" type="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v, _, props) => [`${v} (${(props as { payload?: { pct?: number } }).payload?.pct ?? 0}%)`, 'Deelnemers']}
            />
            <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* C. Wijken */}
      {data.byNeighborhood.length > 0 && (
        <ChartCard title="Top 10 wijken" id="chart-neighborhood">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={data.byNeighborhood} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis dataKey="neighborhood" type="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* D. Leeftijdsverdeling */}
      <ChartCard title="Leeftijdsverdeling" subtitle="Per leeftijdsgroep en gender" id="chart-age">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.byAge} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="group" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            <Bar dataKey="male" name="Jongens" stackId="a" fill={GENDER_COLORS.male} />
            <Bar dataKey="female" name="Meisjes" stackId="a" fill={GENDER_COLORS.female} />
            <Bar dataKey="other" name="Anders/onbekend" stackId="a" fill={GENDER_COLORS.other} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* E. Activiteitstypes */}
      <ChartCard title="Activiteitstypes" subtitle="Verdeling per tag" id="chart-tags">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data.byTag}
              dataKey="count"
              nameKey="tag"
              cx="50%"
              cy="50%"
              outerRadius={85}
              label={(props: unknown) => { const p = props as { tag: string; pct: number }; return `${p.tag} ${p.pct}%` }}
              labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            >
              {data.byTag.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* F. Herhaald vs nieuw */}
      <ChartCard title="Nieuwe vs terugkerende deelnemers" id="chart-repeat">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data.repeatVsNew}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              label={(props: unknown) => { const p = props as { type: string; count: number }; return `${p.type}: ${p.count}` }}
              labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            >
              <Cell fill="#2563EB" />
              <Cell fill="#22C55E" />
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* G. Top scholen */}
      {data.topSchools.length > 0 && (
        <ChartCard title="Top scholen" id="chart-schools">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={data.topSchools} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis dataKey="school" type="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} width={140} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#22C55E" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* H. Financieel per maand */}
      <ChartCard title="Inkomsten per maand" subtitle="In euro's, per activiteitstype" id="chart-revenue">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.revenueByMonth} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`€${v}`, '']} />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            {tagKeys.map((tag, i) => (
              <Bar key={tag} dataKey={tag} stackId="rev" fill={COLORS[i % COLORS.length]} radius={i === tagKeys.length - 1 ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  )
}
