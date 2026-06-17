const SUPABASE_FEED_URL =
  'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/merchant-feed';
const SITE = 'https://huumorikauppa.fi';

// Any host that may serve a product image. Everything matched here gets
// rewritten to /api/img?u=... so Googlebot only ever sees our domain.
const PROXY_HOST_PATTERN =
  /https?:\/\/(?:images-api\.printify\.com|images\.printify\.com|pfy-prod-image-storage\.s3\.amazonaws\.com|pfy-prod-automaton-cache\.s3\.us-east-2\.amazonaws\.com)\/[^\s"'<>]+/g;

function proxiedImage(url) {
  if (!url) return '';
  if (url.includes('/api/img?u=')) return url;
  return `${SITE}/api/img?u=${encodeURIComponent(url)}`;
}

// Safety net: rewrite any raw upstream image URL that slipped through so the
// live feed NEVER exposes a non-proxied image host.
function sanitizeFeed(xml) {
  return xml.replace(PROXY_HOST_PATTERN, (m) => proxiedImage(m));
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