const ALLOWED_HOSTS = new Set([
  'images-api.printify.com',
  'images.printify.com',
  'pfy-prod-image-storage.s3.amazonaws.com',
  'pfy-prod-automaton-cache.s3.us-east-2.amazonaws.com',
]);

// Sallitut leveydet (?w=), ettei välimuisti pirstoudu. Oletus 1600 (syöte ja tuotesivun pääkuva).
export const LEVEYDET = [320, 480, 640, 800, 1200, 1600];
export function valitseLeveys(w) {
  const n = Number(w);
  if (!Number.isFinite(n) || n <= 0) return 1600;
  return LEVEYDET.find((x) => x >= n) ?? 1600;
}
/** WebP, jos selain kertoo tukevansa sitä (Accept), muuten JPEG. Vary: Accept erottaa välimuistissa. */
export const haluaaWebp = (accept) => /image\/webp/i.test(String(accept || ''));

async function transcodeWithSharp(inputBuffer, leveys = 1600, webp = false) {
  const { default: sharp } = await import('sharp');
  const kuva = sharp(inputBuffer)
    .flatten({ background: '#ffffff' })
    .resize({ width: leveys, height: leveys, fit: 'inside', withoutEnlargement: true });
  return webp ? kuva.webp({ quality: 80 }).toBuffer() : kuva.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
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

    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    res.setHeader('Vary', 'Accept');
    const leveys = valitseLeveys(req.query.w);
    const webp = haluaaWebp(req.headers?.accept);

    try {
      const out = await transcodeWithSharp(inputBuffer, leveys, webp);
      res.setHeader('Content-Type', webp ? 'image/webp' : 'image/jpeg');
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