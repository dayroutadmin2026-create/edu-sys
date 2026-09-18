const CACHE_NAME = 'diroot-admin-v2'; // تحديث الإصدار
const OFFLINE_URL = './offline.html';

const CORE_ASSETS = [
  './',
  './admin.html',
  './manifest-admin.json',
  './offline.html',
  './icon-admin-192.png',
  './icon-admin-512.png'
];

// ===== التثبيت =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW-Admin] Caching core assets');
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ===== التفعيل =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW-Admin] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// ===== الاعتراض =====
self.addEventListener('fetch', event => {
  if (
    event.request.url.includes('script.google.com') ||
    event.request.url.includes('chrome-extension://')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
