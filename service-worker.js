// Service Worker for AliExpress Smart Tracker
const CACHE_NAME = 'ali-tracker-v2.2.0';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './css/advanced.css',
    './css/advanced-animations.css',
    './css/comparison-ui.css',
    './js/main.js',
    './js/scanner.js',
    './js/achievements.js',
    './js/enhanced.js',
    './js/advanced-features.js',
    './js/advanced-ui.js',
    './js/advanced-sharing.js',
    './js/helper-functions.js',
    './manifest.json'
];

// הוסף אייקונים ל-cache אם הם קיימים
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
iconSizes.forEach(size => {
    urlsToCache.push(`./icons/icon-${size}.png`);
});

console.log('🚀 Service Worker: Starting installation...');

// התקנה
self.addEventListener('install', event => {
    console.log('🔄 Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Caching app shell');
                // הוסף קבצים למטמון אחד אחד עם טיפול בשגיאות
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.log(`⚠️ Failed to cache: ${url}`, error);
                        });
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: All resources cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.log('❌ Service Worker: Cache failed:', error);
            })
    );
});

// הפעלה
self.addEventListener('activate', event => {
    console.log('✅ Service Worker: Activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('🎯 Service Worker: Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch
self.addEventListener('fetch', event => {
    // התעלם מ-extension URLs וקבצי CDN
    if (event.request.url.startsWith('chrome-extension://') || 
        event.request.url.includes('cdn.jsdelivr.net') ||
        event.request.url.includes('fonts.googleapis.com') ||
        event.request.url.includes('fonts.gstatic.com') ||
        event.request.url.includes('www.gstatic.com')) {
        return;
    }
    
    // עבור בקשות ניווט, החזר תמיד את index.html
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html')
                .then(response => response || fetch(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // החזר מהמטמון או תבקש מהרשת
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(fetchResponse => {
                    // אם זה קובץ מקומי, שמור במטמון
                    if (event.request.url.startsWith(self.location.origin)) {
                        return caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, fetchResponse.clone());
                            return fetchResponse;
                        });
                    }
                    return fetchResponse;
                }).catch(() => {
                    // אם יש שגיאה והזה קובץ אייקון, נסה להחזיר אייקון ברירת מחדל
                    if (event.request.url.includes('/icons/')) {
                        return caches.match('./icons/icon-192.png');
                    }
                });
            })
    );
});

// קבלת הודעות
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        console.log('⏩ Service Worker: Skipping waiting');
        self.skipWaiting();
    }
});

console.log('✅ Service Worker: Loaded successfully! 🚀');