// Service Worker for 세이프리 (Safely)
// Provides offline caching for map tiles, API responses, and static assets

const CACHE_NAME = 'safely-v1';
const STATIC_CACHE = 'static-assets-v1';
const API_CACHE = 'api-responses-v1';
const MAP_CACHE = 'map-tiles-v1';

// Assets to cache immediately on service worker installation
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/safely-logo.png',
  '/safely-logo.png',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main-app.js'
];

// API endpoints to cache with stale-while-revalidate strategy
const API_ENDPOINTS = [
  '/api/places',
  '/api/accidents'
];

// Kakao Map tile patterns to cache
const MAP_TILE_PATTERNS = [
  /^https:\/\/map\d+\.daumcdn\.net\/map_2d/,
  /^https:\/\/map\d+\.daumcdn\.net\/map_skyview/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== MAP_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests with stale-while-revalidate
  if (isAPIRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Handle Kakao map tiles with cache-first strategy
  if (isMapTileRequest(url)) {
    event.respondWith(cacheFirst(request, MAP_CACHE));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Handle navigation requests with network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncOfflineData());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || '세이프리 알림',
      icon: data.icon || '/safely-logo.png',
      badge: '/safely-logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || '1',
      },
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/safely-logo.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/safely-logo.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || '세이프리',
        options
      )
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(clients.openWindow('/'));
  } else if (event.action === 'close') {
    // Just close, no action needed
    return;
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

// Caching Strategies

// Cache-first strategy - good for static assets and map tiles
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Clone the response before caching
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first error:', error);
    // Return offline fallback if available
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy - good for navigation requests
async function networkFirst(request, cacheName) {
  try {
    console.log('[SW] Network-first fetch:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Cache hit (fallback):', request.url);
      return cachedResponse;
    }
    
    console.error('[SW] Network-first error:', error);
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy - good for API responses
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh data in the background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        console.log('[SW] Updating cache:', request.url);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[SW] Background fetch failed:', error);
    });

  // Return cached version immediately if available, otherwise wait for network
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  } else {
    console.log('[SW] No cache, waiting for network:', request.url);
    return fetchPromise;
  }
}

// Helper Functions

function isAPIRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint)) ||
         url.pathname.startsWith('/api/');
}

function isMapTileRequest(url) {
  return MAP_TILE_PATTERNS.some(pattern => pattern.test(url.href));
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.gif') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

// Background sync for offline data
async function syncOfflineData() {
  try {
    const cache = await caches.open('offline-forms');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
          console.log('[SW] Synced offline data:', request.url);
        }
      } catch (error) {
        console.error('[SW] Failed to sync:', request.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_MEASURE') {
    console.log('[SW] Performance measure:', event.data.measure);
  }
});

console.log('[SW] Service worker script loaded');