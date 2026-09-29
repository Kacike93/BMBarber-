/* ==========================================================
   BM Barberà · dades editables
   Per canviar el nom d'un equip, edita "nombre" i "detalle".
   Per afegir un equip: copia una línia i canvia la foto.
   ========================================================== */
const EQUIPOS = {
  femenino: [
    { foto: "images/equipos/equipo-03.webp", nombre: "Juvenil femení" },
    { foto: "images/equipos/equipo-00.webp", nombre: "Cadet femení" },
    { foto: "images/equipos/equipo-05.webp", nombre: "Infantil femení" },
  ],
  masculino: [
    { foto: "images/equipos/equipo-06.webp", nombre: "Sènior A", detalle: "Lliga Or" },
    { foto: "images/equipos/equipo-07.webp", nombre: "Sènior B" },
    { foto: "images/equipos/equipo-04.webp", nombre: "Veterans" },
    { foto: "images/equipos/equipo-01.webp", nombre: "Juvenil masculí" },
    { foto: "images/equipos/equipo-02.webp", nombre: "Cadet masculí" },
    { foto: "images/equipos/equipo-09.webp", nombre: "Aleví A" },
    { foto: "images/equipos/equipo-11.webp", nombre: "Aleví B" },
    { foto: "images/equipos/equipo-10.webp", nombre: "Benjamí" },
    { foto: "images/equipos/equipo-08.webp", nombre: "Escoleta" },
  ],
};



/* Classificació del primer equip: DADES DE RESERVA.
   La web carrega la classificació en directe automàticament.
   Aquestes dades només es mostren si la federació no respon.
   "ratxa" són els últims resultats, del més antic al més recent (G, E o P).
   "nosaltres: true" marca la fila del BM Barberà. */
const CLASSIFICACIO = {
  competicio: "Lliga Catalana Or · 1a fase · Grup B",
  actualitzat: "Després de la jornada 2",
  equips: [
    { equip: "AB Investments Joventut Mataró", pt: 4, pj: 2, pg: 2, pe: 0, pp: 0, gf: 79, gc: 58, ratxa: "GG" },
    { equip: "Keynet H. Cooperativa Sant Boi", pt: 2, pj: 2, pg: 1, pe: 0, pp: 1, gf: 59, gc: 47, ratxa: "PG" },
    { equip: "Mubak BM La Roca", pt: 2, pj: 2, pg: 1, pe: 0, pp: 1, gf: 68, gc: 63, ratxa: "GP" },
    { equip: "CH Vilamajor (SMA)", pt: 2, pj: 2, pg: 1, pe: 0, pp: 1, gf: 55, gc: 52, ratxa: "PG" },
    { equip: "Handbol Banyoles A", pt: 2, pj: 2, pg: 1, pe: 0, pp: 1, gf: 49, gc: 52, ratxa: "GP" },
    { equip: "Handbol Sant Cugat B", pt: 2, pj: 2, pg: 1, pe: 0, pp: 1, gf: 53, gc: 58, ratxa: "GP" },
    { equip: "CH Sant Andreu A", pt: 2, pj: 2, pg: 1, pe: 0, pp: 1, gf: 57, gc: 67, ratxa: "PG" },
    { equip: "BM Barberà 'A'", pt: 0, pj: 2, pg: 0, pe: 0, pp: 2, gf: 48, gc: 71, ratxa: "PP", nosaltres: true },
  ],
};


/* Patrocinadors.
   Per afegir-ne un: copia una línia, posa el logo a images/patrocinadors/
   i, si en té, l'adreça web a "web". Sense "logo" es mostra el nom en text. */
const PATROCINADORS = [
  { nom: "ABC Barberà", logo: "images/patrocinadors/abc-barbera.webp", web: "" },
  { nom: "Goti Maquinaria", logo: "images/patrocinadors/goti-maquinaria.webp", web: "" },
  { nom: "Univertec", logo: "images/patrocinadors/univertec.webp", web: "" },
  { nom: "El Caliu", logo: "images/patrocinadors/el-caliu.webp", web: "" },
  { nom: "Revalco", logo: "", web: "" },
];

