const SITE_URL = 'https://huumorikauppa.fi';
const PRINTIFY_HOST = 'images-api.printify.com';

// Only these hostnames actually serve the /api/img Vercel function.
// On lovable preview / localhost we must return the direct Printify URL
// so images render (otherwise /api/img returns the SPA HTML fallback
// and every product image is broken).
const PROXY_HOSTS = new Set(['huumorikauppa.fi', 'www.huumorikauppa.fi']);

function proxyAvailable(): boolean {
  if (typeof window === 'undefined') return true; // SSR / prerender -> allow proxy
  return PROXY_HOSTS.has(window.location.hostname);
}

export function proxiedImage(url?: string | null, opts: { absolute?: boolean } = {}): string {
  if (!url) return '';
  if (url.includes('/api/img?u=')) return url;          // already proxied
  let host = '';
  try { host = new URL(url).host; } catch { return url; } // not an absolute URL -> leave as is
  if (host !== PRINTIFY_HOST) return url;                 // already crawlable host -> leave as is
  if (!proxyAvailable()) return url;                      // preview/dev: use direct URL
  const base = opts.absolute ? SITE_URL : '';
  return `${base}/api/img?u=${encodeURIComponent(url)}`;
}