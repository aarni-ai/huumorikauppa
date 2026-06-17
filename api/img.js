const ALLOWED_HOSTS = new Set([
  'images-api.printify.com',
  'images.printify.com',
  'pfy-prod-image-storage.s3.amazonaws.com',
  'pfy-prod-automaton-cache.s3.us-east-2.amazonaws.com',
]);

async function transcodeWithSharp(inputBuffer) {
  const { default: sharp } = await import('sharp');
  return sharp(inputBuffer)
    .flatten({ background: '#ffffff' })
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

async function transcodeWithWsrv(target) {
  const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(target.toString())}&output=jpg&w=1600&q=85`;
  const response = await fetch(wsrvUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (huumorikauppa-image-proxy)' },
  });
  if (!response.ok) throw new Error(`wsrv returned ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export default async function handler(req, res) {
  const u = req.query.u;
  if (!u) return res.status(400).send('Missing ?u=');

  let target;
  try { target = new URL(u); } catch { return res.status(400).send('Invalid URL'); }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return res.status(403).send('Host not allowed');
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (huumorikauppa-image-proxy)' },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).send('Upstream returned ' + upstream.status);
    }

    const inputBuffer = Buffer.from(await upstream.arrayBuffer());
    const ct = (upstream.headers.get('content-type') || 'image/jpeg').toLowerCase();

    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    try {
      const out = await transcodeWithSharp(inputBuffer);
      res.setHeader('Content-Type', 'image/jpeg');
      return res.status(200).send(out);
    } catch (err) {
      console.error('sharp transcode FAILED, trying wsrv.nl fallback:', err);
      try {
        const out = await transcodeWithWsrv(target);
        res.setHeader('Content-Type', 'image/jpeg');
        return res.status(200).send(out);
      } catch (wsrvErr) {
        console.error('wsrv.nl fallback FAILED, serving original bytes:', wsrvErr);
        res.setHeader('Content-Type', ct);
        return res.status(200).send(inputBuffer);
      }
    }
  } catch (err) {
    console.error('Image proxy failed:', err);
    return res.status(502).send('Image fetch failed');
  }
}