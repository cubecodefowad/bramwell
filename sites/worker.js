/**
 * Freebuff Sites entry Worker for the Bramwell site.
 *
 * The site is a fully static single-page build (Vite). This Worker fronts the
 * static asset binding only: it serves the prebuilt files from `dist`, falls
 * back to index.html for document routes, and returns real 404s for missing
 * files so a stale chunk reference fails loudly instead of being answered with
 * HTML. There is no server rendering and no database binding to preserve.
 */

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

/** A path whose last segment has a file extension is a file, not a route. */
const FILE_PATH = /\.[a-z0-9]+$/i;

function withHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function notFound() {
  return new Response('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { allow: 'GET, HEAD', 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') ?? '';
    const servedHtml = contentType.includes('text/html');

    // A file path must never be answered with the app shell: a stale chunk
    // reference should fail as a 404 rather than as HTML with a script MIME type.
    if (FILE_PATH.test(url.pathname)) {
      if (servedHtml || response.status === 404) return notFound();
      return withHeaders(response);
    }

    if (response.status !== 404) return withHeaders(response);

    // Document route: hand back the app shell.
    const shell = await env.ASSETS.fetch(
      new Request(new URL('/index.html', url), { method: request.method, headers: request.headers }),
    );
    if (shell.status >= 400) return notFound();

    return withHeaders(shell, { 'cache-control': 'public, max-age=0, must-revalidate' });
  },
};
