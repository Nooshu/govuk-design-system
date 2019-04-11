// Import from the CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.2.0/workbox-sw.js');

const savedPageCache = 'govuk-ds-saved-pages';
const offlinePage = '/offline/index.html';

// set some cache defaults
workbox.core.setCacheNameDetails({
  prefix: 'govuk-ds',
  suffix: 'v1',
  precache: 'install-time',
  runtime: 'run-time'
});

// modify SW update cycle
workbox.core.skipWaiting()
workbox.core.clientsClaim()

// place holder for any precaching
workbox.precaching.precacheAndRoute([],{});

// Use workbox for the handling of static assets
workbox.routing.registerRoute(
  /\.(?:js|css|woff2)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'govuk-ds-static-resources',
  })
);

// Use workbox for the handling of image assets
workbox.routing.registerRoute(
  /\.(?:jpg|jpeg|gif|png|ico|svg)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'govuk-ds-image-resources',
    plugins: [
      new workbox.expiration.Plugin({
        // cache requests for 30 days
        maxAgeSeconds: 30 * 24 * 60 * 60,
        // Only cache 20 requests.
        maxEntries: 20
      })
    ]
  })
);

// Use workbox for the handling of html assets
// last 20 will be stored
workbox.routing.registerRoute(
  ({ event }) => event.request.destination === 'document',
  async ({ event }) => {
    try {
      return await new workbox.strategies.StaleWhileRevalidate({
        cacheName: savedPageCache,
        plugins: [
          new workbox.expiration.Plugin({
            // Only cache 20 requests.
            maxEntries: 20
          })
        ]
      }).handle({ event });
    } catch (error) {
      return caches.match(offlinePage);
    }
  }
);

/**
 * // check for pathname that doesn't end in a '/' doesn't have a '.' (an extension)
    if (url.pathname && !url.pathname.endsWith('/') && !url.pathname.includes('.')) {
      console.warn('Rewriting!', url.pathname)
      // if so rewrite the path to include slash
      url['pathname'] = url['pathname'] + '/index.html'
      return [url]
    }
    return []
 */
