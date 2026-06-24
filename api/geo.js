// Returns the visitor's coarse city based on Vercel's geo headers.
// Used by ProductPage to show city-specific product recommendations.
// Falls back gracefully — never throws, returns { city: null } on error.
export default function handler(req, res) {
  try {
    const rawCity = req.headers['x-vercel-ip-city'] || '';
    const rawCountry = req.headers['x-vercel-ip-country'] || '';
    const city = rawCity ? decodeURIComponent(String(rawCity)) : '';
    const country = rawCountry ? decodeURIComponent(String(rawCountry)) : '';
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({
      city: city || null,
      country: country || null,
    }));
  } catch (_e) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ city: null, country: null }));
  }
}
