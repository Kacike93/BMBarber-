/* ==========================================================
   BM Barberà · dades editables
   Per canviar el nom d'un equip, edita "nombre" i "detalle".
   Per afegir un equip: copia una línia i canvia la foto.
   ========================================================== */
const EQUIPOS = {
  femenino: [
    { foto: "images/equipos/equipo-03.webp", nombre: "Sènior femení" },
    { foto: "images/equipos/equipo-00.webp", nombre: "Juvenil femení" },
    { foto: "images/equipos/equipo-05.webp", nombre: "Infantil femení" },
  ],
  masculino: [
    { foto: "images/equipos/equipo-06.webp", nombre: "Sènior A", detalle: "Lliga Or" },
    { foto: "images/equipos/equipo-07.webp", nombre: "Sènior B" },
    { foto: "images/equipos/equipo-04.webp", nombre: "Veterans" },
    { foto: "images/equipos/equipo-01.webp", nombre: "Cadet masculí" },
    { foto: "images/equipos/equipo-02.webp", nombre: "Infantil masculí" },
    { foto: "images/equipos/equipo-09.webp", nombre: "Aleví A" },
    { foto: "images/equipos/equipo-11.webp", nombre: "Aleví B" },
    { foto: "images/equipos/equipo-10.webp", nombre: "Benjamí" },
    { foto: "images/equipos/equipo-08.webp", nombre: "Escoleta" },
  ],
};

const GALERIA = [
  { foto: "images/galeria/lanzamiento-bonilla.webp", texto: "A. Bonilla preparant el llançament" },
  { foto: "images/galeria/choque-manos.webp", texto: "Encaixada de mans abans del partit" },
  { foto: "images/galeria/banquillo-celebra.webp", texto: "La banqueta celebrant un gol" },
  { foto: "images/galeria/femenino-tiempo-muerto.webp", texto: "Temps mort de l'equip femení" },
  { foto: "images/galeria/aficion-permanencia.webp", texto: "Tota la família del club després de la permanència" },
  { foto: "images/galeria/charla-equipo.webp", texto: "Xerrada del sènior abans de començar" },
  { foto: "images/galeria/abrazo-permanencia.webp", texto: "Els grans i els petits, junts a la celebració" },
  { foto: "images/galeria/familia-club.webp", texto: "Foto de família del club" },
];


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

// Galería
const gallery = document.getElementById("gallery");
const galList = GALERIA.map(g => ({ src: g.foto, caption: g.texto }));
GALERIA.forEach((g, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.setAttribute("aria-label", `Amplia: ${g.texto}`);
  b.innerHTML = `<img src="${g.foto}" alt="${g.texto}" loading="lazy">`;
  b.addEventListener("click", () => openLb(galList, i));
  gallery.appendChild(b);
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

// Formulari: després d'enviar, torna a la pàgina de gràcies d'aquesta web
(function () {
  const next = document.querySelector('#form-unete input[name="_next"]');
  if (next && location.protocol.startsWith("http")) next.value = location.origin + "/gracias.html";
})();
