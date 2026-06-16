const SITE_URL = 'https://huumorikauppa.fi';
const PRINTIFY_HOST = 'images-api.printify.com';

export function proxiedImage(url?: string | null, opts: { absolute?: boolean } = {}): string {
  if (!url) return '';
  if (url.includes('/api/img?u=')) return url;          // already proxied
  let host = '';
  try { host = new URL(url).host; } catch { return url; } // not an absolute URL -> leave as is
  if (host !== PRINTIFY_HOST) return url;                 // already crawlable host -> leave as is
  const base = opts.absolute ? SITE_URL : '';
  return `${base}/api/img?u=${encodeURIComponent(url)}`;
}