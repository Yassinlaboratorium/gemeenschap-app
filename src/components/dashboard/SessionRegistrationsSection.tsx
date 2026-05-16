'use client'

import { useState } from 'react'
import {
  CalendarDays, Clock, MapPin,
  ChevronDown, ChevronUp,
  CheckCircle2, Euro, AlertCircle,
} from 'lucide-react'
import type { SessionRegistrationWithDetails, AccountType, ActivitySession } from '@/types/database'

const MONTHS = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']
const DAYS   = ['zo','ma','di','wo','do','vr','za']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function getAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return `${age} jr`
}

interface RegistrationCardProps {
  reg: SessionRegistrationWithDetails
  accountType: AccountType | null
}

function RegistrationCard({ reg, accountType }: RegistrationCardProps) {
  const isFree    = reg.total_price_cents === 0
  const isPaid    = reg.payment_status === 'paid'
  const isFailed  = reg.payment_status === 'failed'

  const sortedSessions: ActivitySession[] = [...reg.sessions].sort((a, b) =>
    a.session_date.localeCompare(b.session_date)
  )

  return (
    <div className="bg-[#F8F8F8] rounded-xl border border-[#D9D9D9] overflow-hidden">
      {/* Sub-header */}
      <div className="px-4 py-3 border-b border-[#D9D9D9] flex items-center justify-between gap-3">
        <div className="min-w-0">
          {accountType === 'parent' && reg.children ? (
            <p className="font-semibold text-[#414141] text-sm truncate">
              {reg.children.first_name}
              {reg.children.birth_date && (
                <span className="text-[#414141]/45 font-normal ml-1.5">
                  ({getAge(reg.children.birth_date)})
                </span>
              )}
            </p>
          ) : (
            <p className="font-semibold text-[#414141] text-sm">Jouw sessies</p>
          )}
          <p className="text-xs text-[#414141]/35 mt-0.5">
            {sortedSessions.length} sessie{sortedSessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Payment badge */}
        {isFree ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Gratis
          </span>
        ) : isPaid ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Betaald
          </span>
        ) : isFailed ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Mislukt
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Clock className="w-3.5 h-3.5" />
            In afwachting
          </span>
        )}
      </div>

      {/* Session list */}
      <ul className="divide-y divide-[#D9D9D9]">
        {sortedSessions.map(session => (
          <li key={session.id} className="px-4 py-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1B9193]/8 flex items-center justify-center shrink-0 mt-0.5 border border-[#D9D9D9]">
              <CalendarDays className="w-3.5 h-3.5 text-[#1B9193]/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#414141] font-medium">
                {session.title ?? formatDate(session.session_date)}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {session.title && (
                  <span className="flex items-center gap-1 text-xs text-[#414141]/45">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(session.session_date)}
                  </span>
                )}
                {session.start_time && (
                  <span className="flex items-center gap-1 text-xs text-[#414141]/45">
                    <Clock className="w-3 h-3" />
                    {session.start_time.slice(0, 5)}
                    {session.end_time && `–${session.end_time.slice(0, 5)}`}
                  </span>
                )}
                {session.location && (
                  <span className="flex items-center gap-1 text-xs text-[#414141]/45">
                    <MapPin className="w-3 h-3" />
                    {session.location}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer: totaal prijs */}
      {!isFree && (
        <div className="px-4 py-3 border-t border-[#D9D9D9] flex items-center gap-1.5 text-xs text-[#414141]/45">
          <Euro className="w-3.5 h-3.5" />
          <span>
            Totaal:{' '}
            <span className="text-[#414141] font-semibold">
              €{(reg.total_price_cents / 100).toFixed(2)}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

interface Props {
  sessionRegistrations: SessionRegistrationWithDetails[]
  accountType: AccountType | null
}

export function SessionRegistrationsSection({ sessionRegistrations, accountType }: Props) {
  // Groepeer per activiteit
  const grouped = new Map<string, { title: string; tags: string[]; regs: SessionRegistrationWithDetails[] }>()
  for (const reg of sessionRegistrations) {
    if (!grouped.has(reg.activity_id)) {
      grouped.set(reg.activity_id, {
        title: reg.activities.title,
        tags: reg.activities.tags,
        regs: [],
      })
    }
    grouped.get(reg.activity_id)!.regs.push(reg)
  }

  // Start met alle groepen open
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(grouped.keys()))

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#D9D9D9] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#1B9193]/10 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-[#1B9193]" />
        </div>
        <div>
          <h2 className="font-bold text-[#414141]">Sessie-inschrijvingen</h2>
          <p className="text-sm text-[#414141]/45">
            {grouped.size === 0
              ? 'Nog geen sessie-inschrijvingen'
              : `${grouped.size} activiteit${grouped.size !== 1 ? 'en' : ''}`}
          </p>
        </div>
      </div>

      {grouped.size === 0 ? (
        <div className="py-12 text-center space-y-3 px-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1B9193]/8 flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6 text-[#1B9193]/35" />
          </div>
          <div>
            <p className="text-[#414141]/45 font-medium">Nog geen sessie-inschrijvingen</p>
            <p className="text-[#414141]/30 text-sm mt-0.5">
              Schrijf je in voor activiteiten met sessies en ze verschijnen hier.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-[#D9D9D9]">
          {[...grouped.entries()].map(([activityId, group]) => {
            const isOpen = openIds.has(activityId)
            return (
              <div key={activityId}>
                <button
                  onClick={() => toggle(activityId)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F8F8F8] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-[#414141] truncate">{group.title}</span>
                    {group.tags[0] && (
                      <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#9FB139]/10 text-[#9FB139] border border-[#9FB139]/20">
                        {group.tags[0]}
                      </span>
                    )}
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-[#414141]/35 shrink-0 ml-3" />
                    : <ChevronDown className="w-4 h-4 text-[#414141]/35 shrink-0 ml-3" />
                  }
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {group.regs.map(reg => (
                      <RegistrationCard
                        key={reg.id}
                        reg={reg}
                        accountType={accountType}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
