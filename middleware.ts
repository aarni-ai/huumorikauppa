export const config = {
  matcher: ['/((?!.*\\..*|_vercel).*)'],
};

const BOTS = ['googlebot','bingbot','yandexbot','duckduckbot','applebot',
  'facebookexternalhit','twitterbot','linkedinbot','whatsapp','slackbot',
  'discordbot','google-inspectiontool','adsbot-google','mediapartners-google',
  'chrome-lighthouse','pinterestbot','semrushbot','ahrefsbot'];

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const isBot = BOTS.some(b => ua.includes(b));

  if (isBot) {
    const token = process.env.PRERENDER_TOKEN;
    if (!token) return undefined;

    const prerendered = await fetch(`https://service.prerender.io/${request.url}`, {
      headers: {
        'X-Prerender-Token': token,
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Prerender-Int-Type': 'Vercel',
      },
    });
    return prerendered;
  }
  return undefined;
}
