const SUPABASE_FEED_URL =
  'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/merchant-feed';
const SITE = 'https://huumorikauppa.fi';
const PRINTIFY_HOST = 'images-api.printify.com';

function proxiedImage(url) {
  if (!url) return '';
  if (url.includes('/api/img?u=')) return url;
  try {
    if (new URL(url).host !== PRINTIFY_HOST) return url;
  } catch {
    return url;
  }
  return `${SITE}/api/img?u=${encodeURIComponent(url)}`;
}

// Safety net: rewrite any raw Printify URL that slipped through (e.g. inside
// attribute values) so the live feed NEVER exposes images-api.printify.com.
function sanitizeFeed(xml) {
  return xml.replace(
    /https?:\/\/images-api\.printify\.com\/[^\s"'<>]+/g,
    (m) => proxiedImage(m),
  );
}

export default async function handler(req, res) {
  try {
    const upstream = await fetch(SUPABASE_FEED_URL, {
      headers: { 'User-Agent': 'huumorikauppa-feed-proxy' },
    });
    if (!upstream.ok) {
      return res
        .status(502)
        .send(`Upstream feed error: ${upstream.status}`);
    }
    const raw = await upstream.text();
    const xml = sanitizeFeed(raw);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=600, must-revalidate',
    );
    return res.status(200).send(xml);
  } catch (err) {
    console.error('product-feed handler failed:', err);
    return res.status(500).send('Feed generation failed');
  }
}