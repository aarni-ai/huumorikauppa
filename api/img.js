import sharp from 'sharp';

const ALLOWED_HOSTS = new Set([
  'images-api.printify.com',
  'images.printify.com',
  'pfy-prod-image-storage.s3.amazonaws.com',
  'pfy-prod-automaton-cache.s3.us-east-2.amazonaws.com',
]);

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

    // Always run through sharp -> clean baseline sRGB JPEG. This normalises
    // Printify's CMYK / progressive / oddly-headered JPEGs that GMC rejects.
    try {
      const out = await sharp(inputBuffer)
        .flatten({ background: '#ffffff' })
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader(
        'Cache-Control',
        'public, max-age=86400, s-maxage=604800, immutable',
      );
      return res.status(200).send(out);
    } catch (e) {
      console.error('Transcode failed:', e);
      return res.status(502).send('Could not process image');
    }
  } catch (err) {
    console.error('Image proxy failed:', err);
    return res.status(502).send('Image fetch failed');
  }
}