/* ==========================================================
   A partir d'aquí no cal tocar res
   ========================================================== */

// Menú móvil
const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("nav");
menuBtn.addEventListener("click", () => {
  const open = menuBtn.getAttribute("aria-expanded") === "true";
  menuBtn.setAttribute("aria-expanded", String(!open));
  menuBtn.setAttribute("aria-label", open ? "Obre el menú" : "Tanca el menú");
  nav.classList.toggle("is-open", !open);
});
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  menuBtn.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
}));

// Visor de fotos
const lb = document.getElementById("lightbox");
const lbImg = lb.querySelector("img");
const lbCap = lb.querySelector("figcaption");
let lbList = [], lbIndex = 0;

function showLb(i) {
  lbIndex = (i + lbList.length) % lbList.length;
  const item = lbList[lbIndex];
  lbImg.src = item.src;
  lbImg.alt = item.caption;
  lbCap.textContent = item.caption;
}
function openLb(list, i) {
  lbList = list;
  showLb(i);
  lb.showModal();
}
lb.querySelector(".lightbox__close").addEventListener("click", () => lb.close());
lb.querySelector(".lightbox__prev").addEventListener("click", () => showLb(lbIndex - 1));
lb.querySelector(".lightbox__next").addEventListener("click", () => showLb(lbIndex + 1));
lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
document.addEventListener("keydown", e => {
  if (!lb.open) return;
  if (e.key === "ArrowLeft") showLb(lbIndex - 1);
  if (e.key === "ArrowRight") showLb(lbIndex + 1);
});

// Equipos
function renderTeams(key, panelId) {
  const panel = document.getElementById(panelId);
  const list = EQUIPOS[key].map(t => ({ src: t.foto, caption: t.nombre }));
  EQUIPOS[key].forEach((t, i) => {
    const fig = document.createElement("figure");
    fig.className = "team";
    fig.innerHTML = `
      <button type="button" aria-label="Amplia la foto de ${t.nombre}">
        <img src="${t.foto}" alt="Foto de grup de l'equip ${t.nombre}" loading="lazy" width="1400" height="933">
      </button>
      <figcaption><h3>${t.nombre}</h3>${t.detalle ? `<p>${t.detalle}</p>` : ""}</figcaption>`;
    fig.querySelector("button").addEventListener("click", () => openLb(list, i));
    panel.appendChild(fig);
  });
}
renderTeams("femenino", "panel-fem");
renderTeams("masculino", "panel-masc");

// Pestañas femenino / masculino
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(next); next.focus();
    }
  });
});

// Classificació: primer intenta les dades en directe (/api/classificacio);
// si no hi ha connexió amb la federació, mostra les dades de reserva de dalt.
(function () {
  const body = document.getElementById("st-body");
  if (!body) return;
  const crest = document.querySelector(".brand img").getAttribute("src");
  const compEl = document.getElementById("st-comp");
  const updEl = document.getElementById("st-updated");

  const niceComp = (t) => t.split(/\s+-\s+/).map(part =>
    part.toLocaleLowerCase("ca").replace(/(^|\s)(\p{L})/gu, (m, sp, c) => sp + c.toLocaleUpperCase("ca"))
  ).join(" · ");

  function render(data, live) {
    body.innerHTML = "";
    compEl.textContent = data.competicio ? (live ? niceComp(data.competicio) : data.competicio) : CLASSIFICACIO.competicio;
    if (live) {
      const d = new Date(data.actualitzat);
      const hora = d.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
      const dia = d.toLocaleDateString("ca-ES", { day: "numeric", month: "long" });
      updEl.innerHTML = `<span class="live-dot" aria-hidden="true"></span>Jornada ${data.jornada} · actualitzat el ${dia} a les ${hora}`;
    } else {
      updEl.textContent = CLASSIFICACIO.actualitzat;
    }
    data.equips.forEach((r, i) => {
      const dif = r.gf - r.gc;
      const tr = document.createElement("tr");
      if (r.nosaltres) tr.className = "is-us";
      const form = [...(r.ratxa || "")].slice(-5).map(x => `<span class="f f--${x.toLowerCase()}">${x}</span>`).join("");
      tr.innerHTML = `
        <td class="c-pos">${i + 1}</td>
        <th scope="row" class="c-team"><span class="team-name">${r.nosaltres ? `<img src="${crest}" alt="" width="18" height="25">` : ""}${r.equip}</span></th>
        <td class="c-pt">${r.pt}</td>
        <td>${r.pj}</td><td>${r.pg}</td><td class="c-hide">${r.pe}</td><td>${r.pp}</td>
        <td class="c-hide">${r.gf}</td><td class="c-hide">${r.gc}</td>
        <td class="${dif > 0 ? "pos" : dif < 0 ? "neg" : ""}">${dif > 0 ? "+" : ""}${dif}</td>
        <td class="c-form"><span class="streak">${form}</span></td>`;
      body.appendChild(tr);
    });
  }

  render(CLASSIFICACIO, false);
  if (location.protocol.startsWith("http")) {
    fetch("/api/classificacio")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (data && data.equips && data.equips.length) render(data, true); })
      .catch(() => { /* es queden les dades de reserva */ });
  }
})();

