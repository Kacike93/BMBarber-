// BM Barberà · Service worker (permet instal·lar la web com a app i veure-la sense connexió)
const VERSION = "bmb-v1";
const CORE = ["/", "/index.html", "/gracias.html", "/manifest.webmanifest", "/images/escudo.png", "/images/icon-192.png", "/images/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // fonts, formularis, etc.: com sempre

  // Pàgines i dades en directe: primer la xarxa (sempre el més nou), si no hi ha connexió la còpia guardada
  if (req.mode === "navigate" || url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((r) => r || (req.mode === "navigate" ? caches.match("/") : undefined)))
    );
    return;
  }
  // Imatges, estils i scripts: la còpia guardada si n'hi ha, i s'actualitza en segon pla
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
