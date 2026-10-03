// /api/equips            -> llista d'equips de la pàgina de resultats
// /api/equip?id=senior-a -> classificació i partits d'un equip (dades de la federació)
//
// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓ DELS EQUIPS
//  Cada enllaç de la federació té dos números:
//     equipo.php?id_equipo=201858&id=1038541
//                          ^^^^^^    ^^^^^^^
//                          equip     fase (competició + fase + grup)
//  · equip: la fitxa de l'equip aquesta temporada (normalment no canvia).
//  · fase:  canvia quan comença una fase nova -> NOMÉS CAL CANVIAR AQUEST NÚMERO.
//  grup: "masculi", "femeni" o "mixt" · curt: text del botó · nom: títol
// ─────────────────────────────────────────────────────────────────────────────
import { text, firstInt, niceName } from "./classificacio.js";

const EQUIPS_CONFIG = [
  // MASCULÍ
  { id: "senior-a",        grup: "masculi", curt: "Sènior A", nom: "Sènior A masculí",  equip: 201858, fase: 1038541 },
  { id: "senior-b",        grup: "masculi", curt: "Sènior B", nom: "Sènior B masculí",  equip: 201861, fase: 1038564 },
  { id: "master-masculi",  grup: "masculi", curt: "Màster",   nom: "Màster masculí",    equip: 222713, fase: 1040350 },
  { id: "juvenil-masculi", grup: "masculi", curt: "Juvenil",  nom: "Juvenil masculí",   equip: 201865, fase: 1038641 },
  { id: "cadet-masculi",   grup: "masculi", curt: "Cadet",    nom: "Cadet masculí",     equip: 212802, fase: 1038648 },
  { id: "infantil-masculi",grup: "masculi", curt: "Infantil A", nom: "Infantil A masculí", equip: 201867, fase: 1038654 },
  { id: "infantil-atletic-masculi", grup: "masculi", curt: "Infantil Atlètic", nom: "Infantil Atlètic masculí", equip: 225709, fase: 1038760 },
  // FEMENÍ
  { id: "juvenil-femeni",  grup: "femeni",  curt: "Juvenil",  nom: "Juvenil femení",    equip: 225708, fase: 1038688 },
  { id: "cadet-femeni",    grup: "femeni",  curt: "Cadet",    nom: "Cadet femení",      equip: 219123, fase: 1038577 },
  { id: "infantil-femeni", grup: "femeni",  curt: "Infantil", nom: "Infantil femení",   equip: 210508, fase: 1038703 },
  // MIXT
  { id: "alevi-mixt",      grup: "mixt",    curt: "Aleví A",  nom: "Aleví A mixt",      equip: 210347, fase: 1040304 },
  { id: "alevi-atletic-mixt", grup: "mixt", curt: "Aleví Atlètic", nom: "Aleví Atlètic mixt", equip: 222330, fase: 1040311 },
];

export const EQUIPS = EQUIPS_CONFIG.map((e) => ({
  ...e,
  url: `https://resultadosbalonmano.isquad.es/equipo.php?seleccion=0&id_superficie=1&id_equipo=${e.equip}&id=${e.fase}`,
}));

const CACHE_SEGONS = 600; // 10 minuts: cada quant es torna a llegir la federació

// Arregla textos mal codificats de la federació (p. ex. "PAVELLÃ“" -> "PAVELLÓ")
const CP1252 = { "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f };
function fixText(s) {
  if (!/[ÃÂ]/.test(s)) return s;
  try {
    const bytes = Uint8Array.from([...s].map((c) => CP1252[c] ?? (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 0x3f)));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (_) { return s; }
}
const clean = (html) => fixText(text(html));
const isBarbera = (s) => /BARBER/i.test(s);

const tables = (html) => html.match(/<table[\s\S]*?<\/table>/gi) || [];
const rowsOf = (t) => t.match(/<tr[\s\S]*?<\/tr>/gi) || [];
const cellsOf = (r) => r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
const LOGO_HOSTS = ["balonmano.isquad.es", "balonmano.misquad.es", "resultadosbalonmano.isquad.es"];
let BASE = "https://resultadosbalonmano.isquad.es/";
function logoUrl(raw) {
  if (!raw || /^data:/i.test(raw) || /(blank|loading|spacer|pixel)\./i.test(raw)) return "";
  try {
    const abs = new URL(raw.replace(/&amp;/g, "&"), BASE);
    if (!LOGO_HOSTS.includes(abs.hostname)) return "";
    abs.protocol = "https:";
    return abs.toString();
  } catch (_) { return ""; }
}
const imgsOf = (h) => [...h.matchAll(/<img\b[^>]*>/gi)].map((m) => {
  const tag = m[0];
  const attr = (n) => (tag.match(new RegExp(n + "\\s*=\\s*[\"']([^\"']+)[\"']", "i")) || [])[1];
  return logoUrl(attr("data-src") || attr("data-original") || attr("data-lazy-src") || attr("src"));
}).filter(Boolean);
const anchorTexts = (h) => [...h.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => clean(m[1])).filter((t) => t && !/^equipo\.php/i.test(t) && t !== "VS");

function parseClassificacio(html) {
  const t = tables(html).find((x) => { const s = text(x).toUpperCase(); return /\b(PUNTOS|PT)\b/.test(s) && /\bGF\b/.test(s) && /\bGC\b/.test(s); });
  if (!t) return [];
  const rows = rowsOf(t);
  const head = rows.find((r) => /\b(PUNTOS|PT)\b/i.test(text(r)));
  const H = cellsOf(head || "").map((c) => text(c).toUpperCase());
  const idx = (...names) => H.findIndex((h) => names.includes(h));
  const C = { pt: idx("PUNTOS", "PT"), pj: idx("JUG", "PJ"), pg: idx("GAN", "PG"), pe: idx("EMP", "PE"), pp: idx("PER", "PP"), gf: idx("GF"), gc: idx("GC") };
  const out = [];
  for (const r of rows) {
    if (r === head) continue;
    const cells = cellsOf(r);
    if (cells.length < 8) continue;
    const t2 = cells.map(clean);
    // Nom: primera cel·la amb text que no sigui un número ni un enllaç
    let nom = "";
    for (let i = 1; i < cells.length; i++) {
      const cand = anchorTexts(cells[i])[0] || t2[i];
      if (cand && !/^-?\d+$/.test(cand) && !/^equipo\.php/i.test(cand)) { nom = cand; break; }
    }
    if (!nom) continue;
    const pick = (k, fb) => firstInt(t2[C[k] >= 0 ? C[k] : fb]);
    out.push({
      pos: firstInt(t2[0]) || out.length + 1,
      equip: niceName(nom), logo: imgsOf(r)[0] || "",
      pt: pick("pt", 3), pj: pick("pj", 4), pg: pick("pg", 5), pe: pick("pe", 6), pp: pick("pp", 7), gf: pick("gf", 8), gc: pick("gc", 9),
      nosaltres: isBarbera(nom),
    });
  }
  return out;
}

function parsePartits(html) {
  const t = tables(html).find((x) => { const s = text(x).toUpperCase(); return s.includes("MARCADOR") && s.includes("FECHA"); });
  if (!t) return [];
  const rows = rowsOf(t);
  const head = rows.find((r) => /MARCADOR/i.test(text(r)));
  const H = cellsOf(head || "").map((c) => text(c).toUpperCase());
  const col = (name, fb) => { const i = H.findIndex((h) => h.startsWith(name)); return i >= 0 ? i : fb; };
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
      local: niceName(noms[0]), visitant: niceName(noms[1]),
      logoLocal: logos[0] || "", logoVisitant: logos[1] || "",
      golsLocal: marc ? +marc[1] : null, golsVisitant: marc ? +marc[2] : null,
      data: dm ? `${dm[3]}-${dm[2]}-${dm[1]}` + (dm[4] ? `T${dm[4].padStart(2, "0")}:${dm[5]}` : "") : null,
      lloc: niceName(clean(cells[C.lloc]).replace(/\s+\(.*?\)\s*$/, "") || ""),
      estat,
      barberaLocal: isBarbera(noms[0]), barberaVisitant: isBarbera(noms[1]),
    });
  }
  return out;
}