// Formulari "Uneix-te"
// Enganxa aquí la clau (Access Key) de Web3Forms que et va arribar per correu.
// Mentre estigui buida, el formulari fa servir FormSubmit.
const WEB3FORMS_KEY = "2f57159e-67eb-4c06-a60e-06cf45017ed0";
(function () {
  const form = document.getElementById("form-unete");
  if (!form) return;
  const EMAIL = "bmbarbera@hotmail.com";
  const status = document.getElementById("form-status");
  const btn = form.querySelector('button[type="submit"]');
  const show = (html, type) => { status.hidden = false; status.className = `form__status form__status--${type}`; status.innerHTML = html; };
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  async function sendWeb3Forms(data) {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: "Nova sol·licitud des de la web",
        from_name: "Web BM Barberà",
        replyto: data.email,
        ...data,
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!(res.ok && out.success)) throw new Error(out.message || `Error ${res.status}`);
  }

  async function sendFormSubmit(data) {
    const res = await fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ _subject: "Nova sol·licitud des de la web", _template: "table", _captcha: "false", ...data }),
    });
    const out = await res.json().catch(() => ({}));
    if (!(res.ok && String(out.success) === "true")) throw new Error(out.message || `Error ${res.status}`);
  }

  form.addEventListener("submit", async (e) => {
    if (!location.protocol.startsWith("http") || window.__PREVIEW) return; // vista prèvia
    e.preventDefault();
    if (form.querySelector('input[name="_honey"]').value) return;
    const all = Object.fromEntries(new FormData(form).entries());
    const data = Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith("_") && !["access_key", "subject", "redirect"].includes(k)));
    btn.disabled = true; const label = btn.textContent; btn.textContent = "Enviant…";
    try {
      await (WEB3FORMS_KEY ? sendWeb3Forms(data) : sendFormSubmit(data));
      location.href = "/gracias.html";
    } catch (err) {
      const body = encodeURIComponent(Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n"));
      show(`No s'ha pogut enviar ara mateix${err && err.message ? ` <small>(${esc(err.message)})</small>` : ""}. Torna-ho a provar en uns minuts o <a href="mailto:${EMAIL}?subject=${encodeURIComponent("Sol·licitud des de la web")}&body=${body}">envia'ns un correu directament</a>.`, "error");
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  });
})();

