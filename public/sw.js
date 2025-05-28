const CACHE_NAME = 'money-tracker-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - implement different strategies based on request type
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // API requests - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
  }
  // Static assets - Cache First strategy
  else if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
  }
  // Other requests - Stale While Revalidate strategy
  else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Network First strategy - good for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache First strategy - good for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Stale While Revalidate strategy - good for other resources
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  return cachedResponse || fetchPromise;
} 