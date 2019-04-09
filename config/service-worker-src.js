// Import from the CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.2.0/workbox-sw.js')

workbox.core.setCacheNameDetails({
  prefix: 'govuk-ds',
  suffix: 'v1',
  precache: 'install-time',
  runtime: 'run-time'
})

// Modify SW update cycle
workbox.core.skipWaiting()
workbox.core.clientsClaim()

workbox.precaching.precacheAndRoute([])

workbox.routing.registerRoute(
  /.*(?:googleapis)\.com/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'govuk-ds-googleapis'
  })
)

workbox.routing.registerRoute(
  /\.(?:js|css|woff2)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'govuk-ds-static-resources',
  })
)

workbox.routing.registerRoute(
  new RegExp('/styles/'),
  new workbox.strategies.CacheFirst()
);
