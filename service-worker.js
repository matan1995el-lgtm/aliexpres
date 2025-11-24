// ============================================
// Service Worker for AliExpress Smart Tracker
// Version: 3.0.0 - iOS & PWA Optimized
// ============================================

const CACHE_NAME = 'ali-tracker-pwa-v3.0.0';
const API_CACHE_NAME = 'ali-tracker-api-v3.0.0';

// קבצי הליבה של האפליקציה - App Shell
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/browserconfig.xml',
    
    // CSS Files
    '/css/style.css',
    '/css/advanced.css',
    '/css/advanced-animations.css',
    '/css/comparison-ui.css',
    
    // JS Files
    '/js/main.js',
    '/js/scanner.js',
    '/js/achievements.js',
    '/js/enhanced.js',
    '/js/advanced-features.js',
    '/js/advanced-ui.js',
    '/js/advanced-sharing.js',
    '/js/helper-functions.js',
    
    // Icons - Core set
    '/icons/icon-72.png',
    '/icons/icon-144.png',
    '/icons/icon-152.png',
    '/icons/icon-167.png',
    '/icons/icon-180.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// CDN assets שאנחנו רוצים לשמור ב-cache
const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

console.log('🚀 PWA Service Worker: Initializing...');

// ============================================
// התקנת Service Worker
// ============================================

self.addEventListener('install', (event) => {
    console.log('🔄 Service Worker: Installing PWA...');
    
    event.waitUntil(
        Promise.all([
            // Cache core app shell
            caches.open(CACHE_NAME)
                .then((cache) => {
                    console.log('📦 Caching core app shell...');
                    return cache.addAll(CORE_ASSETS)
                        .then(() => {
                            console.log('✅ Core app shell cached successfully');
                        })
                        .catch((error) => {
                            console.error('❌ Failed to cache core assets:', error);
                        });
                }),
            
            // Cache CDN assets
            caches.open(API_CACHE_NAME)
                .then((cache) => {
                    console.log('🌐 Caching CDN assets...');
                    return Promise.all(
                        CDN_ASSETS.map(url => 
                            fetch(url)
                                .then(response => {
                                    if (response.ok) {
                                        return cache.put(url, response);
                                    }
                                })
                                .catch(error => {
                                    console.warn(`⚠️ Failed to cache CDN: ${url}`, error);
                                })
                        )
                    );
                })
        ]).then(() => {
            console.log('🎉 All assets cached successfully');
            return self.skipWaiting();
        }).catch((error) => {
            console.error('💥 Cache installation failed:', error);
        })
    );
});

// ============================================
// הפעלת Service Worker
// ============================================

self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activated for PWA');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // מחק caches ישנים
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('🎯 Claiming clients for PWA');
            return self.clients.claim();
        }).then(() => {
            // Send ready message to all clients
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SW_READY',
                        version: '3.0.0'
                    });
                });
            });
        })
    );
});

