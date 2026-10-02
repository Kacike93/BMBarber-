// Worker de Cloudflare: serveix la web i les dades en directe.
import { onRequestGet as classificacio } from "../functions/api/classificacio.js";
import { onRequestGet as instagram } from "../functions/api/instagram.js";
import { onRequestGet as equip, onRequestList as equips, onRequestLogo as logo } from "../functions/api/equip.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const context = { request, env, waitUntil: (p) => ctx.waitUntil(p) };
    if (url.pathname === "/api/classificacio") return classificacio(context);
    if (url.pathname === "/api/instagram") return instagram(context);
    if (url.pathname === "/api/equips") return equips(context);
    if (url.pathname === "/api/equip") return equip(context);
    if (url.pathname === "/api/logo") return logo(context);
    return env.ASSETS.fetch(request);
  },
};
