console.log('SW loaded');

// const CACHE_NAME = 'compass-cache-v1';

self.addEventListener('install', (event) => {
    console.log('SW installing…');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('SW activated!');
    event.waitUntil(self.clients.claim());
});


self.addEventListener('fetch', (_event) => {
    // const url = new URL(event.request.url);
    //
    // // Ignore Next.js dev HMR and static chunks
    // if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/__next/')) {
    //     return;
    // }
    //
    // event.respondWith(
    //     caches.match(event.request).then((cachedResponse) => {
    //         if (cachedResponse) return cachedResponse;
    //
    //         return fetch(event.request).then((networkResponse) => {
    //             return caches.open(CACHE_NAME).then((cache) => {
    //                 // Only cache GET requests to same-origin
    //                 if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
    //                     cache.put(event.request, networkResponse.clone());
    //                 }
    //                 return networkResponse;
    //             });
    //         });
    //     })
    // );
});

// Listen for push events
self.addEventListener('push', event => {
    const data = event.data?.json() || {};
    const title = data.title || 'Notification';
    const options = {
        body: data.body || 'You have a new message',
        icon: '/icons/icon-192x192.png',
        // badge: '/icons/icon-192x192.png',
        data: data.url || '/'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data));
});

