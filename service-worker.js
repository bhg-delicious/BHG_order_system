// ==================== service-worker.js ====================
// PWA Service Worker（版本號從 URL 讀取 + 全自動更新版）
// ==========================================================

// 從 SW 的 URL 解析版本號（由 index.html 註冊時帶入 ?v=）
const SW_VERSION = new URL(self.location.href).searchParams.get('v') || 'unknown';
const CACHE_NAME = `bhg-cache-${SW_VERSION}`;

console.log(`📦 Service Worker 啟動，版本: ${SW_VERSION}`);

// 1. 安裝時：不預先快取，直接跳過等待
self.addEventListener('install', function (event) {
  console.log('📦 Service Worker 安裝中...');
  self.skipWaiting();
});

// 2. 啟用時：清除所有舊版快取
self.addEventListener('activate', function (event) {
  console.log('✅ Service Worker 已啟用，清理舊快取...');
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 清除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立刻接管現有頁面
  );
});

// 3. 接收主執行緒的指令（自動更新用）
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ 收到 SKIP_WAITING 指令，立刻接管頁面！');
    self.skipWaiting();
  }
});

// 4. 攔截請求：網路優先 (Network-First)
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // 跳過外部 API、CDN 和 OneSignal
  if (url.includes('script.google.com') ||
      url.includes('supabase.co') ||
      url.includes('onesignal.com') ||
      url.includes('cdnjs.cloudflare.com') ||
      url.includes('jsdelivr.net') ||
      url.includes('www.googletagmanager.com') ||
      url.includes('www.google-analytics.com') ||
      url.includes('rss.xml')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (networkResponse) {
        // 拿到最新資料後，順便更新快取（供離線時使用）
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(function () {
        // 斷網時，才從快取拿資料
        return caches.match(event.request).then(function (cached) {
          // ★ 修復：找不到快取時，回傳合法的 Response，避免 TypeError
          return cached || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
