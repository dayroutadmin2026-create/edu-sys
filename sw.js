const CACHE_NAME = 'diroot-v1';
const OFFLINE_URL = './offline.html';

// ===== التثبيت =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './admin.html',
        './offline.html',
        './manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// ===== التفعيل =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ===== الاعتراض =====
self.addEventListener('fetch', event => {
  // لا نتدخل في طلبات Google Apps Script
  if (event.request.url.includes('script.google.com')) return;
  
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match(OFFLINE_URL);
      }
    })
  );
});
