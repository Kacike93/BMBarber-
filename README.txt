HANDBOL BARBERÀ · WEB (bmbarbera.com)
=====================================

Allotjament: Cloudflare Workers (gratis), connectat a GitHub.
Cada "Commit" a GitHub publica la web automàticament.

ESTRUCTURA
- index.html                     Pàgina principal
- gracias.html                   Pàgina després d'enviar el formulari
- css/styles.css                 Estils i colors
- js/main.js                     Equips, patrocinadors, formulari i dades de reserva
- images/                        Escut, equips, fotos i logos de patrocinadors
- functions/api/equip.js         Resultats i classificacions de tots els equips
- functions/api/classificacio.js Funcions comunes per llegir la federació
- functions/api/instagram.js     Últimes publicacions d'Instagram (Behold)
- src/worker.js                  Worker de Cloudflare (serveix la web i les API)
- wrangler.jsonc                 Configuració del Worker (nom: bmbarbera)

COSES QUE ES CANVIEN SOVINT
- Equips (noms i fotos) ........ js/main.js  -> EQUIPOS
- Patrocinadors ................ js/main.js  -> PATROCINADORS
                                 (logo a images/patrocinadors/)
- Resultats i classificacions .. functions/api/equip.js -> EQUIPS_CONFIG
  (la classificació de la portada fa servir les dades del Sènior A d'aquí)

CANVI DE FASE (segona fase, fase final...)
Cada enllaç de la federació té dos números:
   equipo.php?id_equipo=201858&id=1038541
                        equip     fase
- "equip" normalment es manté tota la temporada.
- "fase" canvia a cada fase nova: només cal canviar aquest número
  a functions/api/equip.js (camp  fase:  de cada equip).
Quan un equip acaba tots els partits d'una fase, la web mostra
l'avís "Fase finalitzada" fins que s'hi posi la fase nova.

SERVEIS EXTERNS
- Formulari "Uneix-te": Web3Forms (clau a js/main.js -> WEB3FORMS_KEY)
  Els correus arriben a l'adreça configurada al panell de web3forms.com
- Instagram: Behold (enllaç a functions/api/instagram.js -> BEHOLD_FEED_URL)
  Pla gratuït: 6 publicacions, s'actualitza un cop al dia.
- Domini bmbarbera.com: registrat a WordPress.com (renovació anual allà),
  DNS gestionats per Cloudflare. No tocar els registres MX/TXT (correu).

COMPROVACIONS
- bmbarbera.com/api/classificacio
- bmbarbera.com/api/instagram
