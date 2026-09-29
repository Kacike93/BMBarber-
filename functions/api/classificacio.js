// Cloudflare Pages Function  ->  /api/classificacio
// Llegeix la classificació de la federació (iSquad) i la retorna en JSON
// perquè la web la mostri amb l'estil del club. La resposta es guarda
// 30 minuts a la memòria cau de Cloudflare.
//
// NOVA FASE O NOVA TEMPORADA: només cal canviar l'enllaç de sota.
const URL_CLASSIFICACIO =
  "https://resultadosbalonmano.isquad.es/clasificacion.php?seleccion=0&id=1038541&id_ambito=0&id_territorial=17&id_superficie=1&iframe=0&id_categoria=3077&id_competicion=211864";

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

const text = (html) => decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const firstInt = (s) => {
  const m = String(s).match(/-?\d+/);
  return m ? parseInt(m[0], 10) : 0;
};

// "MUBAK BM LA ROCA" -> "Mubak BM La Roca"
const KEEP = new Set(["BM", "CH", "AB", "SMA", "CE", "CB", "UE", "HC", "SE", "FC", "CD", "AE", "CN", "SD", "II", "III"]);
const LOWER = new Set(["DE", "DEL", "LA", "LES", "ELS", "I", "Y", "D'"]);
function niceName(raw) {
  return raw
    .split(" ")
    .map((w, i) => {
      const bare = w.replace(/[()'".,]/g, "");
      if (KEEP.has(bare) || /^[A-Z]$/.test(bare)) return w;
      if (i > 0 && LOWER.has(w)) return w.toLowerCase();
      return w.charAt(0) + w.slice(1).toLocaleLowerCase("ca");
    })
    .join(" ");
}

export function parse(html) {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  const table = tables.find((t) => /\bPT\b/.test(text(t)) && /\bPJ\b/.test(text(t)) && /\bDIF\b/.test(text(t)));
  if (!table) throw new Error("No s'ha trobat la taula de classificació");

  const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const cellsOf = (r) => (r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || []);

  // Localitza les columnes pel seu títol
  const headerRow = rows.find((r) => /\bPT\b/.test(text(r)) && /\bPJ\b/.test(text(r)));
  const heads = cellsOf(headerRow).map((c) => text(c).toUpperCase());
  const col = (name, fallback) => {
    const i = heads.findIndex((h) => h === name);
    return i >= 0 ? i : fallback;
  };
  const C = {
    equip: heads.findIndex((h) => h.startsWith("EQUIPO") || h.startsWith("EQUIP")),
    pt: col("PT", 3), pj: col("PJ", 4), pg: col("PG", 5), pe: col("PE", 6),
    pp: col("PP", 7), gf: col("GF", 8), gc: col("GC", 9),
  };
  if (C.equip < 0) C.equip = 1;

  const equips = [];
  for (const r of rows) {
    if (r === headerRow) continue;
    const cells = cellsOf(r);
    if (cells.length < 8) continue;
    const t = cells.map(text);

    // Nom de l'equip: preferim el text de l'enllaç; traiem el número de pujada/baixada
    const link = cells[C.equip].match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    let nom = text(link ? link[1] : cells[C.equip]).replace(/^[-+]?\d+\s+/, "").trim();
    if (!nom) continue;

    // Ratxa: busquem una cel·la amb lletres G/E/P soltes
    const formCell = t.find((x, i) => i !== C.equip && /^([-GEP]\s*){2,}$/.test(x));
    const ratxa = formCell ? formCell.replace(/[^GEP]/g, "") : "";

    equips.push({
      equip: niceName(nom),
      pt: firstInt(t[C.pt]), pj: firstInt(t[C.pj]), pg: firstInt(t[C.pg]), pe: firstInt(t[C.pe]),
      pp: firstInt(t[C.pp]), gf: firstInt(t[C.gf]), gc: firstInt(t[C.gc]),
      ratxa,
      nosaltres: /BARBER/i.test(nom),
    });
  }
  if (!equips.length) throw new Error("La taula és buida");

  const titol = (html.match(/<h4[^>]*>([^<]*LLIGA[^<]*)<\/h4>/i) || [])[1];
  return {
    competicio: titol ? text(titol) : null,
    jornada: Math.max(...equips.map((e) => e.pj)),
    actualitzat: new Date().toISOString(),
    font: URL_CLASSIFICACIO,
    equips,
  };
}

const CACHE_SEGONS = 1800; // 30 minuts

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/classificacio", context.request.url).toString());

  try {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  } catch (_) { /* sense memòria cau: continuem */ }

  try {
    const res = await fetch(URL_CLASSIFICACIO, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BMBarberaWeb/1.0)",
        "Accept-Language": "es,ca;q=0.9",
      },
    });
    if (!res.ok) throw new Error(`La federació ha respost ${res.status}`);
    const data = parse(await res.text());
    const response = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=300, s-maxage=${CACHE_SEGONS}`,
      },
    });
    try { context.waitUntil(cache.put(cacheKey, response.clone())); } catch (_) {}
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
