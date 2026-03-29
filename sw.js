const CACHE = "timbreuse-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  // Network first for GAS sync URLs, cache first for app shell
  if (ev.request.url.includes("script.google.com")) {
    ev.respondWith(
      fetch(ev.request).catch(() => new Response(JSON.stringify({error:"offline"}), {headers:{"Content-Type":"application/json"}}))
    );
    return;
  }
  ev.respondWith(
    caches.match(ev.request).then(cached => cached || fetch(ev.request).then(res => {
      if (res.ok && ev.request.method === "GET") {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(ev.request, clone));
      }
      return res;
    }))
  );
});
