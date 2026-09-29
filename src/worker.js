// Worker de Cloudflare: serveix la web i les dades en directe.
import { onRequestGet as classificacio } from "../functions/api/classificacio.js";
import { onRequestGet as instagram } from "../functions/api/instagram.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const context = { request, env, waitUntil: (p) => ctx.waitUntil(p) };
    if (url.pathname === "/api/classificacio") return classificacio(context);
    if (url.pathname === "/api/instagram") return instagram(context);
    return env.ASSETS.fetch(request);
  },
};
