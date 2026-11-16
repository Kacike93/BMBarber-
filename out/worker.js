var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/api/classificacio.js
var URL_CLASSIFICACIO = "https://resultadosbalonmano.isquad.es/clasificacion.php?seleccion=0&id=1038541&id_ambito=0&id_territorial=17&id_superficie=1&iframe=0&id_categoria=3077&id_competicion=211864";
var FED_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; BMBarberaWeb/1.0)",
  "Accept-Language": "es,ca;q=0.9",
  Cookie: "resultados_version=clasica-sesion"
};
var NAMED = { aacute: "\xE1", eacute: "\xE9", iacute: "\xED", oacute: "\xF3", uacute: "\xFA", Aacute: "\xC1", Eacute: "\xC9", Iacute: "\xCD", Oacute: "\xD3", Uacute: "\xDA", agrave: "\xE0", egrave: "\xE8", ograve: "\xF2", Agrave: "\xC0", Egrave: "\xC8", Ograve: "\xD2", ccedil: "\xE7", Ccedil: "\xC7", ntilde: "\xF1", Ntilde: "\xD1", uuml: "\xFC", Uuml: "\xDC", iuml: "\xEF", Iuml: "\xCF", middot: "\xB7", ordf: "\xAA", ordm: "\xBA" };
var decode = /* @__PURE__ */ __name((s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m), "decode");
var text = /* @__PURE__ */ __name((html) => decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim(), "text");
var firstInt = /* @__PURE__ */ __name((s) => {
  const m = String(s).match(/-?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}, "firstInt");
var KEEP = /* @__PURE__ */ new Set(["BM", "CH", "AB", "SMA", "SMC", "CE", "CB", "UE", "HC", "SE", "FC", "CD", "AE", "CN", "SD", "II", "III", "IEM", "CEM", "PEM", "ZEM", "CEH", "MGC", "PAV", "EUE"]);
var LOWER = /* @__PURE__ */ new Set(["DE", "DEL", "I", "Y", "D'"]);
function niceName(raw) {
  return raw.split(" ").map((w, i) => {
    const bare = w.replace(/[()'".,]/g, "");
    if (KEEP.has(bare) || /^[A-Z]$/.test(bare)) return w;
    if (i > 0 && LOWER.has(w)) return w.toLowerCase();
    return w.charAt(0) + w.slice(1).toLocaleLowerCase("ca");
  }).join(" ");
}
__name(niceName, "niceName");
function parse(html) {
  const tables2 = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  const table = tables2.find((t) => /\bPT\b/.test(text(t)) && /\bPJ\b/.test(text(t)) && /\bDIF\b/.test(text(t)));
  if (!table) throw new Error("No s'ha trobat la taula de classificaci\xF3");
  const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const cellsOf2 = /* @__PURE__ */ __name((r) => r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [], "cellsOf");
  const headerRow = rows.find((r) => /\bPT\b/.test(text(r)) && /\bPJ\b/.test(text(r)));
  const heads = cellsOf2(headerRow).map((c) => text(c).toUpperCase());
  const col = /* @__PURE__ */ __name((name, fallback) => {
    const i = heads.findIndex((h) => h === name);
    return i >= 0 ? i : fallback;
  }, "col");
  const C = {
    equip: heads.findIndex((h) => h.startsWith("EQUIPO") || h.startsWith("EQUIP")),
    pt: col("PT", 3),
    pj: col("PJ", 4),
    pg: col("PG", 5),
    pe: col("PE", 6),
    pp: col("PP", 7),
    gf: col("GF", 8),
    gc: col("GC", 9)
  };
  if (C.equip < 0) C.equip = 1;
  const equips = [];
  for (const r of rows) {
    if (r === headerRow) continue;
    const cells = cellsOf2(r);
    if (cells.length < 8) continue;
    const t = cells.map(text);
    const link = cells[C.equip].match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    let nom = text(link ? link[1] : cells[C.equip]).replace(/^[-+]?\d+\s+/, "").trim();
    if (!nom) continue;
    const formCell = t.find((x, i) => i !== C.equip && /^([-GEP]\s*){2,}$/.test(x));
    const ratxa = formCell ? formCell.replace(/[^GEP]/g, "") : "";
    equips.push({
      equip: niceName(nom),
      pt: firstInt(t[C.pt]),
      pj: firstInt(t[C.pj]),
      pg: firstInt(t[C.pg]),
      pe: firstInt(t[C.pe]),
      pp: firstInt(t[C.pp]),
      gf: firstInt(t[C.gf]),
      gc: firstInt(t[C.gc]),
      ratxa,
      nosaltres: /BARBER/i.test(nom)
    });
  }
  if (!equips.length) throw new Error("La taula \xE9s buida");
  const titol = (html.match(/<h4[^>]*>([^<]*LLIGA[^<]*)<\/h4>/i) || [])[1];
  return {
    competicio: titol ? text(titol) : null,
    jornada: Math.max(...equips.map((e) => e.pj)),
    actualitzat: (/* @__PURE__ */ new Date()).toISOString(),
    font: URL_CLASSIFICACIO,
    equips
  };
}
__name(parse, "parse");
var CACHE_SEGONS = 1800;
async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/classificacio", context.request.url).toString());
  try {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  } catch (_) {
  }
  try {
    const res = await fetch(URL_CLASSIFICACIO, { headers: FED_HEADERS });
    if (!res.ok) throw new Error(`La federaci\xF3 ha respost ${res.status}`);
    const data = parse(await res.text());
    const response = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=300, s-maxage=${CACHE_SEGONS}`
      }
    });
    try {
      context.waitUntil(cache.put(cacheKey, response.clone()));
    } catch (_) {
    }
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
}
__name(onRequestGet, "onRequestGet");

// functions/api/instagram.js
var BEHOLD_FEED_URL = "https://feeds.behold.so/c9eOgc1NQvGcNsXAoi3F";
var CACHE_SEGONS2 = 3 * 60 * 60;
var pick = /* @__PURE__ */ __name((p) => p.sizes && (p.sizes.medium?.mediaUrl || p.sizes.large?.mediaUrl || p.sizes.small?.mediaUrl) || (p.mediaType === "VIDEO" ? p.thumbnailUrl : p.mediaUrl) || p.thumbnailUrl || "", "pick");
async function onRequestGet2(context) {
  const json2 = /* @__PURE__ */ __name((obj, status = 200, cache2 = true) => new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache2 ? `public, max-age=600, s-maxage=${CACHE_SEGONS2}` : "no-store"
    }
  }), "json");
  if (!BEHOLD_FEED_URL) return json2({ error: "Feed no configurat" }, 503, false);
  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/instagram", context.request.url).toString());
  try {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch (_) {
  }
  try {
    const res = await fetch(BEHOLD_FEED_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Behold ha respost ${res.status}`);
    const feed = await res.json();
    const posts = (feed.posts || []).map((p) => ({
      url: p.permalink,
      img: pick(p),
      tipus: p.mediaType === "VIDEO" ? "video" : p.mediaType === "CAROUSEL_ALBUM" ? "album" : "foto",
      text: (p.prunedCaption || p.caption || "").slice(0, 160),
      data: p.timestamp
    })).filter((p) => p.img && p.url);
    const out = json2({ usuari: feed.username || "bm_barbera", posts, actualitzat: (/* @__PURE__ */ new Date()).toISOString() });
    try {
      context.waitUntil(cache.put(cacheKey, out.clone()));
    } catch (_) {
    }
    return out;
  } catch (err) {
    return json2({ error: String(err.message || err) }, 502, false);
  }
}
__name(onRequestGet2, "onRequestGet");

// functions/api/equip.js
var EQUIPS_CONFIG = [
  // MASCULÍ
  { id: "senior-a", grup: "masculi", curt: "S\xE8nior A", nom: "S\xE8nior A mascul\xED", equip: 201858, fase: 1038541 },
  { id: "senior-b", grup: "masculi", curt: "S\xE8nior B", nom: "S\xE8nior B mascul\xED", equip: 201861, fase: 1038564 },
  { id: "master-masculi", grup: "masculi", curt: "M\xE0ster", nom: "M\xE0ster mascul\xED", equip: 222713, fase: 1040350 },
  { id: "juvenil-masculi", grup: "masculi", curt: "Juvenil", nom: "Juvenil mascul\xED", equip: 201865, fase: 1038641 },
  { id: "cadet-masculi", grup: "masculi", curt: "Cadet", nom: "Cadet mascul\xED", equip: 212802, fase: 1038648 },
  { id: "infantil-masculi", grup: "masculi", curt: "Infantil A", nom: "Infantil A mascul\xED", equip: 201867, fase: 1038654 },
  { id: "infantil-atletic-masculi", grup: "masculi", curt: "Infantil Atl\xE8tic", nom: "Infantil Atl\xE8tic mascul\xED", equip: 225709, fase: 1038760 },
  // FEMENÍ
  { id: "juvenil-femeni", grup: "femeni", curt: "Juvenil", nom: "Juvenil femen\xED", equip: 225708, fase: 1038688 },
  { id: "cadet-femeni", grup: "femeni", curt: "Cadet", nom: "Cadet femen\xED", equip: 219123, fase: 1038577 },
  { id: "infantil-femeni", grup: "femeni", curt: "Infantil", nom: "Infantil femen\xED", equip: 210508, fase: 1038703 },
  // MIXT
  { id: "alevi-mixt", grup: "mixt", curt: "Alev\xED A", nom: "Alev\xED A mixt", equip: 210347, fase: 1040304 },
  { id: "alevi-atletic-mixt", grup: "mixt", curt: "Alev\xED Atl\xE8tic", nom: "Alev\xED Atl\xE8tic mixt", equip: 222330, fase: 1040311 }
];
var EQUIPS = EQUIPS_CONFIG.map((e) => ({
  ...e,
  url: `https://resultadosbalonmano.isquad.es/equipo.php?seleccion=0&id_superficie=1&id_equipo=${e.equip}&id=${e.fase}`
}));
var CACHE_SEGONS3 = 600;
var CP1252 = { "\u20AC": 128, "\u201A": 130, "\u0192": 131, "\u201E": 132, "\u2026": 133, "\u2020": 134, "\u2021": 135, "\u02C6": 136, "\u2030": 137, "\u0160": 138, "\u2039": 139, "\u0152": 140, "\u017D": 142, "\u2018": 145, "\u2019": 146, "\u201C": 147, "\u201D": 148, "\u2022": 149, "\u2013": 150, "\u2014": 151, "\u02DC": 152, "\u2122": 153, "\u0161": 154, "\u203A": 155, "\u0153": 156, "\u017E": 158, "\u0178": 159 };
function fixText(s) {
  if (!/[ÃÂ]/.test(s)) return s;
  try {
    const bytes = Uint8Array.from([...s].map((c) => CP1252[c] ?? (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63)));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (_) {
    return s;
  }
}
__name(fixText, "fixText");
var clean = /* @__PURE__ */ __name((html) => fixText(text(html)), "clean");
var isBarbera = /* @__PURE__ */ __name((s) => /BARBER/i.test(s), "isBarbera");
var tables = /* @__PURE__ */ __name((html) => html.match(/<table[\s\S]*?<\/table>/gi) || [], "tables");
var rowsOf = /* @__PURE__ */ __name((t) => t.match(/<tr[\s\S]*?<\/tr>/gi) || [], "rowsOf");
var cellsOf = /* @__PURE__ */ __name((r) => r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [], "cellsOf");
var LOGO_HOSTS = ["balonmano.isquad.es", "balonmano.misquad.es", "resultadosbalonmano.isquad.es"];
var BASE = "https://resultadosbalonmano.isquad.es/";
function logoUrl(raw) {
  if (!raw || /^data:/i.test(raw) || /(blank|loading|spacer|pixel)\./i.test(raw)) return "";
  try {
    const abs = new URL(raw.replace(/&amp;/g, "&"), BASE);
    if (!LOGO_HOSTS.includes(abs.hostname)) return "";
    abs.protocol = "https:";
    return abs.toString();
  } catch (_) {
    return "";
  }
}
__name(logoUrl, "logoUrl");
var imgsOf = /* @__PURE__ */ __name((h) => [...h.matchAll(/<img\b[^>]*>/gi)].map((m) => {
  const tag = m[0];
  const attr = /* @__PURE__ */ __name((n) => (tag.match(new RegExp(n + `\\s*=\\s*["']([^"']+)["']`, "i")) || [])[1], "attr");
  return logoUrl(attr("data-src") || attr("data-original") || attr("data-lazy-src") || attr("src"));
}).filter(Boolean), "imgsOf");
var anchorTexts = /* @__PURE__ */ __name((h) => [...h.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => clean(m[1])).filter((t) => t && !/^equipo\.php/i.test(t) && t !== "VS"), "anchorTexts");
function parseClassificacio(html) {
  const t = tables(html).find((x) => {
    const s = text(x).toUpperCase();
    return /\b(PUNTOS|PT)\b/.test(s) && /\bGF\b/.test(s) && /\bGC\b/.test(s);
  });
  if (!t) return [];
  const rows = rowsOf(t);
  const head = rows.find((r) => /\b(PUNTOS|PT)\b/i.test(text(r)));
  const H = cellsOf(head || "").map((c) => text(c).toUpperCase());
  const idx = /* @__PURE__ */ __name((...names) => H.findIndex((h) => names.includes(h)), "idx");
  const C = { pt: idx("PUNTOS", "PT"), pj: idx("JUG", "PJ"), pg: idx("GAN", "PG"), pe: idx("EMP", "PE"), pp: idx("PER", "PP"), gf: idx("GF"), gc: idx("GC") };
  const out = [];
  for (const r of rows) {
    if (r === head) continue;
    const cells = cellsOf(r);
    if (cells.length < 8) continue;
    const t2 = cells.map(clean);
    let nom = "";
    for (let i = 1; i < cells.length; i++) {
      const cand = anchorTexts(cells[i])[0] || t2[i];
      if (cand && !/^-?\d+$/.test(cand) && !/^equipo\.php/i.test(cand)) {
        nom = cand;
        break;
      }
    }
    if (!nom) continue;
    const pick2 = /* @__PURE__ */ __name((k, fb) => firstInt(t2[C[k] >= 0 ? C[k] : fb]), "pick");
    out.push({
      pos: firstInt(t2[0]) || out.length + 1,
      equip: niceName(nom),
      logo: imgsOf(r)[0] || "",
      pt: pick2("pt", 3),
      pj: pick2("pj", 4),
      pg: pick2("pg", 5),
      pe: pick2("pe", 6),
      pp: pick2("pp", 7),
      gf: pick2("gf", 8),
      gc: pick2("gc", 9),
      nosaltres: isBarbera(nom)
    });
  }
  return out;
}
__name(parseClassificacio, "parseClassificacio");
function parsePartits(html) {
  const t = tables(html).find((x) => {
    const s = text(x).toUpperCase();
    return s.includes("MARCADOR") && s.includes("FECHA");
  });
  if (!t) return [];
  const rows = rowsOf(t);
  const head = rows.find((r) => /MARCADOR/i.test(text(r)));
  const H = cellsOf(head || "").map((c) => text(c).toUpperCase());
  const col = /* @__PURE__ */ __name((name, fb) => {
    const i = H.findIndex((h) => h.startsWith(name));
    return i >= 0 ? i : fb;
  }, "col");
  const C = { eq: col("EQUIPO", 0), mar: col("MARCADOR", 1), data: col("FECHA", 2), lloc: col("LUGAR", 3), estat: col("ESTADO", 4) };
  const out = [];
  for (const r of rows) {
    if (r === head) continue;
    const cells = cellsOf(r);
    if (cells.length < 5) continue;
    const noms = anchorTexts(cells[C.eq]);
    if (noms.length < 2) continue;
    const logos = imgsOf(cells[C.eq]);
    const marc = clean(cells[C.mar]).match(/(\d+)\s*-\s*(\d+)/);
    const dm = clean(cells[C.data]).match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    const estatRaw = clean(cells[C.estat]).toLowerCase();
    const estat = /final/.test(estatRaw) ? "finalitzat" : /juego|directo|curso/.test(estatRaw) ? "en-joc" : /aplaz|suspend/.test(estatRaw) ? "ajornat" : "pendent";
    out.push({
      local: niceName(noms[0]),
      visitant: niceName(noms[1]),
      logoLocal: logos[0] || "",
      logoVisitant: logos[1] || "",
      golsLocal: marc ? +marc[1] : null,
      golsVisitant: marc ? +marc[2] : null,
      data: dm ? `${dm[3]}-${dm[2]}-${dm[1]}` + (dm[4] ? `T${dm[4].padStart(2, "0")}:${dm[5]}` : "") : null,
      lloc: niceName(clean(cells[C.lloc]).replace(/\s+\(.*?\)\s*$/, "") || ""),
      estat,
      barberaLocal: isBarbera(noms[0]),
      barberaVisitant: isBarbera(noms[1])
    });
  }
  return out;
}
__name(parsePartits, "parsePartits");
function parseEquip(html, base) {
  if (base) BASE = base;
  const plain = fixText(text(html));
  let competicio = null;
  const m1 = plain.match(/CLASIFICACI[ÓO]N\s*-\s*(.{5,140}?\bGrup\s+[A-Z0-9]+)/i) || plain.match(/CLASIFICACI[ÓO]N\s*-\s*(.{5,120}?)\s+Posici[óo]n/i);
  if (m1) competicio = m1[1].trim();
  if (!competicio) {
    const m2 = plain.match(/((?:LLIGA|PRIMERA|SEGONA|TERCERA|COPA|LIGA|DIVISI)[A-ZÀ-Ü\s'·.-]+?-\s*[^-]+?-\s*Grup\s+\w+)/);
    if (m2) competicio = m2[1].trim();
  }
  return { competicio, classificacio: parseClassificacio(html), partits: parsePartits(html) };
}
__name(parseEquip, "parseEquip");
var json = /* @__PURE__ */ __name((obj, status = 200, maxAge = CACHE_SEGONS3) => new Response(JSON.stringify(obj), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": maxAge ? `public, max-age=300, s-maxage=${maxAge}` : "no-store"
  }
}), "json");
async function onRequestList() {
  const r = json({ equips: EQUIPS.map(({ id, grup, curt, nom, url }) => ({ id, grup, curt, nom, font: url })) }, 200, 0);
  r.headers.set("Cache-Control", "public, max-age=60");
  return r;
}
__name(onRequestList, "onRequestList");
var fresh = /* @__PURE__ */ __name((r) => new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Versio": "5" } }), "fresh");
async function onRequestGet3(context) {
  const url = new URL(context.request.url);
  const eq = EQUIPS.find((e) => e.id === url.searchParams.get("id"));
  if (!eq) return json({ error: "Equip desconegut" }, 404, 0);
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/equip?id=${eq.id}&f=${eq.fase}&e=${eq.equip}&v=5`);
  let stale = null;
  try {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const age = Date.now() - Number(hit.headers.get("X-Llegit") || 0);
      if (age < CACHE_SEGONS3 * 1e3) return fresh(hit);
      stale = hit;
    }
  } catch (_) {
  }
  try {
    const res = await fetch(eq.url, { headers: FED_HEADERS, cache: "no-store" });
    if (!res.ok) throw new Error(`La federaci\xF3 ha respost ${res.status}`);
    const data = parseEquip(await res.text(), eq.url);
    if (!data.classificacio.length && !data.partits.length) throw new Error("No s'han trobat dades a la p\xE0gina");
    const body = JSON.stringify({ versio: 5, id: eq.id, nom: eq.nom, font: eq.url, actualitzat: (/* @__PURE__ */ new Date()).toISOString(), ...data });
    const stored = new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=86400", "X-Llegit": String(Date.now()) } });
    try {
      context.waitUntil(cache.put(cacheKey, stored.clone()));
    } catch (_) {
    }
    return fresh(stored);
  } catch (err) {
    if (stale) return fresh(stale);
    return json({ error: String(err.message || err), font: eq.url }, 502, 0);
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestLogo(context) {
  const url = new URL(context.request.url);
  let target;
  try {
    target = new URL(url.searchParams.get("u") || "");
  } catch (_) {
    return new Response("Bad request", { status: 400 });
  }
  if (!LOGO_HOSTS.includes(target.hostname)) return new Response("Forbidden", { status: 403 });
  const cache = caches.default;
  const cacheKey = new Request(url.toString());
  try {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch (_) {
  }
  try {
    const res = await fetch(target.toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; BMBarberaWeb/1.0)", Referer: "https://resultadosbalonmano.isquad.es/", Accept: "image/*" } });
    const type = res.headers.get("Content-Type") || "";
    if (!res.ok || !type.startsWith("image/")) throw new Error("no image");
    const out = new Response(res.body, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=604800, s-maxage=604800" } });
    try {
      context.waitUntil(cache.put(cacheKey, out.clone()));
    } catch (_) {
    }
    return out;
  } catch (_) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  }
}
__name(onRequestLogo, "onRequestLogo");

// src/worker.js
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const context = { request, env, waitUntil: /* @__PURE__ */ __name((p) => ctx.waitUntil(p), "waitUntil") };
    if (url.pathname === "/api/classificacio") return onRequestGet(context);
    if (url.pathname === "/api/instagram") return onRequestGet2(context);
    if (url.pathname === "/api/equips") return onRequestList(context);
    if (url.pathname === "/api/equip") return onRequestGet3(context);
    if (url.pathname === "/api/logo") return onRequestLogo(context);
    return env.ASSETS.fetch(request);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
