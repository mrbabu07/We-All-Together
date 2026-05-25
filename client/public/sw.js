const CACHE_NAME = 'dargah-para-v1'
const STATIC_ASSETS = ['/', '/offline.html', '/manifest.webmanifest', '/pwa-icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  const shouldCacheApi =
    request.method === 'GET' &&
    (url.pathname.includes('/notices/') || url.pathname.includes('/payments/my'))

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')))
    return
  }

  if (shouldCacheApi) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request)
          cache.put(request, response.clone())
          return response
        } catch {
          return cache.match(request)
        }
      }),
    )
    return
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})
