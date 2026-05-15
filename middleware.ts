/**
 * Vercel Edge Middleware — Bot SEO injector
 *
 * Detects search engine and AI crawler requests and injects per-page
 * title, description, canonical and OG tags into the HTML response.
 * Falls through transparently for human visitors.
 */

export const config = {
  matcher: [
    '/((?!favicon.ico|robots.txt|sitemap.xml|product-feed.xml|llms.txt|_vercel|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|map|json|xml|txt)).*)',
  ],
};

const BOT_REGEX =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|perplexitybot|perplexity-user|google-extended|applebot|applebot-extended|ccbot|bytespider|cohere-ai|amazonbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|semrushbot|ahrefsbot|mj12bot|rogerbot/i;

interface PageMeta {
  title: string;
  description: string;
}

const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Hauskat lahjat ja huumorituotteet | Huumorikauppa.fi',
    description: 'Suomen hauskin verkkokauppa – t-paitoja, huppareita, mukeja ja tarroja hauskalla tekstillä. Yli 200 tuotetta, nopea toimitus, ilmainen yli 60 €.',
  },
  '/kaikki-tuotteet': {
    title: 'Kaikki hauskat tuotteet | Huumorikauppa.fi',
    description: 'Selaa kaikki hauskat tuotteet: t-paidat, hupparit, mukit, tarrat, bodyt ja paljon muuta. Löydä täydellinen hauska lahja!',
  },
  '/blogi': {
    title: 'Blogi – Lahjaideat ja vinkit | Huumorikauppa.fi',
    description: 'Lahjaideoita, hauskan ostajan oppaita ja inspiraatiota jokaiseen tilaisuuteen. Löydä paras hauska lahja blogin avulla.',
  },
  '/yhteystiedot': {
    title: 'Yhteystiedot | Huumorikauppa.fi',
    description: 'Ota yhteyttä Huumorikauppaan. Vastaamme nopeasti asiakaspalvelukysymyksiin.',
  },
  '/tietoa-meista': {
    title: 'Tietoa meistä | Huumorikauppa.fi',
    description: 'Huumorikauppa on suomalainen verkkokauppa hauskoille lahjoille ja huumorituotteille. Hauskat t-paidat, hupparit, mukit ja tarrat.',
  },
  '/usein-kysytyt-kysymykset': {
    title: 'Usein kysytyt kysymykset | Huumorikauppa.fi',
    description: 'Vastaukset yleisimpiin kysymyksiin toimituksesta, palautusoikeudesta, koosta ja tilaamisesta.',
  },
  '/toimitusehdot': {
    title: 'Toimitusehdot | Huumorikauppa.fi',
    description: 'Huumorikaupan toimitusehdot. Toimitus 3–10 arkipäivässä, ilmainen toimitus yli 60 € tilauksiin.',
  },
  '/palautusehdot': {
    title: 'Palautusehdot | Huumorikauppa.fi',
    description: 'Huumorikaupan palautusehdot ja -ohjeet. 14 päivän palautusoikeus kaikille tuotteille.',
  },
  '/tietosuojakaytanto': {
    title: 'Tietosuojakäytäntö | Huumorikauppa.fi',
    description: 'Huumorikaupan tietosuojakäytäntö ja henkilötietojen käsittely.',
  },
  '/saavutettavuusseloste': {
    title: 'Saavutettavuusseloste | Huumorikauppa.fi',
    description: 'Huumorikaupan saavutettavuusseloste.',
  },
  // Gift category pages
  '/hauskat-lahjat-miehelle': {
    title: 'Hauskat lahjat miehelle – Parhaat ideat | Huumorikauppa.fi',
    description: 'Hauskat lahjat miehelle – Ideat joita hän ei odota! T-paidat, mukit ja paljon muuta. Nopea toimitus koko Suomeen.',
  },
  '/hauskat-lahjat-naiselle': {
    title: 'Hauskat lahjat naiselle – Ideat joita hän ei odota | Huumorikauppa.fi',
    description: 'Hauskat lahjat naiselle – Persoonalliset ideat kaikille naisille. T-paidat, mukit, tarrat. Nopea toimitus.',
  },
  '/polttari-lahjat': {
    title: 'Polttarilahjat – Hauskat ideat morsiamelle ja sulhaselle | Huumorikauppa.fi',
    description: 'Parhaat polttarilahjat morsiamelle ja sulhaselle! Hauskat ja muistamattomat ideat. Toimitus nopeasti.',
  },
  '/isanpaiva-lahjat': {
    title: 'Isänpäivälahjat – 20 hauskaa lahjaa isälle | Huumorikauppa.fi',
    description: 'Mitä antaa isälle? 20+ hauskaa ideaa isänpäivään. T-paidat, mukit ja paljon muuta. Tilaa nyt!',
  },
  '/aitienpaiva-lahjat': {
    title: 'Äitienpäivälahjat – Hauskat lahjat äidille | Huumorikauppa.fi',
    description: 'Hae inspiraatiota äitienpäivälahjaan! Hauskat ideat äidille. Tilaa helposti verkosta.',
  },
  '/joululahjat': {
    title: 'Joululahjat 2026 – Parhaat hauskat ideat | Huumorikauppa.fi',
    description: 'Parhaat joululahjat 2026! Hauskat ja yllättävät ideat koko perheelle. Osta ajoissa – nopea toimitus.',
  },
  '/syntymapaivaLahjat': {
    title: 'Syntymäpäivälahjat – Hauskat ja unohtumattomat ideat | Huumorikauppa.fi',
    description: 'Hauska syntymäpäivälahja? Löydä täydellinen idea kaikille. Nopea toimitus koko Suomeen.',
  },
  '/elakelahjat': {
    title: 'Eläkeläislahjat – Hauskat muistot eläkkeelle siirtyvälle | Huumorikauppa.fi',
    description: 'Eläkeläislahja joka muistetaan! Parhaat hauskat ideat eläkkeelle jäävälle. Tilaa verkosta helposti.',
  },
  '/lahja-kaverille': {
    title: 'Hauska lahja kaverille – Parhaat ideat | Huumorikauppa.fi',
    description: 'Hauska lahja kaverille – 15+ ideaa jotka varmasti toimii. Nopea toimitus koko Suomeen.',
  },
  '/lahja-tyokaverille': {
    title: 'Lahjat työkavereille – Hauskat toimistolahjat | Huumorikauppa.fi',
    description: 'Hauska toimistolahja työkavereille – Ideat, jotka saavat kaikki nauramaan. Tilaa nyt!',
  },
  // Special content pages
  '/suomalaiset-tyopaikkameemit-top-50': {
    title: 'Suomalaiset Työpaikkameemit Top 50 – 2026 | Huumorikauppa.fi',
    description: 'Parhaat suomalaiset työpaikkameemit koottuna! 50 hauskinta toimistomeemin kokoelma. Tunnista oma työpaikkasi!',
  },
  '/hauskimmat-tyopaikkalaput-2026': {
    title: 'Hauskimmat Työpaikkalaput 2026 | Huumorikauppa.fi',
    description: 'Hauskimmat toimistoon jätetyt laput 2026 – 30 parasta suomalaista työpaikkahuumoria. Kerää talteen!',
  },
  // Category pages
  '/kategoria/t-paidat': {
    title: 'Hauskat T-paidat – Huumoripaidat | Huumorikauppa.fi',
    description: 'Hauskat t-paidat lahjaksi isälle, kaverille tai äidille. Yli 100 mallia, koot XS–3XL. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/hupparit': {
    title: 'Hauskat Hupparit – Huumorihupparit | Huumorikauppa.fi',
    description: 'Hauskat hupparit lahjaksi tai itsellesi. Pehmeät, lämpimät ja hauskat – tilaa helposti verkosta.',
  },
  '/kategoria/pitkahihaiset': {
    title: 'Hauskat pitkähihaiset paidat | Huumorikauppa.fi',
    description: 'Hauskat pitkähihaiset paidat huumorilla ja asenteella. Täydellinen valinta viileisiin päiviin. Ilmainen toimitus yli 60 €.',
  },
  '/kategoria/mukit': {
    title: 'Hauskat Mukit – Huumorimukit lahjaksi | Huumorikauppa.fi',
    description: 'Hauskat kahvimukit lahjaksi tai omaan käyttöön. Unohtumaton lahja – toimitus nopeasti koko Suomeen.',
  },
  '/kategoria/tarrat': {
    title: 'Hauskat Tarrat – Huumoritarrat | Huumorikauppa.fi',
    description: 'Hauskat tarrat läppäriin, vesipulloon ja autoon. Edullinen lisä lahjaksi – alle 10 €. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/bodyt': {
    title: 'Hauskat vauvan bodyt – Vauvalahjat | Huumorikauppa.fi',
    description: 'Hauskat bodyt pienimmille! Täydellinen vauvalahja. Pehmeä materiaali, turvallinen. Nopea toimitus.',
  },
  '/kategoria/peitot': {
    title: 'Hauskat peitot – Huumoripeitot | Huumorikauppa.fi',
    description: 'Hauska peitto lahjaksi tai itselle! Laadukas ja hauska – pitää lämpimänä ja hymyilyttää. Tilaa nyt.',
  },
  '/kategoria/pipot': {
    title: 'Hauskat pipot – Humoristiset päähineet | Huumorikauppa.fi',
    description: 'Hauskat pipot kaikkiin seikkailuihin! Lämmin ja hauska – paras talvilahja kaverille tai itselle.',
  },
  '/kategoria/laukut': {
    title: 'Hauskat laukut ja kangaskassit | Huumorikauppa.fi',
    description: 'Hauskat laukut ja kangaskassit suomalaisella huumorilla. Arkikäyttöön tai lahjaksi. Tilaa helposti!',
  },
  '/kategoria/seinataulut': {
    title: 'Hauskat seinätaulut – Huumorisisustus | Huumorikauppa.fi',
    description: 'Hauskat seinätaulut kodin sisustukseen! Piristä seinät suomalaisella huumorilla. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/koristeet': {
    title: 'Hauskat koristeet kotiin | Huumorikauppa.fi',
    description: 'Hauskat koristeet kotiin – Huumoria joka nurkkaan. Lahjana tai itselle. Nopea toimitus.',
  },
};

// Blog post metadata (slug without /blogi/ prefix)
const BLOG_META: Record<string, PageMeta> = {
  '20-hauskinta-t-paitaa-2026': {
    title: '20 Hauskinta T-paitaa 2026 – Parhaat Valinnat | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa t-paitaa? Listasimme 20 parasta huumori-t-paitaa 2026! Kaikille sopivat koot. Tilaa nyt, nopea toimitus.',
  },
  'hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat': {
    title: 'Hauskat Syntymäpäivälahjat – Ideat Miehelle ja Naiselle | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa syntymäpäivälahjaa? Parhaat ideat miehelle ja naiselle! Nopea toimitus koko Suomeen.',
  },
  'hauskat-mukit-toimistoon-ja-lahjaksi': {
    title: 'Hauskat Mukit Toimistoon ja Lahjaksi – 15 Parasta | Huumorikauppa.fi',
    description: 'Parhaat hauskat mukit töihin, kotiin tai lahjaksi! Löydä täydellinen muki suomalaisella huumorilla. Tilaa nyt.',
  },
  'parhaat-polttaripaidat-ja-polttarilahjat-2026': {
    title: 'Parhaat Polttarilahjat 2026 – Hauskat Ideat | Huumorikauppa.fi',
    description: 'Parhaat polttarilahjat morsiamelle ja sulhaselle 2026! Hauskat paidat, mukit ja paljon muuta. Nopea toimitus.',
  },
  'parhaat-joululahjat-ja-pikkujoululahjat-2026': {
    title: 'Parhaat Joululahjat 2026 – Hauskat Ideat Koko Perheelle | Huumorikauppa.fi',
    description: 'Parhaat joululahjaideat 2026! Hauskat ja yllättävät lahjat koko perheelle. Osta ajoissa – nopea toimitus.',
  },
  'parhaat-hauskat-lahjat-miehelle': {
    title: 'Parhaat Hauskat Lahjat Miehelle – 25 Ideaa | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa miehelle? 25+ parasta ideaa kaiken ikäisille miehille! Nopea toimitus.',
  },
  'hauskat-lahjat-naiselle-opas': {
    title: 'Hauskat Lahjat Naiselle – Ideat Joita Hän Ei Odota | Huumorikauppa.fi',
    description: 'Hauskat lahjat naiselle! Persoonalliset ja hauskat ideat kaikille naisille. Nopea toimitus koko Suomeen.',
  },
  'mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea': {
    title: 'Mitä Antaa 50-Vuotiaalle Jolla On Jo Kaikkea? | Huumorikauppa.fi',
    description: '50-vuotiaan lahja on aina hankala! Meillä on ratkaisut – hauskat ja persoonalliset lahjat 50v täyttävälle.',
  },
  'hauskat-isanpaivalahjat-opas': {
    title: 'Hauskat Isänpäivälahjat – Opas Parhaaseen Lahjaan | Huumorikauppa.fi',
    description: 'Mitä antaa isälle isänpäiväksi? Parhaat hauskat ideat kaikenlaisille isille. Nopea toimitus.',
  },
  'hauska-aitienpaivalahja-opas': {
    title: 'Hauska Äitienpäivälahjat – Opas Lahjaan Joka Yllättää | Huumorikauppa.fi',
    description: 'Parhaat hauskat äitienpäivälahjat! Ideat jotka äiti muistaa. Nopea toimitus koko Suomeen.',
  },
  'hauskat-elakelahjat-opas': {
    title: 'Hauskat Eläkeläislahjat – Parhaat Ideat Eläkkeelle Siirtyvälle | Huumorikauppa.fi',
    description: 'Eläkeläislahja joka muistetaan! Parhaat hauskat ideat eläkkeelle jäävälle. Tilaa verkosta helposti.',
  },
  'parhaat-hauskat-tarrat-lappariin': {
    title: 'Parhaat Hauskat Tarrat Läppäriin ja Muualle | Huumorikauppa.fi',
    description: 'Hauskat tarrat läppäriin, puhelimeen, auton takalasiin tai seinälle! Laadukkaat suomalaiset huumoritarrat.',
  },
  'hauska-vauvalahja-parhaat-bodyt': {
    title: 'Hauska Vauvalahja – Parhaat Bodyt ja Muut Ideat | Huumorikauppa.fi',
    description: 'Parhaat hauskat vauvalahjavinkit! Hauska body on täydellinen lahja uudelle perheelle. Tilaa nyt.',
  },
  'parhaat-meemituotteet-2025': {
    title: 'Parhaat Meemituotteet 2025 – Hauskat Meemin Inspiroimat Lahjat | Huumorikauppa.fi',
    description: 'Meemit ja hauskat lahjat – paras yhdistelmä! Löydä parhaat meemituotteet 2025. Tilaa helposti.',
  },
  'hauskat-seinataulut-sisusta-huumorilla': {
    title: 'Hauskat Seinätaulut – Sisusta Koti Huumorilla | Huumorikauppa.fi',
    description: 'Hauskat seinätaulut kodin sisustukseen! Piristä seinät suomalaisella huumorilla. Nopea toimitus.',
  },
  'miksi-hauska-paita-paras-lahja': {
    title: 'Miksi Hauska T-paita On Paras Lahja? – Syyt Selitetty | Huumorikauppa.fi',
    description: 'Hauska t-paita lahjaksi – miksi se toimii aina? Lue parhaat syyt ja vinkit oikean paidan valintaan.',
  },
  'lahja-miehelle-30v-40v-50v-60v': {
    title: 'Lahja Miehelle 30v, 40v, 50v tai 60v – Hauskat Ideat | Huumorikauppa.fi',
    description: 'Miehen pyöreä syntymäpäivä tulossa? Löydä täydellinen hauska lahja 30-, 40-, 50- tai 60-vuotiaalle!',
  },
  'lahja-naiselle-30v-40v-50v-60v': {
    title: 'Lahja Naiselle 30v, 40v, 50v tai 60v – Hauskat Ideat | Huumorikauppa.fi',
    description: 'Naisen pyöreä syntymäpäivä? Hauskat ja persoonalliset lahjaideat 30-, 40-, 50- ja 60-vuotiaalle naiselle!',
  },
  'hauskat-syntymapaivaLahjat-opas': {
    title: 'Hauskat Syntymäpäivälahjat – Täydellinen Opas 2025 | Huumorikauppa.fi',
    description: 'Parhaat hauskat syntymäpäivälahjat 2025! Ideat kaikille – miehelle, naiselle, lapselle. Nopea toimitus.',
  },
  'lahja-henkilolle-jolla-on-jo-kaikkea': {
    title: 'Lahja Henkilölle Jolla On Jo Kaikkea – 20 Ideaa | Huumorikauppa.fi',
    description: 'Kaverilla tai sukulaisella jo kaikki? Meillä on ratkaisut! 20 hauskaa lahjaa henkilölle jolla on jo kaikkea.',
  },
  'hauskat-lahjat-tyokavereille-opas': {
    title: 'Hauskat Lahjat Työkavereille – Toimistolahjat Jotka Toimii | Huumorikauppa.fi',
    description: 'Parhaat hauskat lahjat työkavereille! Toimistolahjat jotka saavat kaikki nauramaan. Tilaa nyt.',
  },
  'hauska-lahja-kalastajalle': {
    title: 'Hauska Lahja Kalastajalle – Parhaat Ideat Kalamiehenlahjaan | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa kalastajalle? Löydä parhaat ideat – t-paidat, mukit ja muut hauskuudet!',
  },
  'hauska-lahja-alle-20-euroa': {
    title: 'Hauska Lahja Alle 20 Euroa – Parhaat Edulliset Ideat | Huumorikauppa.fi',
    description: 'Parhaat hauskat lahjat alle 20 €! Edullisia ja hauskoja ideoita kaikkiin tilaisuuksiin. Nopea toimitus.',
  },
  'hauska-lahja-saunojalle': {
    title: 'Hauska Lahja Saunojalle – Parhaat Saunavinkit | Huumorikauppa.fi',
    description: 'Lahja saunojalle? Me tiedämme mitä suomalaiset saunojat haluavat! Hauskat lahjat saunan ystäville.',
  },
  'hauska-lahja-nortille-ja-gamerille': {
    title: 'Hauska Lahja Nortille ja Gamerille – Ideat Jotka Osuvat | Huumorikauppa.fi',
    description: 'Hauska lahja nortille tai gamerille? Löydä parhaat ideat – t-paidat, mukit ja muut geeklahjat!',
  },
  'hauskat-valmistujaislahjat': {
    title: 'Hauskat Valmistujaislahjat – Ideat Ylioppilaalle ja Opiskelijalle | Huumorikauppa.fi',
    description: 'Parhaat hauskat valmistujaislahjat 2026! Ideat ylioppilaalle, opiskelijalle ja ammattilaiselle. Tilaa nyt.',
  },
  'hauskat-pipot-suomi': {
    title: 'Hauskat Pipot – Löydä Paras Humoristinen Pipo | Huumorikauppa.fi',
    description: 'Hauskat pipot suomalaisella huumorilla! Lämmin ja hauska pipo lahjaksi tai itselle. Tilaa nyt.',
  },
  'hauskat-peitot-lahjaksi': {
    title: 'Hauska Peitto Lahjaksi – Parhaat Huumoripeittoideat | Huumorikauppa.fi',
    description: 'Hauska peitto lahjaksi! Laadukas ja hauska peitto – pitää lämpimänä ja hymyilyttää. Tilaa nyt.',
  },
  'hauska-lahja-opettajalle': {
    title: 'Hauska Lahja Opettajalle – Parhaat Opettajanlahjavinkit | Huumorikauppa.fi',
    description: 'Opettajanlahja joka muistetaan! Parhaat hauskat ideat opettajalle. Nopea toimitus.',
  },
  'hauska-lahja-urheilijalle': {
    title: 'Hauska Lahja Urheilijalle – Parhaat Liikuntalahjaideat | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa urheilijalle? Parhaat hauskat lahjaideat kuntosali- ja juoksuharrastajille.',
  },
  'hauskat-laukut-kangaskassit': {
    title: 'Hauskat Laukut ja Kangaskassit – Parhaat Valinnat | Huumorikauppa.fi',
    description: 'Hauskat kangaskassit ja laukut suomalaisella huumorilla! Ekologinen ja hauska – erinomainen lahja.',
  },
  'hauskat-lahjat-koiraihmiselle': {
    title: 'Hauska Lahja Koiraihmiselle – Ideat Koiraharrastajalle | Huumorikauppa.fi',
    description: 'Lahja koiran omistajalle? Parhaat hauskat ideat kaikille koiraihmisille! Nopea toimitus.',
  },
  'hauskat-lahjat-kissaihmiselle': {
    title: 'Hauska Lahja Kissaihmiselle – Ideat Kissan Omistajalle | Huumorikauppa.fi',
    description: 'Parhaat hauskat lahjat kissaihmiselle! T-paidat, mukit ja muut kissakeskeiset hauskuudet.',
  },
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (request.headers.get('x-bot-inject') === 'true') {
    return undefined;
  }

  const ua = request.headers.get('user-agent') || '';
  if (!BOT_REGEX.test(ua)) {
    return undefined;
  }

  const url = new URL(request.url);
  const path = url.pathname;

  let meta: PageMeta | undefined;

  // Exact match
  if (PAGE_META[path]) {
    meta = PAGE_META[path];
  }
  // Blog post: /blogi/:slug
  else if (path.startsWith('/blogi/')) {
    const slug = path.slice('/blogi/'.length).replace(/\/$/, '');
    meta = BLOG_META[slug];
    if (!meta) {
      meta = {
        title: `${slug.replace(/-/g, ' ')} | Huumorikauppa.fi`,
        description: 'Lahjaideoita ja hauskan ostajan oppaita Huumorikaupasta. Löydä paras hauska lahja!',
      };
    }
  }
  // Situation gift pages: /lahjat/:slug
  else if (path.startsWith('/lahjat/')) {
    const slug = path.slice('/lahjat/'.length).replace(/\/$/, '');
    meta = {
      title: `${slug.replace(/-/g, ' ')} – Hauska lahja | Huumorikauppa.fi`,
      description: 'Hauskat lahjat ja tuotteet Huumorikaupasta. Nopea toimitus, ilmainen yli 60 €.',
    };
  }

  if (!meta) {
    return undefined;
  }

  try {
    const baseRequest = new Request(url.origin + '/', {
      headers: { 'x-bot-inject': 'true' },
    });
    const baseResponse = await fetch(baseRequest);
    if (!baseResponse.ok) return undefined;

    let html = await baseResponse.text();

    const canonical = `https://huumorikauppa.fi${path}`;
    const safeTitle = escapeHtml(meta.title);
    const safeDesc = escapeHtml(meta.description);

    html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);
    html = html.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${safeDesc}">`
    );

    const canonicalTag = `<link rel="canonical" href="${canonical}">`;
    if (/<link rel="canonical"[^>]*>/.test(html)) {
      html = html.replace(/<link rel="canonical"[^>]*>/, canonicalTag);
    } else {
      html = html.replace('</head>', `  ${canonicalTag}\n</head>`);
    }

    html = html.replace(
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${safeTitle}">`
    );
    html = html.replace(
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${safeDesc}">`
    );
    html = html.replace(
      /<meta property="og:url"[^>]*>/,
      `<meta property="og:url" content="${canonical}">`
    );
    html = html.replace(
      /<meta name="twitter:title"[^>]*>/,
      `<meta name="twitter:title" content="${safeTitle}">`
    );
    html = html.replace(
      /<meta name="twitter:description"[^>]*>/,
      `<meta name="twitter:description" content="${safeDesc}">`
    );

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Bot-Served': 'true',
        'Vary': 'User-Agent',
      },
    });
  } catch {
    return undefined;
  }
}
