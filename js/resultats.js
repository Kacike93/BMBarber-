/* ==========================================================
   BM Barberà · Pàgina de resultats (dades en directe de la federació)
   Els equips es configuren a functions/api/equip.js
   ========================================================== */
// Escuts dels equips (els dels rivals estan desats a images/escuts/<número de club>.webp)
const MOSTRAR_ESCUTS = true;

(function () {

  const $ = (id) => document.getElementById(id);
  if (!document.getElementById("res-tabs")) return;
  if (!MOSTRAR_ESCUTS) document.body.classList.add('no-logos');
  const tabsEl = $("res-tabs");
  const EQUIPS_RESERVA = [
    { id: "senior-a", grup: "masculi", curt: "Sènior A", nom: "Sènior A masculí" }, { id: "senior-b", grup: "masculi", curt: "Sènior B", nom: "Sènior B masculí" },
    { id: "master-masculi", grup: "masculi", curt: "Màster", nom: "Màster masculí" }, { id: "juvenil-masculi", grup: "masculi", curt: "Juvenil", nom: "Juvenil masculí" },
    { id: "cadet-masculi", grup: "masculi", curt: "Cadet", nom: "Cadet masculí" }, { id: "infantil-masculi", grup: "masculi", curt: "Infantil A", nom: "Infantil A masculí" }, { id: "infantil-atletic-masculi", grup: "masculi", curt: "Infantil Atlètic", nom: "Infantil Atlètic masculí" },
    { id: "juvenil-femeni", grup: "femeni", curt: "Juvenil", nom: "Juvenil femení" }, { id: "cadet-femeni", grup: "femeni", curt: "Cadet", nom: "Cadet femení" },
    { id: "infantil-femeni", grup: "femeni", curt: "Infantil", nom: "Infantil femení" }, { id: "alevi-mixt", grup: "mixt", curt: "Aleví A", nom: "Aleví A mixt" }, { id: "alevi-atletic-mixt", grup: "mixt", curt: "Aleví Atlètic", nom: "Aleví Atlètic mixt" }];
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SKIP = /^(BM|CH|CEH|AB|HANDBOL|CLUB|DE|DEL|LA|EL|I|B\.|M\.|SE|MGC|UE)$/i;
  const initials = (name) => (String(name || "").replace(/['"()]/g, " ").split(/\s+/).filter((w) => w && !SKIP.test(w)).slice(0, 2).map((w) => w[0]).join("") || "·").toUpperCase();
  // Clubs amb escut desat a la web (número de club de la federació)
  const ESCUTS = new Set([169,170,172,173,175,177,179,180,181,182,202,206,209,214,781,804,2894,2900,2905,100104,100110,100112,100114,100116,100118,100119,100120,100122,100123,100127,100151,100154,100155,100192,100195,100197,100210,100220,100473,100827,101037]);
  const clubOf = (src) => +((String(src || "").match(/afiliacion_clubs\/(\d+)\//) || [])[1] || 0);
  const logo = (src, cls, name) => {
    if (!MOSTRAR_ESCUTS) return "";
    if (/barber/i.test(name || "")) return `<img class="${cls} logo--own" src="/images/escudo.png" alt="" loading="lazy">`;
    const id = clubOf(src);
    if (id && ESCUTS.has(id)) return `<img class="${cls}" src="/images/escuts/${id}.webp" alt="" loading="lazy" width="128" height="128">`;
    // Club nou sense escut desat: el demanem a la federació a través del Worker (si falla, només el nom)
    if (src) return `<img class="${cls}" src="/api/logo?u=${encodeURIComponent(src)}" alt="" loading="lazy" width="128" height="128" onerror="this.outerHTML='<span class=&quot;${cls} logo--none&quot; aria-hidden=&quot;true&quot;></span>'">`;
    return `<span class="${cls} logo--none" aria-hidden="true"></span>`;
  };

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
  const CREST = '<img class="mcard__crest" src="/images/escudo.png" alt="" width="300" height="419">';
  // Pavelló: icona de casa si juguem a l'IEM Elisa Badia, icona d'autobús si és fora
  const isHome = (lloc) => /elisa\s*badia/i.test(lloc || "");
  const ICON_HOME = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>';
  const ICON_AWAY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16V8a2 2 0 0 1 2-2h11.5a2 2 0 0 1 1.7.95L21 11.5V16a1 1 0 0 1-1 1h-1"/><path d="M5 17H3"/><path d="M15 17H9"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M3 11h18"/><path d="M8 6v5M13 6v5"/></svg>';
  const venue = (lloc) => lloc ? `<span class="venue ${isHome(lloc) ? "venue--home" : "venue--away"}" title="${isHome(lloc) ? "A casa" : "Fora de casa"}"><span class="venue__ico" aria-hidden="true">${isHome(lloc) ? ICON_HOME : ICON_AWAY}</span>${esc(lloc)}</span>` : "";

  function card(m, type) {
    if (type === "next" && !m) return `<article class="mcard"><p class="mcard__label">Proper partit</p><p class="mcard__empty">Pendent del calendari de la següent fase.</p></article>`;
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
        <div class="mcard__team ${m.barberaLocal ? "is-us" : ""}">${logo(m.logoLocal, "mcard__logo", m.local)}<span>${esc(m.local)}</span></div>
        <div class="mcard__mid">${mid}</div>
        <div class="mcard__team ${m.barberaVisitant ? "is-us" : ""}">${logo(m.logoVisitant, "mcard__logo", m.visitant)}<span>${esc(m.visitant)}</span></div>
      </div>
      <p class="mcard__when">${esc(when.charAt(0).toUpperCase() + when.slice(1))}</p>
      ${m.lloc ? `<p class="mcard__where">${venue(m.lloc)}</p>` : ""}
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
    const row = (name, lg, gols, us) => `<div class="match__row ${us ? "is-us" : ""}">${logo(lg, "team-logo", name)}<span>${esc(name)}</span>${gols != null ? `<b>${gols}</b>` : ""}</div>`;
    return `<li class="match ${isNext ? "is-next" : ""}">
      <div class="match__date">${date}</div>
      <div class="match__teams">
        ${row(m.local, m.logoLocal, m.golsLocal, m.barberaLocal)}
        ${row(m.visitant, m.logoVisitant, m.golsVisitant, m.barberaVisitant)}
        ${m.lloc ? `<div class="match__where">${venue(m.lloc)}</div>` : ""}
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
    const phaseDone = ps.length > 0 && pending.length === 0;
    $("res-cards").innerHTML = (phaseDone ? `<div class="phase-done"><strong>Fase finalitzada</strong><span>Aviat començarà la següent fase. Mentrestant, aquí tens tots els resultats.</span></div>` : "") + card(next, "next") + card(last, "last");

    $("res-table").innerHTML = (d.classificacio || []).map((r) => {
      const dif = r.gf - r.gc;
      return `<tr class="${r.nosaltres ? "is-us" : ""}">
        <td class="c-pos">${r.pos}</td>
        <th scope="row" class="c-team"><span class="team-name">${logo(r.logo, "team-logo", r.equip)}${esc(r.equip)}</span></th>
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

  async function load(eq, fromUser = true) {
    showGroup(eq.grup || "masculi", eq.id);
    if (fromUser && location.hash !== "#" + eq.id) history.replaceState(null, "", "#" + eq.id);
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

  let EQUIPS = EQUIPS_RESERVA;
  const groupsEl = $("res-groups");
  function showGroup(grup, activeId) {
    groupsEl.querySelectorAll("button").forEach((b) => { const on = b.dataset.grup === grup; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
    const list = EQUIPS.filter((e) => (e.grup || "masculi") === grup);
    tabsEl.innerHTML = list.map((e) => `<button role="tab" class="team-chip" data-id="${esc(e.id)}" aria-selected="${e.id === activeId}">${esc(e.curt || e.nom)}</button>`).join("") || '<p class="results__error">Encara no hi ha equips en aquest grup.</p>';
    tabsEl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => load(EQUIPS.find((e) => e.id === b.dataset.id))));
    return list;
  }
  groupsEl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    const first = EQUIPS.find((e) => (e.grup || "masculi") === b.dataset.grup);
    if (first) load(first); else showGroup(b.dataset.grup, null);
  }));

  (async function init() {
    try { const d = await getJSON("/api/equips"); if (d.equips && d.equips.length) EQUIPS = d.equips; } catch (_) {}
    // Grup segons el nom si no ve indicat (els equips "femení" sempre a Femení)
    EQUIPS = EQUIPS.map((e) => ({ ...e, grup: /femen/i.test(e.nom || "") ? "femeni" : /mixt/i.test(e.nom || "") ? "mixt" : (e.grup || "masculi") }));
    const fromHash = EQUIPS.find((e) => "#" + e.id === location.hash);
    load(fromHash || EQUIPS[0], false);
    if (fromHash || location.hash === "#resultats") setTimeout(() => document.getElementById("resultats")?.scrollIntoView(), 50);
  })();
})();
