export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route /play/[id] → /scripts/game/engine.html?id=[id]
    const playMatch = path.match(/^\/play\/(\d+)\/?$/);
    if (playMatch) {
      const id = playMatch[1];
      const newUrl = new URL(request.url);
      newUrl.pathname = '/scripts/game/engine.html';
      newUrl.searchParams.set('id', id);
      return Response.redirect(newUrl.toString(), 302);
    }

    // Everything else: serve static assets (SPA fallback to index.html)
    return env.ASSETS.fetch(request);
  }
};
