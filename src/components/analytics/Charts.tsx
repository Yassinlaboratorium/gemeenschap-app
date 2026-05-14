'use client'

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { AnalyticsData } from '@/types/database'

const COLORS = ['#ff6b35', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4']
const GENDER_COLORS = { male: '#3b82f6', female: '#ec4899', other: '#6b7280' }

interface ChartCardProps {
  title: string
  children: React.ReactNode
  id?: string
}

function ChartCard({ title, children, id }: ChartCardProps) {
  return (
    <div id={id} className="bg-dark rounded-2xl border border-[#2a2a2a] p-6 space-y-4">
      <h3 className="font-bold text-white text-sm">{title}</h3>
      {children}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
  )
}

interface Props {
  data: AnalyticsData | null
  loading: boolean
}

export function Charts({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-dark rounded-2xl border border-[#2a2a2a] p-6 space-y-4">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* A. Deelnemers over tijd */}
      <ChartCard title="Deelnemers over tijd" id="chart-overtime">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.participantsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff' }} />
            <Legend wrapperStyle={{ color: '#999', fontSize: 12 }} />
            <Line type="monotone" dataKey="thisYear" name="Dit jaar" stroke="#ff6b35" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="lastYear" name="Vorig jaar" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* B. Geografische spreiding */}
      <ChartCard title="Deelnemers per gemeente" id="chart-municipality">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart layout="vertical" data={data.byMunicipality}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} />
            <YAxis dataKey="municipality" type="category" tick={{ fill: '#aaa', fontSize: 11 }} width={90} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff' }}
              formatter={(v, _, props) => [`${v} (${(props as { payload?: { pct?: number } }).payload?.pct ?? 0}%)`, 'Deelnemers']}
            />
            <Bar dataKey="count" fill="#ff6b35" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* C. Wijken */}
      {data.byNeighborhood.length > 0 && (
        <ChartCard title="Top 10 wijken" id="chart-neighborhood">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={data.byNeighborhood}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis dataKey="neighborhood" type="category" tick={{ fill: '#aaa', fontSize: 11 }} width={110} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* D. Leeftijdsverdeling */}
      <ChartCard title="Leeftijdsverdeling" id="chart-age">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.byAge}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="group" tick={{ fill: '#aaa', fontSize: 11 }} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff' }} />
            <Legend wrapperStyle={{ color: '#999', fontSize: 12 }} />
            <Bar dataKey="male" name="Jongens" stackId="a" fill={GENDER_COLORS.male} />
            <Bar dataKey="female" name="Meisjes" stackId="a" fill={GENDER_COLORS.female} />
            <Bar dataKey="other" name="Anders/onbekend" stackId="a" fill={GENDER_COLORS.other} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* E. Activiteitstypes */}
      <ChartCard title="Activiteitstypes (tags)" id="chart-tags">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data.byTag}
              dataKey="count"
              nameKey="tag"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(props: unknown) => { const p = props as { tag: string; pct: number }; return `${p.tag} ${p.pct}%` }}
              labelLine={{ stroke: '#444' }}
            >
              {data.byTag.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* F. Herhaald vs nieuw */}
      <ChartCard title="Nieuwe vs terugkerende deelnemers" id="chart-repeat">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data.repeatVsNew}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              label={(props: unknown) => { const p = props as { type: string; count: number }; return `${p.type}: ${p.count}` }}
            >
              <Cell fill="#ff6b35" />
              <Cell fill="#3b82f6" />
            </Pie>
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* G. Top scholen */}
      {data.topSchools.length > 0 && (
        <ChartCard title="Top scholen" id="chart-schools">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={data.topSchools}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis dataKey="school" type="category" tick={{ fill: '#aaa', fontSize: 10 }} width={130} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* H. Financieel per maand */}
      <ChartCard title="Inkomsten per maand (€)" id="chart-revenue">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.revenueByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="month" tick={{ fill: '#aaa', fontSize: 11 }} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, color: '#fff' }} />
            <Legend wrapperStyle={{ color: '#999', fontSize: 12 }} />
            {tagKeys.map((tag, i) => (
              <Bar key={tag} dataKey={tag} stackId="rev" fill={COLORS[i % COLORS.length]} radius={i === tagKeys.length - 1 ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  )
}
