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
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

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
  const { data: subscriptions } = await adminSupabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .returns<PushSubscriptionRow[]>()

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0, message: 'Geen subscribers' })
  }

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

  // Verwijder verlopen subscriptions (410 Gone)
  const expiredEndpoints = results
    .map((r, i) =>
      r.status === 'rejected' &&
      (r.reason as { statusCode?: number })?.statusCode === 410
        ? subscriptions[i].endpoint
        : null
    )
    .filter(Boolean) as string[]

  if (expiredEndpoints.length > 0) {
    await adminSupabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints)
  }

  return NextResponse.json({ sent, failed })
}
