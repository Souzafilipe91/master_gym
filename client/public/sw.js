const CACHE_NAME = 'gym-master-v7';
const DATA_CACHE_NAME = 'gym-master-data-v7';

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

  if (event.notification.tag === 'rest-end') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
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

// Fetch com timeout — se a rede não responder em `ms` ms, rejeita
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(request).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// Fetch event
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  const isAPIRequest = API_CACHE_PATTERNS.some(pattern =>
    url.pathname.includes(pattern)
  );

  if (isAPIRequest) {
    // Network-first para APIs
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache (offline):', url.pathname);
              return cachedResponse;
            }
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
  } else if (event.request.mode === 'navigate') {
    // Stale-while-revalidate para navegação HTML:
    // 1. Serve do cache imediatamente se disponível (sem tela branca no iPhone)
    // 2. Busca da rede em background e atualiza o cache
    // 3. Se não há cache, aguarda a rede com timeout de 5s
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match('/').then((cachedResponse) => {
          const networkFetch = fetchWithTimeout(event.request, 5000)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put('/', networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Rede falhou ou timeout — retornar cache se disponível
              return cachedResponse || new Response('Offline', { status: 503 });
            });

          // Se temos cache, serve imediatamente e atualiza em background
          // Se não temos cache, espera a rede
          return cachedResponse || networkFetch;
        });
      })
    );
  } else {
    // Cache-first para assets estáticos (JS, CSS, imagens)
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
            return caches.match('/').then(response => {
              return response || new Response('Offline', { status: 503 });
            });
          });
        })
    );
  }
});
