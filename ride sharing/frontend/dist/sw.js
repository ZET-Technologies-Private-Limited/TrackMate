const CACHE_NAME = 'rideverse-nexus-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/logo.png',
    '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip socket.io and external tunnel handshake
    if (event.request.url.includes('socket.io')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // Return null if fetch fails to avoid uncaught promise error
                return null;
            });
        })
    );
});
