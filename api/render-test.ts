import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RenderTestResponse {
    url: string;
    title: string | null;
    h1: string | null;
    description: string | null;
    price: string | null;
    schemaJson: string | null;
    canonical: string | null;
    statusCode: number;
    timestamp: string;
    verdict: {
          isIndexable: boolean;
          missingElements: string[];
        };
  }

export default async function handler(
    req: VercelRequest,
    res: VercelResponse<RenderTestResponse | { error: string }>
  ) {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
          return res.status(400).json({ error: 'Missing URL parameter' });
        }

    try {
          const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

          const response = await fetch(url, {
                  headers: {
                            'User-Agent': userAgent,
                            'Accept-Language': 'fi-FI'
                          }
                });

          const html = await response.text();

          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const priceMatch = html.match(/data-price=["']?(\d+\.?\d+)["']?/);
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
                                           const schemaMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i);

    const missing = [];
    if (!titleMatch) missing.push('title');
    if (!h1Match) missing.push('h1');
    if (!descMatch) missing.push('meta description');
    if (!priceMatch) missing.push('price element');
    if (!schemaMatch) missing.push('schema.org JSON-LD');
    if (!canonicalMatch) missing.push('canonical URL');

    const result: RenderTestResponse = {
      url,
      title: titleMatch?.[1] || null,
      h1: h1Match?.[1] || null,
      description: descMatch?.[1] || null,
      price: priceMatch?.[1] || null,
      schemaJson: schemaMatch?.[1] || null,
      canonical: canonicalMatch?.[1] || null,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
      verdict: {
        isIndexable: missing.length === 0,
        missingElements: missing
      }
    };

    console.log('[RENDER-TEST]', JSON.stringify(result, null, 2));

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json(result);
  } catch (error) {
    console.error('[RENDER-TEST-ERROR]', error);
    res.status(500).json({ error: String(error) });
  }
}
