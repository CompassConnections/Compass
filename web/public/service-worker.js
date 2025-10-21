console.log('SW loaded');

const CACHE_NAME = 'compass-cache-v1';

self.addEventListener('install', (event) => {
    console.log('SW installing…');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('SW activated!');
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Only cache GET requests to same-origin
                    if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });
            });
        })
    );
});
