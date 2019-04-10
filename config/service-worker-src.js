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
workbox.precaching.precacheAndRoute([]);

// Use workbox for the handling of static assets
workbox.routing.registerRoute(
  /\.(?:js|css|woff2)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'govuk-ds-static-resources',
  })
)

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

// custom HTML handling code
addEventListener('fetch', fetchEvent =>{
  // store the original request
  const request = fetchEvent.request;

  // if the request is from a HTML page
  if (request.headers.get('Accept').includes('text/html')){
    // respond to the request with the code inside
    fetchEvent.respondWith(
      // look for the HTML in ANY of the caches
      caches.match(request)
      .then(cacheResponse => {
        // if we have a cached version of the page
        if (cacheResponse){
          // try to update the cached version from the network
          fetchEvent.waitUntil(
            stashInCache(request, savedPageCache)
          );
          // whatever happens, return the cached version
          return cacheResponse;
        }

        // no cached version, so use the network
        return fetch(request)
        // no network so serve the offline page
        .catch(error => {
          return caches.match(offlinePage)
        })
      })
    )
  }
});

/**
 * Stash in cache as an async function
 */
async function stashInCache(request, cacheName) {
  // grab the request from the network
  const theRequest = await fetch(request);
  // open the cache
  const openCache = await caches.open(cacheName);
  // push the response into the cache and return the outcome
  return await openCache.put(request, theRequest);
}

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
