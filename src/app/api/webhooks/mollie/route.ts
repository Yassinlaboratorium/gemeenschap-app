import { NextRequest, NextResponse } from 'next/server'
import { mollieClient } from '@/lib/mollie'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  console.log('[webhook] POST /api/webhooks/mollie ontvangen')

  let paymentId: string | null = null
  try {
    const formData = await request.formData()
    paymentId = formData.get('id') as string | null
    console.log('[webhook] paymentId uit form data:', paymentId)
  } catch (err) {
    console.error('[webhook] form data parse error:', err)
    return new NextResponse('Ongeldige request body', { status: 400 })
  }

  if (!paymentId) {
    console.error('[webhook] geen payment id in request')
    return new NextResponse('Geen payment id', { status: 400 })
  }

  let payment
  try {
    payment = await mollieClient.payments.get(paymentId)
    console.log('[webhook] Mollie payment opgehaald: status =', payment.status, '| paidAt =', payment.paidAt, '| metadata =', JSON.stringify(payment.metadata))
  } catch (err) {
    console.error('[webhook] Mollie payments.get fout:', err)
    return new NextResponse('Mollie API fout', { status: 500 })
  }

  const supabase = createAdminClient()
  const meta = payment.metadata as Record<string, unknown> | null
  const isSession = meta?.type === 'session'
  console.log('[webhook] isSession:', isSession, '| payment.status:', payment.status)

  if (payment.status === 'paid') {
    if (isSession) {
      console.log('[webhook] updating session_registrations → paid')
      const { error, count } = await supabase
        .from('session_registrations')
        .update({
          payment_status: 'paid',
          paid_at: payment.paidAt ?? new Date().toISOString(),
        })
        .eq('mollie_payment_id', paymentId)
        .eq('payment_status', 'pending')
        .select('id', { count: 'exact', head: true })

      if (error) {
        console.error('[webhook] Supabase session update fout (paid):', error)
        return new NextResponse('Database fout', { status: 500 })
      }
      console.log('[webhook] session_registrations bijgewerkt, rijen:', count)
    } else {
      console.log('[webhook] updating registrations → paid')
      const { error, count } = await supabase
        .from('registrations')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          paid_at: payment.paidAt ?? new Date().toISOString(),
        })
        .eq('mollie_payment_id', paymentId)
        .eq('payment_status', 'pending')
        .select('id', { count: 'exact', head: true })

      if (error) {
        console.error('[webhook] Supabase update fout (paid):', error)
        return new NextResponse('Database fout', { status: 500 })
      }
      console.log('[webhook] registrations bijgewerkt, rijen:', count)
    }
  } else if (payment.status === 'failed' || payment.status === 'expired' || payment.status === 'canceled') {
    if (isSession) {
      console.log('[webhook] updating session_registrations → failed')
      const { error, count } = await supabase
        .from('session_registrations')
        .update({ payment_status: 'failed' })
        .eq('mollie_payment_id', paymentId)
        .eq('payment_status', 'pending')
        .select('id', { count: 'exact', head: true })

      if (error) {
        console.error('[webhook] Supabase session update fout (failed):', error)
        return new NextResponse('Database fout', { status: 500 })
      }
      console.log('[webhook] session_registrations bijgewerkt (failed), rijen:', count)
    } else {
      console.log('[webhook] updating registrations → failed/cancelled')
      const { error, count } = await supabase
        .from('registrations')
        .update({ payment_status: 'failed', status: 'cancelled' })
        .eq('mollie_payment_id', paymentId)
        .eq('payment_status', 'pending')
        .select('id', { count: 'exact', head: true })

      if (error) {
        console.error('[webhook] Supabase update fout (failed):', error)
        return new NextResponse('Database fout', { status: 500 })
      }
      console.log('[webhook] registrations bijgewerkt (failed), rijen:', count)
    }
  } else {
    console.log('[webhook] status niet actionable, geen DB update:', payment.status)
  }

  revalidatePath('/activities')
  revalidatePath('/dashboard')

  console.log('[webhook] klaar, 200 terug naar Mollie')
  return new NextResponse(null, { status: 200 })
}
