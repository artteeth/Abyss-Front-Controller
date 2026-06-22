// sw.js —— 最简可用版
const CACHE_NAME = 'memory-app-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/memory.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // 把你的关键 CSS/JS 也加进来
]

// 安装：预缓存静态资源
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  )
  self.skipWaiting()
})

// 激活：清理旧缓存
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 请求拦截：
// - API 请求 → 永远走网络（不能缓存对话数据）
// - 静态资源 → 缓存优先，失败回退网络
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // ⚠️ 关键：/api/ 走网络，绝不缓存
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request))
    return
  }

  // 其他静态资源：缓存优先
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        // 顺手把新资源缓存起来
        const copy = res.clone()
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy))
        return res
      }).catch(() => caches.match('/index.html'))  // 离线兜底
    )
  )
})
