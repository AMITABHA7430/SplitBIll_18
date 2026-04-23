/* eslint-disable no-restricted-globals */
/**
 * SplitDash Service Worker – cache-first for the app shell, network-first
 * for anything else. This is a deliberately small SW: it ships the shell,
 * falls back to the cached index.html on navigation, and does nothing
 * remote (SplitDash has no backend).
 */

const VERSION = 'splitdash-v1'
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL).catch(() => null))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Don't touch cross-origin requests (fonts, etc) – let the browser handle them.
  if (url.origin !== self.location.origin) return

  // Navigation requests → network first with offline fallback to cached index.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put('/index.html', copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Static assets → cache first, network fallback, cache on the way back.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            // Only cache successful same-origin responses.
            if (res.ok && res.type === 'basic') {
              const copy = res.clone()
              caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {})
            }
            return res
          })
          .catch(() => cached)
    )
  )
})
