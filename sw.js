// © 2026 김용현 — 배포 후 캐시 때문에 옛 버전이 보이는 문제 방지.
// 같은 출처의 GET 요청을 항상 서버에 재검증(no-cache)해서 최신 파일을 받는다 (ETag 304면 비용 거의 없음).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'GET' && url.origin === self.location.origin) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).catch(() => fetch(e.request)));
  }
});
