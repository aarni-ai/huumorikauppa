const SUPABASE_FEED_URL =
  'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/merchant-feed';
const SITE = 'https://huumorikauppa.fi';

// Any host that may serve a product image. Everything matched here gets
// rewritten to /api/img?u=... so Googlebot only ever sees our domain.
const PROXY_HOST_PATTERN =
  /https?:\/\/(?:images-api\.printify\.com|images\.printify\.com|pfy-prod-image-storage\.s3\.amazonaws\.com|pfy-prod-automaton-cache\.s3\.us-east-2\.amazonaws\.com)\/[^\s"'<>]+/g;

// Matches URLs that are already wrapped by our image proxy. We append &v=2
// to bust Google Merchant Center's image cache.
const PROXIED_IMAGE_PATTERN =
  /https:\/\/huumorikauppa\.fi\/api\/img\?u=[^\s"'<>]+/g;

// XML-escape ampersands (and a few other unsafe chars) so the value is safe
// to embed inside an XML text node / element. Idempotent for &amp;.
function xmlEscape(s) {
  return s
    .replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function proxiedImage(url) {
  if (!url) return '';
  // Normalize: the regex may capture an already-XML-escaped URL containing
  // &amp;. Work in raw form, then re-escape at the end.
  const raw = url.replace(/&amp;/g, '&');
  let next;
  if (raw.includes('/api/img?u=')) {
    next = raw.includes('v=2') ? raw : `${raw}&v=2`;
  } else {
    next = `${SITE}/api/img?u=${encodeURIComponent(raw)}&v=2`;
  }
  return xmlEscape(next);
}

// Safety net: rewrite any raw upstream image URL that slipped through so the
// live feed NEVER exposes a non-proxied image host.
function sanitizeFeed(xml) {
  // First wrap any raw upstream URLs.
  let out = xml.replace(PROXY_HOST_PATTERN, (m) => proxiedImage(m));
  // Then ensure every already-proxied URL gets the &v=2 cache-buster and
  // that any stray unescaped & is XML-escaped to &amp;.
  out = out.replace(PROXIED_IMAGE_PATTERN, (m) => proxiedImage(m));
  return out;
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