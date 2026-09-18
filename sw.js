const CACHE_NAME = 'diroot-school-v2'; // تحديث الإصدار
const OFFLINE_URL = './offline.html';

// الملفات الأساسية للتخزين
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './icon-192.png',
  './icon-512.png'
];

// ===== التثبيت =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
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
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// ===== الاعتراض =====
self.addEventListener('fetch', event => {
  // تجاهل طلبات Google Apps Script و Chrome Extension
  if (
    event.request.url.includes('script.google.com') ||
    event.request.url.includes('chrome-extension://')
  ) {
    return;
  }

  // استراتيجية Network First مع Fallback للكاش
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين النسخة الجديدة في الكاش
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // محاولة جلب من الكاش
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // إذا كان طلب صفحة، أعد صفحة offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
