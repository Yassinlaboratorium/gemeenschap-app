import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface PushPayload {
  title: string
  body: string
  url?: string
}

interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
}

export async function POST(req: Request) {
  const vapidEmail = process.env.VAPID_EMAIL ?? ''
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? ''

  // web-push requires a mailto: or https: subject
  const subject = vapidEmail.startsWith('mailto:') || vapidEmail.startsWith('https:')
    ? vapidEmail
    : `mailto:${vapidEmail}`

  if (!vapidPublic || !vapidPrivate || !vapidEmail) {
    console.error('[push/send] VAPID env vars ontbreken:', {
      email: !!vapidEmail,
      public: !!vapidPublic,
      private: !!vapidPrivate,
    })
    return NextResponse.json({ error: 'VAPID configuratie ontbreekt op server' }, { status: 500 })
  }

  webpush.setVapidDetails(subject, vapidPublic, vapidPrivate)

  // Alleen admins mogen pushes sturen
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload: PushPayload = await req.json()
  if (!payload.title || !payload.body) {
    return NextResponse.json({ error: 'title en body zijn verplicht' }, { status: 400 })
  }

  // Haal alle subscriptions op via admin client (bypasses RLS)
  const adminSupabase = createAdminClient()
  const { data: subscriptions, error: dbError } = await adminSupabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .returns<PushSubscriptionRow[]>()

  if (dbError) {
    console.error('[push/send] Database fout:', dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  if (!subscriptions?.length) {
    console.log('[push/send] Geen subscribers in database')
    return NextResponse.json({ sent: 0, message: 'Geen subscribers' })
  }

  console.log(`[push/send] ${subscriptions.length} subscriber(s) gevonden`)

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.length - sent

  // Log fouten zodat ze zichtbaar zijn in Vercel Function logs
  const errors: string[] = []
  const expiredEndpoints: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const err = r.reason as { statusCode?: number; body?: string; message?: string }
      const detail = `endpoint[${i}] statusCode=${err.statusCode} body=${err.body ?? err.message}`
      console.error('[push/send] sendNotification fout:', detail)
      errors.push(detail)
      if (err.statusCode === 410) expiredEndpoints.push(subscriptions[i].endpoint)
    }
  })

  if (expiredEndpoints.length > 0) {
    await adminSupabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints)
    console.log(`[push/send] ${expiredEndpoints.length} verlopen subscription(s) verwijderd`)
  }

  return NextResponse.json({ sent, failed, errors: errors.length ? errors : undefined })
}
