// ============================================================
// オフラインでも開けるようにする仕組み(サービスワーカー)
//
// 【動き】
//   1. はじめて開いたとき、アプリのファイルを iPad の中に保存する
//   2. 次からは、保存してあるファイルをすぐ使う(電波がなくても開ける)
//   3. 電波があるときは、裏で新しい版を取りに行って保存しなおす
//      → 設定などを書きかえた場合、「2回目に開いたとき」から新しくなる
// ============================================================
const CACHE = 'yarukoto-v5';
// 保存しておくファイルの一覧
const FILES = ['./', 'index.html', 'style.css', 'config.js', 'voice.js', 'pictures.js', 'japan_map.js', 'app.js', 'icon.png', 'manifest.json'];

// はじめて読み込まれたとき:ファイルをまとめて保存する
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// 新しい版に切り替わったとき:古い保存場所を片づける
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ファイルが必要になったとき
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const saved = await cache.match(e.request, { ignoreSearch: true });
      // 裏で新しい版を取りに行く(取れたら保存しなおす。取れなくても気にしない)
      const fresh = fetch(e.request)
        .then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => null);
      // 保存してあればそれをすぐ返す。なければ取りに行った結果を返す
      if (saved) { e.waitUntil(fresh); return saved; }
      return (await fresh) || new Response('オフラインです', { status: 503 });
    })
  );
});
