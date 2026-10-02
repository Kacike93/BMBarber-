// /api/prova-escut -> prova de diagnòstic: comprova si el Worker pot descarregar els escuts de la federació
import { EQUIPS, parseEquip } from "./equip.js";

const TEST = "https://balonmano.isquad.es/images/afiliacion_clubs/214/square_686579666b7476776970.jpg";

async function probe(url, headers) {
  try {
    const r = await fetch(url, { headers, redirect: "follow" });
    const buf = new Uint8Array(await r.arrayBuffer());
    const sig = [...buf.slice(0, 4)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
    return { estat: r.status, tipus: r.headers.get("content-type"), mida_bytes: buf.length, url_final: r.url, inici: sig, es_jpeg: buf[0] === 0xff && buf[1] === 0xd8, es_png: buf[0] === 0x89 && buf[1] === 0x50 };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

export async function onRequestGet() {
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
  const out = { data: new Date().toISOString(), imatge_prova: TEST, proves: {} };
  out.proves.sense_capcaleres = await probe(TEST, {});
  out.proves.navegador = await probe(TEST, { "User-Agent": UA, Accept: "image/avif,image/webp,image/*,*/*" });
  out.proves.navegador_amb_referer = await probe(TEST, { "User-Agent": UA, Accept: "image/*,*/*", Referer: "https://resultadosbalonmano.isquad.es/" });

  // Quins enllaços d'escut troba el lector a la pàgina del Sènior A?
  try {
    const eq = EQUIPS[0];
    const r = await fetch(eq.url, { headers: { "User-Agent": UA, "Accept-Language": "es,ca;q=0.9" } });
    const d = parseEquip(await r.text(), eq.url);
    out.escuts_trobats_senior_a = d.classificacio.slice(0, 4).map((x) => ({ equip: x.equip, logo: x.logo }));
    const first = d.classificacio.map((x) => x.logo).find(Boolean);
    if (first) out.proves.escut_del_lector = await probe(first, { "User-Agent": UA, Accept: "image/*,*/*", Referer: "https://resultadosbalonmano.isquad.es/" });
  } catch (e) {
    out.escuts_trobats_senior_a = { error: String(e.message || e) };
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
