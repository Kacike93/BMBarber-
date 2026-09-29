// /api/instagram  ->  últimes publicacions d'Instagram del club (via Behold)
//
// CONFIGURACIÓ: enganxa aquí l'enllaç del teu feed JSON de Behold
// (té aquesta forma: https://feeds.behold.so/XXXXXXXXXXXX).
const BEHOLD_FEED_URL = "";

const CACHE_SEGONS = 3 * 60 * 60; // 3 hores

const pick = (p) =>
  (p.sizes && (p.sizes.medium?.mediaUrl || p.sizes.large?.mediaUrl || p.sizes.small?.mediaUrl)) ||
  (p.mediaType === "VIDEO" ? p.thumbnailUrl : p.mediaUrl) ||
  p.thumbnailUrl || "";

export async function onRequestGet(context) {
  const json = (obj, status = 200, cache = true) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": cache ? `public, max-age=600, s-maxage=${CACHE_SEGONS}` : "no-store",
      },
    });

  if (!BEHOLD_FEED_URL) return json({ error: "Feed no configurat" }, 503, false);

  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/instagram", context.request.url).toString());
  try { const hit = await cache.match(cacheKey); if (hit) return hit; } catch (_) {}

  try {
    const res = await fetch(BEHOLD_FEED_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Behold ha respost ${res.status}`);
    const feed = await res.json();
    const posts = (feed.posts || []).map((p) => ({
      url: p.permalink,
      img: pick(p),
      tipus: p.mediaType === "VIDEO" ? "video" : p.mediaType === "CAROUSEL_ALBUM" ? "album" : "foto",
      text: (p.prunedCaption || p.caption || "").slice(0, 160),
      data: p.timestamp,
    })).filter((p) => p.img && p.url);
    const out = json({ usuari: feed.username || "bm_barbera", posts, actualitzat: new Date().toISOString() });
    try { context.waitUntil(cache.put(cacheKey, out.clone())); } catch (_) {}
    return out;
  } catch (err) {
    return json({ error: String(err.message || err) }, 502, false);
  }
}
