// Worker de Cloudflare: serveix la web i, a /api/classificacio,
// la classificació en directe de la federació.
import { onRequestGet } from "../functions/api/classificacio.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/classificacio") {
      return onRequestGet({ request, env, waitUntil: (p) => ctx.waitUntil(p) });
    }
    return env.ASSETS.fetch(request);
  },
};