// ============================================
// ניהול בקשות Fetch
// ============================================

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip browser extensions and external APIs
    if (request.url.startsWith('chrome-extension://') ||
        request.url.includes('google-analytics') ||
        request.url.includes('gtag')) {
        return;
    }
    
    // Handle navigation requests - Always return the app shell
    if (request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html')
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(request)
                        .then((networkResponse) => {
                            // Cache the new HTML for next time
                            return caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put('/index.html', networkResponse.clone());
                                    return networkResponse;
                                });
                        })
                        .catch(() => {
                            // Fallback to offline page
                            return new Response(
                                `
                                <!DOCTYPE html>
                                <html lang="he" dir="rtl">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>AliExpress Tracker - Offline</title>
                                    <style>
                                        body { 
                                            font-family: system-ui; 
                                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                            color: white;
                                            padding: 40px;
                                            text-align: center;
                                            direction: rtl;
                                        }
                                        .container {
                                            max-width: 500px;
                                            margin: 0 auto;
                                            background: rgba(255,255,255,0.1);
                                            padding: 40px;
                                            border-radius: 20px;
                                            backdrop-filter: blur(10px);
                                        }
                                        .btn {
                                            background: #ff6b6b;
                                            color: white;
                                            border: none;
                                            padding: 12px 24px;
                                            border-radius: 25px;
                                            font-size: 16px;
                                            cursor: pointer;
                                            margin: 10px;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>📡 אתה במצב Offline</h1>
                                        <p>האפליקציה זמינה אך חלק מהפונקציות דורשות חיבור אינטרנט</p>
                                        <p>✅ אתה יכול להמשיך להשתמש בכל התכונות המקומיות</p>
                                        <button class="btn" onclick="location.reload()">נסה שוב</button>
                                    </div>
                                </body>
                                </html>
                                `,
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        });
                })
        );
        return;
    }
    
    // Handle CDN requests - Cache First, then Network
    if (CDN_ASSETS.some(cdnUrl => request.url.includes(cdnUrl))) {
        event.respondWith(
            caches.open(API_CACHE_NAME)
                .then((cache) => {
                    return cache.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            return fetch(request)
                                .then((networkResponse) => {
                                    if (networkResponse.ok) {
                                        cache.put(request, networkResponse.clone());
                                    }
                                    return networkResponse;
                                })
                                .catch(() => {
                                    // Return empty response for failed CDN requests
                                    return new Response('', { 
                                        status: 200,
                                        headers: { 'Content-Type': 'text/css' }
                                    });
                                });
                        });
                })
        );
        return;
    }
    
    // Handle local asset requests - Cache First
    if (request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(request)
                        .then((networkResponse) => {
                            if (networkResponse.ok) {
                                return caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, networkResponse.clone());
                                        return networkResponse;
                                    });
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            // For icons, try to return a default icon
                            if (request.url.includes('/icons/')) {
                                return caches.match('/icons/icon-192.png');
                            }
                            return new Response('Network error happened', {
                                status: 408,
                                headers: { 'Content-Type': 'text/plain' }
                            });
                        });
                })
        );
        return;
    }
});

// ============================================
// קבלת הודעות מהאפליקציה
// ============================================

self.addEventListener('message', (event) => {
    console.log('📨 Service Worker received message:', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            console.log('⏩ Skipping waiting and activating immediately');
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                type: 'VERSION_INFO',
                version: '3.0.0',
                cacheName: CACHE_NAME
            });
            break;
            
        case 'CACHE_URLS':
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        return cache.addAll(event.data.urls);
                    })
            );
            break;
            
        case 'CLEAR_CACHE':
            caches.delete(CACHE_NAME)
                .then(() => {
                    event.ports[0].postMessage({
                        type: 'CACHE_CLEARED',
                        success: true
                    });
                });
            break;
    }
});

// ============================================
// Background Sync (for future features)
// ============================================

self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            doBackgroundSync()
                .then(() => {
                    console.log('✅ Background sync completed');
                })
                .catch((error) => {
                    console.error('❌ Background sync failed:', error);
                })
        );
    }
});

async function doBackgroundSync() {
    // ניתן להוסיף כאן סנכרון נתונים עתידי
    console.log('🔄 Performing background sync...');
    return Promise.resolve();
}

// ============================================
// Push Notifications (for future features)
// ============================================

self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'התראה חדשה מ-AliExpress Tracker',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: data.tag || 'general',
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'פתח אפליקציה'
            },
            {
                action: 'close',
                title: 'סגור'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'AliExpress Tracker', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url === self.location.origin && 'focus' in client) {
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

console.log('✅ PWA Service Worker: Loaded successfully! 🚀');

// ============================================
// Utility Functions
// ============================================

function isCacheable(request) {
    const url = new URL(request.url);
    
    // Don't cache non-GET requests
    if (request.method !== 'GET') return false;
    
    // Don't cache external resources that might be sensitive
    if (url.origin !== self.location.origin) {
        return CDN_ASSETS.some(cdnUrl => request.url.includes(cdnUrl));
    }
    
    // Cache local assets
    return true;
}

function shouldRefreshCache(request) {
    const url = new URL(request.url);
    
    // Always refresh HTML pages
    if (request.mode === 'navigate') return true;
    
    // Refresh CSS and JS files occasionally
    if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
        return Math.random() < 0.1; // 10% chance to refresh
    }
    
    return false;
}