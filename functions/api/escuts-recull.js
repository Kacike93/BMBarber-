// EINA TEMPORAL: recull els escuts dels rivals i els desa a GitHub (carpeta escuts-originals/).
// Necessita el secret GITHUB_TOKEN a Cloudflare. S'esborrarà quan s'hagin recollit els escuts.
import { EQUIPS } from "./equip.js";

const REPO = "Kacike93/BMBarber-";
const HOSTS = ["balonmano.isquad.es", "balonmano.misquad.es", "resultadosbalonmano.isquad.es"];
const GH = (env, path, init = {}) => fetch(`https://api.github.com/repos/${REPO}${path}`, {
  ...init,
  headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "bmbarbera-web", "Content-Type": "application/json", ...(init.headers || {}) },
});

async function clauValida(env, clau) {
  if (!env.GITHUB_TOKEN || !clau) return false;
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(env.GITHUB_TOKEN));
  const hex = [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  return hex === clau;
}

function b64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const clubId = (u) => (u.match(/afiliacion_clubs\/(\d+)\//) || [])[1];

// GET: pàgina amb barra de progrés (el navegador va enviant tandes al Worker)
export async function onRequestPage(context) {
  const url = new URL(context.request.url);
  const clau = url.searchParams.get("clau") || "";
  if (!(await clauValida(context.env, clau))) return new Response("Clau incorrecta o falta el secret GITHUB_TOKEN.", { status: 403 });
  const ids = JSON.stringify(EQUIPS.map((e) => e.id));
  const html = `<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recollida d'escuts</title>
<style>body{font-family:system-ui,sans-serif;background:#06361D;color:#fff;max-width:640px;margin:40px auto;padding:0 20px}h1{color:#FFD21A}
.bar{height:18px;background:#0C5530;border-radius:9px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:#FFD21A;transition:width .3s}
#log{margin-top:16px;font-size:14px;color:#cfe3d6;white-space:pre-wrap}.ok{color:#3DDC84;font-weight:700}.err{color:#FF6B5E}</style>
<h1>Recollida d'escuts</h1><p id="st">Buscant escuts als equips…</p><div class="bar"><i id="b"></i></div><div id="log"></div>
<script>
const IDS=${ids}, CLAU=${JSON.stringify(clau)};
const log=(t,c)=>{const d=document.createElement('div');if(c)d.className=c;d.textContent=t;document.getElementById('log').prepend(d)};
(async()=>{
  const urls=new Map();
  for(const id of IDS){
    try{const d=await (await fetch('/api/equip?id='+id)).json();
      for(const r of (d.classificacio||[])) if(r.logo) urls.set(r.logo,r.equip);
      for(const m of (d.partits||[])){ if(m.logoLocal) urls.set(m.logoLocal,m.local); if(m.logoVisitant) urls.set(m.logoVisitant,m.visitant); }
      log('✓ '+id+': '+urls.size+' escuts trobats fins ara');
    }catch(e){log('✗ '+id+': '+e,'err')}
  }
  const byClub=new Map(); for(const [u,n] of urls){const m=u.match(/afiliacion_clubs\\/(\\d+)\\//); if(m&&!byClub.has(m[1])) byClub.set(m[1],{url:u,nom:n,club:m[1]});}
  const items=[...byClub.values()]; let fets=0;
  document.getElementById('st').textContent='Desant '+items.length+' escuts a GitHub…';
  for(let i=0;i<items.length;i+=8){
    const lot=items.slice(i,i+8);
    try{const r=await fetch('/api/escuts-desa?clau='+CLAU,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:lot,final:i+8>=items.length,tots:items})});
      const t=await r.json(); if(!r.ok) throw new Error(t.error||r.status); fets+=t.desats;
      log('✓ Tanda '+(i/8+1)+': '+t.desats+' escuts desats');
    }catch(e){log('✗ Tanda '+(i/8+1)+': '+e.message,'err')}
    document.getElementById('b').style.width=Math.round(Math.min(1,(i+8)/items.length)*100)+'%';
  }
  document.getElementById('st').innerHTML='<span class="ok">Fet! '+fets+' de '+items.length+' escuts desats.</span> Ja pots tancar aquesta pàgina i avisar en Claude.';
})();
</script></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

// POST: desa una tanda d'escuts a GitHub en un sol commit
export async function onRequestSave(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
  if (request.method !== "POST") return json({ error: "POST" }, 405);
  if (!(await clauValida(env, url.searchParams.get("clau")))) return json({ error: "Clau incorrecta" }, 403);
  let body; try { body = await request.json(); } catch (_) { return json({ error: "JSON" }, 400); }
  const items = (body.items || []).slice(0, 8);

  const tree = [];
  for (const it of items) {
    let u; try { u = new URL(it.url); } catch (_) { continue; }
    const id = clubId(it.url);
    if (!HOSTS.includes(u.hostname) || !id) continue;
    const r = await fetch(u.toString(), { headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" } });
    if (!r.ok) continue;
    const bytes = new Uint8Array(await r.arrayBuffer());
    const ext = bytes[0] === 0x89 ? "png" : "jpg";
    const blob = await (await GH(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: b64(bytes), encoding: "base64" }) })).json();
    if (blob.sha) tree.push({ path: `escuts-originals/${id}.${ext}`, mode: "100644", type: "blob", sha: blob.sha });
  }
  if (body.final && Array.isArray(body.tots)) {
    const index = body.tots.map((t) => ({ club: t.club, nom: t.nom, url: t.url }));
    tree.push({ path: "escuts-originals/index.json", mode: "100644", type: "blob", content: JSON.stringify(index, null, 2) });
  }
  if (!tree.length) return json({ desats: 0 });

  // Commit amb reintents per si dues tandes coincideixen
  for (let intent = 0; intent < 3; intent++) {
    const ref = await (await GH(env, "/git/ref/heads/main")).json();
    const parent = ref.object.sha;
    const commit = await (await GH(env, `/git/commits/${parent}`)).json();
    const nt = await (await GH(env, "/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree }) })).json();
    const nc = await (await GH(env, "/git/commits", { method: "POST", body: JSON.stringify({ message: `Escuts originals (${tree.length} fitxers)`, tree: nt.sha, parents: [parent] }) })).json();
    const up = await GH(env, "/git/refs/heads/main", { method: "PATCH", body: JSON.stringify({ sha: nc.sha }) });
    if (up.ok) return json({ desats: tree.filter((t) => t.sha).length });
  }
  return json({ error: "No s'ha pogut fer el commit" }, 500);
}