// Patrocinadors: carrusel infinit
(function () {
  const track = document.querySelector("#sponsors .marquee__track");
  if (!track) return;
  const tile = (p, hidden) => {
    const el = document.createElement(p.web ? "a" : "div");
    el.className = "sponsor";
    if (p.web) { el.href = p.web; el.target = "_blank"; el.rel = "noopener"; }
    if (hidden) { el.setAttribute("aria-hidden", "true"); if (p.web) el.tabIndex = -1; }
    el.innerHTML = p.logo
      ? `<img src="${p.logo}" alt="${hidden ? "" : p.nom}" loading="lazy">`
      : `<span class="sponsor__name">${p.nom}</span>`;
    return el;
  };
  // Omplim prou logos per cobrir pantalles amples i dupliquem per al bucle
  const set = [];
  while (set.length < 8) set.push(...PATROCINADORS);
  set.forEach((p, i) => track.appendChild(tile(p, i >= PATROCINADORS.length)));
  set.forEach(p => track.appendChild(tile(p, true)));
  track.style.setProperty("--dur", `${set.length * 3.5}s`);

  const foot = document.getElementById("footer-sponsors");
  if (foot) foot.innerHTML = PATROCINADORS.map(p => p.nom).join("<br>");

  const cta = document.getElementById("sponsor-cta");
  if (cta) cta.addEventListener("click", () => {
    const sel = document.querySelector('#form-unete select');
    if (sel) sel.value = "Patrocinar";
  });
})();

// Valors: apareixen un darrere l'altre en arribar-hi
(function () {
  const cards = document.querySelectorAll(".value");
  if (!cards.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  cards.forEach((c, i) => { c.classList.add("is-hidden"); c.style.transitionDelay = `${i * 90}ms`; });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove("is-hidden"); io.unobserve(e.target); }
    });
  }, { threshold: 0.2 });
  cards.forEach(c => io.observe(c));
})();

// Instagram: últimes publicacions (amb fotos de reserva si no hi ha connexió)
(function () {
  const grid = document.getElementById("insta-grid");
  if (!grid) return;
  const PROFILE = "https://www.instagram.com/bm_barbera";
  const icon = {
    video: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    album: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="7" y="7" width="14" height="14" rx="2"/><path d="M3 17V5a2 2 0 0 1 2-2h12"/></svg>',
  };
  const fmt = d => d ? new Date(d).toLocaleDateString("ca-ES", { day: "numeric", month: "short" }) : "";

  function render(posts) {
    grid.innerHTML = "";
    posts.slice(0, 6).forEach(p => {
      const a = document.createElement("a");
      a.className = "insta__post";
      a.href = p.url || PROFILE; a.target = "_blank"; a.rel = "noopener";
      const txt = (p.text || "").replace(/\s+/g, " ").trim();
      a.setAttribute("aria-label", txt ? `Publicació d'Instagram: ${txt.slice(0, 80)}` : "Publicació d'Instagram");
      a.innerHTML = `
        <img src="${p.img}" alt="" loading="lazy">
        ${icon[p.tipus] ? `<span class="insta__type">${icon[p.tipus]}</span>` : ""}
        <span class="insta__over">
          ${p.data ? `<span class="insta__date">${fmt(p.data)}</span>` : ""}
          ${txt ? `<span class="insta__text">${txt}</span>` : ""}
        </span>`;
      a.querySelector("img").alt = "";
      grid.appendChild(a);
    });
  }

  // Esquelet mentre carrega
  grid.innerHTML = Array.from({ length: 6 }, () => '<span class="insta__post insta__post--skel"></span>').join("");
  const fallback = () => {
    grid.classList.add("insta__grid--empty");
    grid.innerHTML = `
      <a class="insta__empty" href="${PROFILE}" target="_blank" rel="noopener">
        <span class="insta__empty-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg></span>
        <span class="insta__empty-text"><strong>Les nostres últimes publicacions, a Instagram</strong><span>Partits, resultats i el dia a dia de tots els equips a @bm_barbera</span></span>
        <span class="btn btn--yellow">Obrir Instagram ↗</span>
      </a>`;
    const cta = document.querySelector(".insta__cta"); if (cta) cta.hidden = true;
  };

  if (!location.protocol.startsWith("http")) return fallback();
  fetch("/api/instagram")
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => (d.posts && d.posts.length) ? render(d.posts) : fallback())
    .catch(fallback);
})();
