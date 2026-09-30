/* ==========================================================
   BM Barberà · Pàgina de resultats (dades en directe de la federació)
   Els equips es configuren a functions/api/equip.js
   ========================================================== */
(function () {
  // Menú mòbil
  const menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
  }

  const $ = (id) => document.getElementById(id);
  const tabsEl = $("res-tabs");
  const EQUIPS_RESERVA = [{ id: "senior-a", nom: "Sènior A" }, { id: "senior-b", nom: "Sènior B" }];
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const logo = (src, cls) => src ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : `<span class="${cls}" aria-hidden="true"></span>`;
  const dt = (iso) => (iso ? new Date(iso.length > 10 ? iso : iso + "T12:00") : null);
  const hasTime = (iso) => !!iso && iso.length > 10;

  async function getJSON(url) {
    if (window.__SAMPLE && window.__SAMPLE[url]) return window.__SAMPLE[url];
    const r = await fetch(url);
    const d = await r.json();
    if (!r.ok || d.error) throw Object.assign(new Error(d.error || r.status), { data: d });
    return d;
  }

  function resultFor(m) {
    if (m.golsLocal == null) return null;
    const us = m.barberaLocal ? m.golsLocal : m.golsVisitant, them = m.barberaLocal ? m.golsVisitant : m.golsLocal;
    return us > them ? "g" : us < them ? "p" : "e";
  }
  const LABEL = { g: "Victòria", e: "Empat", p: "Derrota" };

  function card(m, type) {
    const title = type === "next" ? "Proper partit" : "Últim resultat";
    if (!m) return `<article class="mcard ${type === "last" ? "mcard--last" : ""}"><p class="mcard__label">${title}</p><p class="mcard__empty">${type === "next" ? "No hi ha cap partit pendent." : "Encara no s'ha jugat cap partit."}</p></article>`;
    const d = dt(m.data);
    const when = d ? d.toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" }) + (hasTime(m.data) ? " · " + d.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" }) : "") : "Data per confirmar";
    const res = resultFor(m);
    const mid = m.golsLocal != null
      ? `<div class="mcard__score">${m.golsLocal} - ${m.golsVisitant}</div>${res ? `<span class="mcard__badge badge--${res}">${LABEL[res]}</span>` : ""}`
      : `<div class="mcard__vs">VS</div>`;
    return `<article class="mcard ${type === "last" ? "mcard--last" : ""}">
      <p class="mcard__label">${title}</p>
      <div class="mcard__teams">
        <div class="mcard__team ${m.barberaLocal ? "is-us" : ""}">${logo(m.logoLocal, "mcard__logo")}<span>${esc(m.local)}</span></div>
        <div class="mcard__mid">${mid}</div>
        <div class="mcard__team ${m.barberaVisitant ? "is-us" : ""}">${logo(m.logoVisitant, "mcard__logo")}<span>${esc(m.visitant)}</span></div>
      </div>
      <p class="mcard__when">${esc(when.charAt(0).toUpperCase() + when.slice(1))}</p>
      ${m.lloc ? `<p class="mcard__where">${esc(m.lloc)}</p>` : ""}
    </article>`;
  }

  function matchItem(m, isNext) {
    const d = dt(m.data);
    const date = d
      ? `<span class="match__day">${d.getDate()}</span><span class="match__month">${d.toLocaleDateString("ca-ES", { month: "short" }).replace(".", "")}</span>${hasTime(m.data) ? `<span class="match__time">${d.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}</span>` : ""}`
      : `<span class="match__tbd">Per<br>confirmar</span>`;
    const res = resultFor(m);
    const side = m.estat === "en-joc" ? `<span class="chip chip--live">En joc</span>`
      : res ? `<span class="mcard__badge badge--${res}" title="${LABEL[res]}">${{ g: "V", e: "E", p: "D" }[res]}</span>`
      : m.estat === "ajornat" ? `<span class="chip">Ajornat</span>` : `<span class="chip">Pendent</span>`;
    const row = (name, lg, gols, us) => `<div class="match__row ${us ? "is-us" : ""}">${logo(lg, "team-logo")}<span>${esc(name)}</span>${gols != null ? `<b>${gols}</b>` : ""}</div>`;
    return `<li class="match ${isNext ? "is-next" : ""}">
      <div class="match__date">${date}</div>
      <div class="match__teams">
        ${row(m.local, m.logoLocal, m.golsLocal, m.barberaLocal)}
        ${row(m.visitant, m.logoVisitant, m.golsVisitant, m.barberaVisitant)}
        ${m.lloc ? `<div class="match__where">${esc(m.lloc)}</div>` : ""}
      </div>
      <div class="match__side">${side}</div>
    </li>`;
  }

  function render(d) {
    $("res-team").textContent = d.nom;
    $("res-comp").textContent = d.competicio ? d.competicio.split(/\s+-\s+/).map((p) => p.toLocaleLowerCase("ca").replace(/(^|\s)(\p{L})/gu, (x, s, c) => s + c.toLocaleUpperCase("ca"))).join(" · ") : "";
    if (d.actualitzat) {
      const u = new Date(d.actualitzat);
      $("res-updated").innerHTML = `<span class="live-dot" aria-hidden="true"></span>Actualitzat el ${u.toLocaleDateString("ca-ES", { day: "numeric", month: "long" })} a les ${u.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}`;
    }
    $("res-source").href = d.font || "#";

    const ps = d.partits || [];
    const played = ps.filter((m) => m.golsLocal != null && m.estat === "finalitzat");
    const pending = ps.filter((m) => m.estat !== "finalitzat");
    const last = played.slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""))[0] || null;
    const next = pending.filter((m) => m.data).sort((a, b) => a.data.localeCompare(b.data))[0] || pending[0] || null;
    $("res-cards").innerHTML = card(next, "next") + card(last, "last");

    $("res-table").innerHTML = (d.classificacio || []).map((r) => {
      const dif = r.gf - r.gc;
      return `<tr class="${r.nosaltres ? "is-us" : ""}">
        <td class="c-pos">${r.pos}</td>
        <th scope="row" class="c-team"><span class="team-name">${logo(r.logo, "team-logo")}${esc(r.equip)}</span></th>
        <td class="c-pt">${r.pt}</td><td>${r.pj}</td><td>${r.pg}</td><td class="c-hide">${r.pe}</td><td>${r.pp}</td>
        <td class="c-hide">${r.gf}</td><td class="c-hide">${r.gc}</td>
        <td class="${dif > 0 ? "pos" : dif < 0 ? "neg" : ""}">${dif > 0 ? "+" : ""}${dif}</td></tr>`;
    }).join("") || `<tr><td colspan="10">Encara no hi ha classificació.</td></tr>`;

    $("res-matches").innerHTML = ps.map((m) => matchItem(m, m === next)).join("") || `<li class="results__error">Encara no hi ha partits.</li>`;
  }

  function loading() {
    $("res-cards").innerHTML = '<span class="skel" style="height:220px"></span><span class="skel" style="height:220px"></span>';
    $("res-table").innerHTML = '<tr><td colspan="10"><span class="skel"></span></td></tr>';
    $("res-matches").innerHTML = '<li><span class="skel"></span></li><li><span class="skel"></span></li><li><span class="skel"></span></li>';
  }

  async function load(eq) {
    [...tabsEl.children].forEach((b) => { const on = b.dataset.id === eq.id; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
    if (location.hash !== "#" + eq.id) history.replaceState(null, "", "#" + eq.id);
    $("res-team").textContent = eq.nom; $("res-comp").textContent = ""; $("res-updated").textContent = "";
    loading();
    try {
      render(await getJSON(`/api/equip?id=${encodeURIComponent(eq.id)}`));
    } catch (err) {
      const font = err.data && err.data.font;
      $("res-cards").innerHTML = `<p class="results__error">Ara mateix no podem carregar les dades de la federació. Torna-ho a provar en uns minuts${font ? ` o <a href="${esc(font)}" target="_blank" rel="noopener">consulta-les directament ↗</a>` : ""}.</p>`;
      $("res-table").innerHTML = ""; $("res-matches").innerHTML = "";
      if (font) $("res-source").href = font;
    }
  }

  (async function init() {
    let equips = EQUIPS_RESERVA;
    try { const d = await getJSON("/api/equips"); if (d.equips && d.equips.length) equips = d.equips; } catch (_) {}
    tabsEl.innerHTML = equips.map((e) => `<button role="tab" data-id="${esc(e.id)}" aria-selected="false">${esc(e.nom)}</button>`).join("");
    tabsEl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => load(equips.find((e) => e.id === b.dataset.id))));
    const fromHash = equips.find((e) => "#" + e.id === location.hash);
    load(fromHash || equips[0]);
  })();
})();
