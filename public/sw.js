// Este archivo solo existe para retirar el service worker de la versión PWA
// anterior. La app actual es un sitio web normal y no registra ningún worker.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
    })(),
  )
})
