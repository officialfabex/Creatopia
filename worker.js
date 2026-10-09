export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // /play/[id]  →  /game/?id=[id]
    const m = path.match(/^\/play\/(\d+)\/?$/);
    if (m) {
      const dest = new URL(request.url);
      dest.pathname = '/game/';
      dest.searchParams.set('id', m[1]);
      return Response.redirect(dest.toString(), 302);
    }

    // All other requests → static assets (SPA fallback = index.html)
    return env.ASSETS.fetch(request);
  }
};