export function parseEquip(html, base) {
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

const json = (obj, status = 200, maxAge = CACHE_SEGONS) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": maxAge ? `public, max-age=300, s-maxage=${maxAge}` : "no-store",
    },
  });

export async function onRequestList() {
  const r = json({ equips: EQUIPS.map(({ id, grup, curt, nom, url }) => ({ id, grup, curt, nom, font: url })) }, 200, 0);
  r.headers.set("Cache-Control", "public, max-age=60");
  return r;
}

// Resposta per al navegador: que no la guardi més d'un minut
const fresh = (r) => new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" } });

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const eq = EQUIPS.find((e) => e.id === url.searchParams.get("id"));
  if (!eq) return json({ error: "Equip desconegut" }, 404, 0);

  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/equip?id=${eq.id}&f=${eq.fase}&e=${eq.equip}&v=4`);
  // La memòria cau es comprova a mà: si les dades tenen més de 10 minuts, es tornen a llegir
  let stale = null;
  try {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const age = Date.now() - Number(hit.headers.get("X-Llegit") || 0);
      if (age < CACHE_SEGONS * 1000) return fresh(hit);
      stale = hit;
    }
  } catch (_) {}

  try {
    const res = await fetch(eq.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; BMBarberaWeb/1.0)", "Accept-Language": "es,ca;q=0.9" }, cache: "no-store" });
    if (!res.ok) throw new Error(`La federació ha respost ${res.status}`);
    const data = parseEquip(await res.text(), eq.url);
    if (!data.classificacio.length && !data.partits.length) throw new Error("No s'han trobat dades a la pàgina");
    const body = JSON.stringify({ id: eq.id, nom: eq.nom, font: eq.url, actualitzat: new Date().toISOString(), ...data });
    const stored = new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=86400", "X-Llegit": String(Date.now()) } });
    try { context.waitUntil(cache.put(cacheKey, stored.clone())); } catch (_) {}
    return fresh(stored);
  } catch (err) {
    if (stale) return fresh(stale); // la federació no respon: mostrem l'última còpia
    return json({ error: String(err.message || err), font: eq.url }, 502, 0);
  }
}

// /api/logo?u=...  -> escut d'un equip servit des de la nostra web (la federació no deixa enllaçar-los directament)
export async function onRequestLogo(context) {
  const url = new URL(context.request.url);
  let target;
  try { target = new URL(url.searchParams.get("u") || ""); } catch (_) { return new Response("Bad request", { status: 400 }); }
  if (!LOGO_HOSTS.includes(target.hostname)) return new Response("Forbidden", { status: 403 });
  const cache = caches.default;
  const cacheKey = new Request(url.toString());
  try { const hit = await cache.match(cacheKey); if (hit) return hit; } catch (_) {}
  try {
    const res = await fetch(target.toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; BMBarberaWeb/1.0)", Referer: "https://resultadosbalonmano.isquad.es/", Accept: "image/*" } });
    const type = res.headers.get("Content-Type") || "";
    if (!res.ok || !type.startsWith("image/")) throw new Error("no image");
    const out = new Response(res.body, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=604800, s-maxage=604800" } });
    try { context.waitUntil(cache.put(cacheKey, out.clone())); } catch (_) {}
    return out;
  } catch (_) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  }
}
