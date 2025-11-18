// Service Worker for AliExpress Smart Tracker PWA
// Version: 2.1.0

const CACHE_NAME = 'aliexpress-tracker-v2.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/advanced.css',
  '/css/advanced-animations.css',
  '/css/comparison-ui.css',
  '/js/main.js',
  '/js/enhanced.js',
  '/js/scanner.js',
  '/js/achievements.js',
  '/js/advanced-features.js',
  '/js/advanced-ui.js',
  '/js/advanced-sharing.js',
  '/js/helper-functions.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// התקנה - Caching של כל הקבצים
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// הפעלה - ניקוי cache ישן
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - אסטרטגיית Cache First עם Fallback
self.addEventListener('fetch', (event) => {
  // דלג על קריאות שאינן GET
  if (event.request.method !== 'GET') return;
  
  // דלג על קריאות לדומיינים חיצוניים (CDN)
  if (!event.request.url.startsWith(self.location.origin)) {
    // עבור CDN - Network First
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // אם אין אינטרנט, נסה cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache First Strategy - עבור קבצים מקומיים
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }
        
        // אם אין ב-cache, נסה לטעון מהרשת
        return fetch(event.request)
          .then((response) => {
            // בדוק שהתגובה תקינה
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // שכפל את התגובה כדי לשמור ב-cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed:', error);
            
            // אם זה HTML, החזר דף offline מותאם אישית
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background Sync - לעתיד (לסנכרון נתונים)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // כאן ניתן להוסיף לוגיקה לסנכרון נתונים
      Promise.resolve()
    );
  }
});

// Push Notifications - לעתיד
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'התראה חדשה!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'פתח',
        icon: '/icons/icon-72.png'
      },
      {
        action: 'close',
        title: 'סגור',
        icon: '/icons/icon-72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AliExpress Tracker', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message Handler - תקשורת עם הדף הראשי
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('Service Worker: Loaded successfully! 🚀');
