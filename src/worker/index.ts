/// <reference lib="webworker" />

// Dit bestand wordt gecompileerd als service worker (WebWorker lib, niet DOM).
// Zie src/worker/tsconfig.json voor de juiste compiler-opties.

interface PushPayload {
  title?: string
  body?: string
  url?: string
  icon?: string
}

const sw = self as unknown as ServiceWorkerGlobalScope

sw.addEventListener('push', (event: PushEvent) => {
  const data: PushPayload = event.data?.json() ?? {}
  event.waitUntil(
    sw.registration.showNotification(data.title ?? 'DE GEMEENSCHAP', {
      body: data.body ?? 'Nieuw bericht',
      icon: data.icon ?? '/icon-192',
      badge: '/icon-192',
      data: { url: data.url ?? '/activities' },
    })
  )
})

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url: string = (event.notification.data as PushPayload).url ?? '/activities'
  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients: readonly WindowClient[]) => {
        const existing = clients.find((c) => c.url === url)
        if (existing) return existing.focus()
        return sw.clients.openWindow(url)
      })
  )
})
