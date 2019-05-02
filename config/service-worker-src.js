/* Allow ability to teardown the SW and caches if a buggy SW is deployed
This will:
- Install a blank SW (no-op)
- Reload any tabs under SW control to "unbreak" them
- Remove any existing SW caches for the given domain
*/
const KILLSWITCHENABLED = false;

if (KILLSWITCHENABLED) {
  // install no-op service worker
  self.addEventListener('install', () => {
    // Skip over the "waiting" lifecycle state, to ensure that our
    // new service worker is activated immediately, even if there's
    // another tab open controlled by our older service worker code.
    self.skipWaiting();
  });

  self.addEventListener('activate', activateEvent => {
    // Optional: Get a list of all the current open windows/tabs under
    // our service worker's control, and force them to reload.
    // This can "unbreak" any open windows/tabs as soon as the new
    // service worker activates, rather than users having to manually reload.
    self.clients.matchAll({ type: 'window' }).then(windowClients => {
      windowClients.forEach(windowClient => {
        windowClient.navigate(windowClient.url);
      });
    });

    // delete all existing SW caches
    activateEvent.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              return caches.delete(cacheName);
            })
          ).then(response => {
            console.info('All service worker caches deleted');
          })
        })
    );
  });
} else {
  // Import from the CDN
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.2.0/workbox-sw.js');

  workbox.setConfig({ debug: false });

  // explicitly load the workbox modules being used
  workbox.loadModule('workbox-cacheable-response');

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
  workbox.precaching.precacheAndRoute([], {});

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
        caches.match(request, { cacheName: savedPageCache })
        .then(cacheResponse => {
          // if we have a cached version of the page
          if (cacheResponse){
            // try to update the cached version from the network
            fetchEvent.waitUntil(
              // update the cached version, then message the page
              stashInCache(request, savedPageCache)
            );
            // whatever happens, return the cached version
            return cacheResponse;
          }

          // no cached version, so use the network
          return fetch(request)
          // no network so serve the offline page
          .catch(error => {
            return caches.match(offlinePage, {cacheName: savedPageCache})
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
    const response = await fetch(request);
    // open the cache
    const openCache = await caches.open(cacheName);
    // push the response into the cache and return the outcome
    return await openCache.put(request, response.clone()).then(() => {
      // return the response from the update
      return response;
    });
  }

  /**
   * Let the browser know there's an updated version of the page
   * if a user has stored it in the cache
   */
  // function messagePage(response) {
  //   return self.clients.matchAll().then(function (clients) {
  //     clients.forEach(function (client) {
  //       var message = {
  //         type: 'refresh',
  //         url: response.url,
  //         eTag: response.headers.get('ETag')
  //       };

  //       client.postMessage(message);
  //     });
  //   });
  // }
}
