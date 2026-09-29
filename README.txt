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
- functions/api/classificacio.js Classificació en directe de la federació
- functions/api/instagram.js     Últimes publicacions d'Instagram (Behold)
- src/worker.js                  Worker de Cloudflare (serveix la web i les API)
- wrangler.jsonc                 Configuració del Worker (nom: bmbarbera)

COSES QUE ES CANVIEN SOVINT
- Equips (noms i fotos) ........ js/main.js  -> EQUIPOS
- Patrocinadors ................ js/main.js  -> PATROCINADORS
                                 (logo a images/patrocinadors/)
- Classificació (nova fase) .... functions/api/classificacio.js -> URL_CLASSIFICACIO

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
