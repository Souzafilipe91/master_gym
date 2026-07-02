const CACHE_NAME = 'filipe-treinos-v5';
const DATA_CACHE_NAME = 'filipe-treinos-data-v5';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/trpc/workouts',
  '/api/trpc/exercises',
  '/api/trpc/cycles',
  '/api/trpc/anamnese',
];

// Responder a cliques em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Ao clicar na notificação de fim de descanso, abrir/focar o app
  if (event.notification.tag === 'rest-end') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Se o app já está aberto, focar nele
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não está aberto, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Check if this is an API request
  const isAPIRequest = API_CACHE_PATTERNS.some(pattern => 
    url.pathname.includes(pattern)
  );

  if (isAPIRequest) {
    // Network-first strategy for API requests
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache (offline):', url.pathname);
              return cachedResponse;
            }
            // No cache available
            return new Response(
              JSON.stringify({ error: 'Offline and no cache available' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }

          const fetchRequest = event.request.clone();

          return fetch(fetchRequest).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            if (event.request.method === 'GET' && !url.pathname.includes('/api/')) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }

            return response;
          }).catch(() => {
            // For navigation requests, serve the index.html from cache (SPA fallback)
            if (event.request.mode === 'navigate') {
              return caches.match('/').then(response => {
                return response || new Response('Offline', { status: 503 });
              });
            }
            return caches.match('/');
          });
        })
    );
  }
});
