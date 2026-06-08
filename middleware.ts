/**
 * Vercel Edge Middleware — Bot SEO injector
 *
 * Detects search engine and AI crawler requests and injects per-page
 * title, description, canonical and OG tags into the HTML response.
 * Product data is fetched live from Supabase REST API so the middleware
 * stays correct as the catalog grows without any code changes.
 * Falls through transparently for human visitors.
 */

export const config = {
  matcher: [
    '/((?!favicon.ico|robots.txt|sitemap.xml|product-feed.xml|llms.txt|_vercel|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|map|json|xml|txt)).*)',
  ],
};

const BOT_REGEX =
  /googlebot|storebot-google|google-inspectiontool|apis-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|perplexitybot|perplexity-user|google-extended|applebot|applebot-extended|ccbot|bytespider|cohere-ai|amazonbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|semrushbot|ahrefsbot|mj12bot|rogerbot/i;

interface PageMeta {
  title: string;
  description: string;
  noindex?: boolean;
}

// ── Supabase dynamic product fetch ───────────────────────────────────────────

interface SupabaseProduct {
  slug: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  stock: number;
}

const SUPABASE_URL: string = (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) || '';
const SUPABASE_KEY: string = (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY)) || '';

async function fetchProductBySlug(slug: string): Promise<SupabaseProduct | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=slug,name,description,images,price,category,stock&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return null;
    const data: SupabaseProduct[] = await res.json();
    return data[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchCategoryProducts(
  categories: string[],
  limit = 20
): Promise<Array<{ slug: string; name: string; image: string; price: number }>> {
  if (!SUPABASE_URL || !SUPABASE_KEY || categories.length === 0) return [];
  const filter =
    categories.length === 1
      ? `category=eq.${categories[0]}`
      : `category=in.(${categories.join(',')})`;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?${filter}&select=slug,name,images,price&order=created_at.desc&limit=${limit}`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return [];
    const data: Array<{ slug: string; name: string; images: string[]; price: number }> = await res.json();
    return data.map(p => ({ slug: p.slug, name: p.name, image: (p.images && p.images[0]) || '', price: Number(p.price) }));
  } catch {
    return [];
  }
}

// ── Static page metadata ──────────────────────────────────────────────────────

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
    description: 'Huumorikaupan palautusehdot. 14 päivän palautusoikeus kaikille tuotteille.',
  },
  '/tietosuojakaytanto': {
    title: 'Tietosuojakäytäntö | Huumorikauppa.fi',
    description: 'Huumorikaupan tietosuojakäytäntö. Käsittelemme henkilötietoja GDPR:n mukaisesti.',
  },
  '/saavutettavuusseloste': {
    title: 'Saavutettavuusseloste | Huumorikauppa.fi',
    description: 'Huumorikauppa.fi:n saavutettavuusseloste.',
  },
  '/haku': {
    title: 'Haku | Huumorikauppa.fi',
    description: 'Etsi haluamaasi tuotetta Huumorikaupan valikoimasta.',
  },
  '/aitienpaiva': {
    title: 'Äitienpäivälahjat – Hauskat ideat äidille | Huumorikauppa.fi',
    description: 'Hauskat äitienpäivälahjat äidille, mummille tai tädille. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/t-paidat': {
    title: 'Hauskat T-paidat – Huumoripaitat | Huumorikauppa.fi',
    description: 'Hauskat t-paidat suomalaisella huumorilla. Laaja valikoima huumoriteemoja: ammattihuumori, eläkeläinen, kalamies ja paljon muuta. Tilaa nyt!',
  },
  '/kategoria/hupparit': {
    title: 'Hauskat Hupparit – Huumorihupparit | Huumorikauppa.fi',
    description: 'Hauskat hupparit kaikille! Laaja valikoima huumoriteemoja: ammattihuumori, eläkeläinen, kalamies ja paljon muuta. Nopea toimitus.',
  },
  '/kategoria/mukit': {
    title: 'Hauskat Mukit – Huumorimukit | Huumorikauppa.fi',
    description: 'Hauskat kahvimukit ja teekupit suomalaisella huumorilla. Täydellinen lahja kollegalle, isälle tai äidille.',
  },
  '/kategoria/tarrat': {
    title: 'Hauskat Tarrat – Huumoritarrat | Huumorikauppa.fi',
    description: 'Hauskat tarrat läppäriin, autoon, vesipulloon ja muualle. Laadukas vinyyli, kestää ulkona.',
  },
  '/kategoria/bodyt': {
    title: 'Hauskat Vauva-Bodyt – Hauskoja Vauvalahjoja | Huumorikauppa.fi',
    description: 'Hauskat vauva-bodyt – täydellinen vauvalahja! Laadukas puuvilla, kestää pesua. Tilaa nyt.',
  },
  '/kategoria/pipot': {
    title: 'Hauskat Pipot – Huumorihatuilla | Huumorikauppa.fi',
    description: 'Hauskat pipot suomalaisella huumorilla. Lämpimät ja persoonalliset talvipipot, loistava lahja!',
  },
  '/kategoria/lippikset': {
    title: 'Hauskat Lippikset – Huumorilakit | Huumorikauppa.fi',
    description: 'Hauskat lippikset kesäksi tai lahjaksi. Brodeeratut logot ja hauskuudet.',
  },
  '/kategoria/peitot': {
    title: 'Hauskat Peitot – Huumoripeitot | Huumorikauppa.fi',
    description: 'Hauskat fleecepeitot lahjaksi tai itselle. Lämpimät ja hauskuuttavat kuviot. Loistava lahja!',
  },
  '/kategoria/laukut': {
    title: 'Hauskat Laukut ja Kangaskassit | Huumorikauppa.fi',
    description: 'Hauskat kangaskassit ja laukut suomalaisella huumorilla. Ekologinen ja hauska lahja!',
  },
  '/kategoria/seinataulut': {
    title: 'Hauskat Seinätaulut – Sisustus Huumorilla | Huumorikauppa.fi',
    description: 'Hauskat seinätaulut kodin sisustukseen. Piristä seinät suomalaisella huumorilla!',
  },
  '/kategoria/koristeet': {
    title: 'Hauskat Koristeet – Sisustuskoristeet | Huumorikauppa.fi',
    description: 'Hauskat koristeet kotiin ja toimistoon. Uniikit koristeet suomalaisella huumorilla.',
  },
  '/kategoria/pitkahihaiset': {
    title: 'Hauskat Pitkähihaiset Paidat | Huumorikauppa.fi',
    description: 'Hauskat pitkähihaiset paidat suomalaisella huumorilla. Laadukkaat ja mukavat.',
  },
  '/kategoria/haalarimerkit': {
    title: 'Haalarimerkit – Hauskat merkit haalareihin | Huumorikauppa.fi',
    description: 'Haalarimerkit opiskelijoille ja kaikille haalarien ystäville. Brodeeratut ja painetut merkit. Nopea toimitus.',
  },
  '/hauskat-lahjat-miehelle': {
    title: 'Hauskat Lahjat Miehelle – Parhaat Ideat | Huumorikauppa.fi',
    description: 'Hauskat lahjat miehelle: isälle, ukille, kaverille tai puolisolle. Huumoripaidat ja -hupparit ammattihuumorilla. Nopea toimitus.',
  },
  '/hauskat-lahjat-naiselle': {
    title: 'Hauskat Lahjat Naiselle – Parhaat Ideat | Huumorikauppa.fi',
    description: 'Hauskat lahjat naiselle: äidille, mummille tai tyttökaverille. Huumoripaidat, -hupparit ja -mukit. Nopea toimitus.',
  },
  '/polttari-lahjat': {
    title: 'Polttarilahjat – Hauskat Ideat Polttareihin | Huumorikauppa.fi',
    description: 'Hauskat polttarilahjat morsiamelle ja sulhaselle. Yhteiset polttaripaidat koko porukalle. Tilaa nyt!',
  },
  '/isanpaiva-lahjat': {
    title: 'Isänpäivälahjat – Hauskat Ideat Isälle | Huumorikauppa.fi',
    description: 'Hauskat isänpäivälahjat isälle, isoisälle ja sedälle. Ammattihuumori- ja harrastusteemaiset tuotteet. Tilaa ajoissa!',
  },
  '/aitienpaiva-lahjat': {
    title: 'Äitienpäivälahjat – Hauskat Ideat Äidille | Huumorikauppa.fi',
    description: 'Hauskat äitienpäivälahjat äidille ja mummille. Persoonalliset lahjat jotka muistetaan. Nopea toimitus.',
  },
  '/joululahjat': {
    title: 'Joululahjat 2026 – Hauskat Ideat Koko Perheelle | Huumorikauppa.fi',
    description: 'Parhaat joululahjat 2026! Hauskat ja yllättävät ideat koko perheelle. Osta ajoissa – nopea toimitus.',
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
  '/hauskat-t-paidat': {
    title: 'Hauskat T-paidat – Suomen parhaat huumoripaidat | Huumorikauppa.fi',
    description: 'Hauskat t-paidat lahjaksi tai itselle. Huumoripaitoja kalamiehille, isille, äijille ja kaikille hauskan ystäville. Tilaa nyt.',
  },
  '/hauskat-hupparit': {
    title: 'Hauskat Hupparit – Huumorihuppareita Suomessa | Huumorikauppa.fi',
    description: 'Hauskat hupparit lahjaksi tai itselle. Lämpimiä huumorihuppareita ammattihuumorilla. Painettu Suomessa, nopea toimitus.',
  },
  '/lahja-miehelle': {
    title: 'Lahja Miehelle – Hauskat lahjaideat | Huumorikauppa.fi',
    description: 'Hauska lahja miehelle — isälle, ukille, kaverille tai puolisolle. Huumoripaidat ja -hupparit ammattihuumorilla. Tilaa Huumorikauppa.fi:stä.',
  },
  '/syntymapaivalahjat': {
    title: 'Syntymäpäivälahjat – Hauskat synttärilahjat | Huumorikauppa.fi',
    description: 'Hauskat syntymäpäivälahjat kaikkiin ikiin. Huumorituotteita pyöreille vuosille ja arkisille synttäreille. Tilaa Huumorikauppa.fi:stä.',
  },
  '/suomalaiset-tyopaikkameemit-top-50': {
    title: 'Suomalaiset Työpaikkameemit Top 50 – 2026 | Huumorikauppa.fi',
    description: 'Parhaat suomalaiset työpaikkameemit koottuna! 50 hauskinta toimistomeemin kokoelma. Tunnista oma työpaikkasi!',
  },
  '/hauskimmat-tyopaikkalaput-2026': {
    title: 'Hauskimmat Työpaikkalaput 2026 – Toimistovitsit | Huumorikauppa.fi',
    description: 'Hauskimmat työpaikkalaput 2026! Parhaat toimistovitsit ja lappushuumori. Tunnista oma toimistosi!',
  },
  '/haalarimerkit': {
    title: 'Haalarimerkit Opiskelijalle – Hauskat merkit haalareihin | Huumorikauppa.fi',
    description: 'Haalarimerkit opiskelijoille — räätälöitäviä ja valmiita malleja. Toimitamme nopeasti Suomeen. Tilaa Huumorikauppa.fi:stä.',
  },
  '/opiskelijan-haalarimerkit': {
    title: 'Opiskelijan haalarimerkit – Hauskat merkit | Huumorikauppa.fi',
    description: 'Opiskelijan haalarimerkit kaikille kiltojen ja ainejärjestöjen jäsenille. Räätälöitävät merkit ja valmiit mallit.',
  },
  '/admin': {
    title: 'Admin – Huumorikauppa',
    description: 'Huumorikaupan admin-paneeli.',
    noindex: true,
  },
  '/admin/login': {
    title: 'Admin-kirjautuminen – Huumorikauppa',
    description: 'Huumorikaupan admin-paneeli.',
    noindex: true,
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
  'hauskat-valmistujaislahjat-2026': {
    title: 'Hauskat Valmistujaislahjat 2026 – Ylioppilas ja AMK | Huumorikauppa.fi',
    description: 'Parhaat hauskat valmistujaislahjat 2026! Ideat ylioppilaalle, AMK:sta valmistuvalle ja maisterille. Nopea toimitus.',
  },
  'hauska-lahja-juhannukseen-2026': {
    title: 'Hauska Lahja Juhannukseen 2026 – Parhaat Mökkimukit ja Saunapaidat | Huumorikauppa.fi',
    description: 'Parhaat hauskat juhannuslahjat 2026! Mökkimukit, saunapaidat ja tarrat koko juhannusseurueelle. Tilaa ennen 19.6.',
  },
  'hauskat-lahjat-alle-30-euroa': {
    title: 'Hauskat Lahjat Alle 30 Euroa – Top 10 Edullista Ideaa | Huumorikauppa.fi',
    description: 'Top 10 hauskaa lahjaa alle 30 €! Edulliset mutta laadukkaat lahjaideat kaikkiin tilaisuuksiin. Nopea toimitus.',
  },
};

// Category slug → display name
const CATEGORY_NAMES: Record<string, string> = {
  't-paidat': 'T-paidat', 'hupparit': 'Hupparit', 'mukit': 'Mukit',
  'tarrat': 'Tarrat', 'pipot': 'Pipot', 'lippikset': 'Lippikset',
  'haalarimerkit': 'Haalarimerkit', 'bodyt': 'Bodyt', 'peitot': 'Peitot',
  'laukut': 'Laukut', 'seinataulut': 'Seinätaulut', 'koristeet': 'Koristeet',
  'pitkahihaiset': 'Pitkähihaiset',
};

// Gift page path → categories to show products from
const GIFT_CATEGORY_CATS: Record<string, string[]> = {
  '/hauskat-lahjat-miehelle': ['t-paidat', 'hupparit', 'mukit'],
  '/hauskat-lahjat-naiselle': ['t-paidat', 'hupparit', 'mukit'],
  '/hauskat-t-paidat':        ['t-paidat'],
  '/hauskat-hupparit':        ['hupparit'],
  '/lahja-miehelle':          ['t-paidat', 'hupparit', 'mukit'],
  '/isanpaiva-lahjat':        ['t-paidat', 'hupparit', 'mukit'],
  '/joululahjat':             ['t-paidat', 'hupparit', 'mukit'],
  '/syntymapaivalahjat':      ['t-paidat', 'hupparit', 'mukit'],
  '/elakelahjat':             ['t-paidat', 'hupparit', 'mukit'],
  '/polttari-lahjat':         ['t-paidat', 'hupparit'],
  '/lahja-kaverille':         ['t-paidat', 'hupparit', 'mukit'],
  '/lahja-tyokaverille':      ['mukit', 'tarrat', 'pipot'],
  '/haalarimerkit':           ['haalarimerkit'],
  '/opiskelijan-haalarimerkit': ['haalarimerkit'],
};

// FAQ data for category pages
const CATEGORY_FAQS: Record<string, Array<{q: string; a: string}>> = {
  't-paidat': [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "T-paitamme ovat 100 % puuvillaa tai puuvilla-polyesteri-sekoitteita. Materiaali on pehmeä ihoa vasten ja kestää useita pesuja muuttumatta. Koot XS–3XL." },
    { q: "Onko t-paidat painettu Suomessa?", a: "Kyllä, kaikki t-paitamme painetaan Suomessa tai EU:ssa tilauksesta DTG-tekniikalla (Direct-to-Garment), joka tuottaa kirkkaan ja kestävän painatuksen." },
    { q: "Kuinka nopeasti tilaus toimitetaan?", a: "Tilaukset toimitetaan 3–7 arkipäivässä koko Suomeen PostNordin kautta. Ilmainen toimitus yli 60 € tilauksiin. Saat sähköpostiisi seurantakoodin heti kun paketti lähtee." },
    { q: "Voiko t-paidan palauttaa?", a: "Kyllä, standardituotteilla on 14 päivän palautusoikeus. Palautus on helppo — ota yhteyttä asiakaspalveluumme, saat ohjeet sähköpostitse." },
  ],
  'hupparit': [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Hupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta (80/20). Materiaali on lämmin, pehmeä ja kestää useita pesuja. Koot S–3XL." },
    { q: "Onko hupparit painettu Suomessa?", a: "Kyllä, kaikki hupparimme painetaan Suomessa tai EU:ssa tilauksesta DTG-tekniikalla." },
    { q: "Kuinka nopeasti huppari toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää koko Suomeen. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko hupparin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme saadaksesi palautusohjeet." },
  ],
  'mukit': [
    { q: "Onko mukit konepesun kestäviä?", a: "Kyllä, kaikki mukimme kestävät konepesua. Suosittelemme pesemään matalalla lämpötilalla (40°C) painatuksen säilymiseksi pidempään." },
    { q: "Minkä kokoisia mukit ovat?", a: "Mukimme ovat standardi 11 oz (noin 325 ml) -kokoisia. Sopivat aamukahviin tai teehen." },
    { q: "Kuinka nopeasti muki toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko mukin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus kaikille tuotteille. Ota yhteyttä asiakaspalveluumme." },
  ],
  'tarrat': [
    { q: "Onko tarrat ulkokäyttöön sopivia?", a: "Kyllä, tarramme ovat laadukasta vinyyliä joka kestää kosteutta, UV-valoa ja lämpötilavaihteluita. Sopivat autoon, vesipulloon, läppäriin ja ulkokäyttöön." },
    { q: "Kuinka kauan tarrat kestävät?", a: "Ulkokäytössä laadukkaiden tarramme elinikä on 2–5 vuotta olosuhteista riippuen. Sisäkäytössä huomattavasti pidempään." },
    { q: "Kuinka nopeasti tarrat toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko tarrat palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'pipot': [
    { q: "Minkälaisesta materiaalista pipot ovat?", a: "Pipomme ovat pehmeää akryyli-materiaalia, joka on lämmin, joustava ja helppohoitoinen. Brodeeraus kestää pesua." },
    { q: "Sopiiko pipo lahjaksi?", a: "Ehdottomasti! Hauska pipo on loistava joululahja, syntymäpäivälahja tai pikkujoululahja työkavereille." },
    { q: "Kuinka nopeasti pipo toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko pipon palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'lippikset': [
    { q: "Minkälaisesta materiaalista lippikset ovat?", a: "Lippiksemme ovat laadukkaasta puuvilla- tai polyesteri-materiaalista. Brodeeraus on kestävä ja pysyy siistinä." },
    { q: "Sopiiko lippis lahjaksi?", a: "Kyllä, hauska lippis on erinomainen lahja erityisesti kesällä. Sopii syntymäpäiviin, polttareihin ja muihin juhliin." },
    { q: "Kuinka nopeasti lippis toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko lippiksen palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'haalarimerkit': [
    { q: "Sopivatko haalarimerkit kaikille haalareille?", a: "Kyllä, haalarimerkkimme sopivat kaikkiin haalareihin, laukkuihin ja reppuihin. Kiinnitys tapahtuu turvallisesti neulalla." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä?", a: "Kyllä, tarjoamme myös räätälöityjä haalarimerkkejä. Ota yhteyttä asiakaspalveluumme tilausta varten." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Sopivatko haalarimerkit lahjaksi?", a: "Ehdottomasti! Haalarimerkit ovat loistava lahja opiskelijalle kiltajuhliin tai tupaantuliaisiin." },
  ],
};

// Gift page path → FAQ entries
const GIFT_FAQS: Record<string, Array<{q: string; a: string}>> = {
  '/hauskat-lahjat-miehelle': [
    { q: "Mikä on paras hauska lahja miehelle?", a: "Suosituimpia hauskoja lahjoja miehelle ovat huumoripaita, -huppari tai -muki joka liittyy hänen harrastukseensa tai ammattiinsa. Suosituimpia ovat kalamies-, ammattimies- ja Mersumies-teemat." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle miehelle?", a: "'100 % eläkeläinen' ja 'Museo-kappale' -teemat ovat erityisen suosittuja 50-vuotiaiden lahjoina. Myös ammattihuumoriaiheet toimivat hyvin." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "L on miesten yleisin koko. Kokoopas löytyy jokaisen tuotteen sivulta. Epävarma? Valitse XL — löysä istuvuus on turvallisempi kuin liian pieni." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Tällä hetkellä emme tarjoa lahjapakettia, mutta tilausvahvistus toimii mukavana lahjasaatteena digitaalisesti." },
  ],
  '/hauskat-lahjat-naiselle': [
    { q: "Mikä on paras hauska lahja naiselle?", a: "Suosituimpia lahjoja naiselle ovat 'Maailman paras äiti' -hupparit, hauskat kahvimukit ja söpöt huumoriaiheeiset tuotteet. Myös kangaskassit ovat suosittuja." },
    { q: "Sopiiko huumoripaita lahjaksi naiselle?", a: "Kyllä, erityisesti äitiaiheeiset ja arjen huumori- ja viiniaiheeiset tuotteet ovat naisten suosiossa." },
    { q: "Miten valitsen oikean koon lahjaksi naiselle?", a: "M tai L on yleisimmät naisten koot. Ylisuuri (oversized) tyyli on tällä hetkellä trendikäs." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Emme tällä hetkellä tarjoa lahjapakettia, mutta tilausvahvistus soveltuu digitaaliseksi lahjasaatteeksi." },
  ],
  '/lahja-miehelle': [
    { q: "Mikä on hyvä lahja miehelle joka tykkää huumorista?", a: "Paras hauska lahja miehelle on tuote joka liittyy hänen harrastukseensa tai ammattiinsa — kalamies, sähkömies, eläkeläinen, Mersumies. Valikoimastamme löydät yli 75 hauskaa ideaa." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle?", a: "Ehdottomasti. Suosituimpia ovat '100 % Eläkeläinen', 'Museo-kappale' ja ammattihuumori. Hauska paita on aina yllättävä ja muistettava lahja." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "L on miesten yleisin koko. Epävarma? Valitse yksi koko ylöspäin — löysä istuvuus on turvallisempi." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Lahjapakettia ei tarjota tällä hetkellä, mutta tilausvahvistus sopii lahjasaatteeksi." },
  ],
  '/isanpaiva-lahjat': [
    { q: "Mikä on hauska isänpäivälahja?", a: "Hauska isänpäivälahja on t-paita, huppari tai muki joka liittyy isän harrastukseen tai ammattiin. Suosituimpia ovat kalamies-, Mersumies- ja 'Maailman paras isä' -teemat." },
    { q: "Milloin viimeistään pitää tilata isänpäivälahja?", a: "Tilaa viimeistään 2 viikkoa ennen isänpäivää (marraskuun toinen sunnuntai). Toimitusaika on 3–7 arkipäivää." },
    { q: "Miten valitsen oikean koon isänpäivälahjaan?", a: "L on miesten yleisin koko. Jos isä on isokokoinen, valitse XL tai XXL. Kokoopas on jokaisen tuotteen sivulla." },
    { q: "Voiko isänpäivälahjan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  '/joululahjat': [
    { q: "Mikä on hauska joululahja huumorin ystävälle?", a: "Hauska joululahja on t-paita, huppari tai muki suomalaisesta ammattihuumorista. Suosituimpia ovat kalamies-, äijä- ja eläkeläisteemat." },
    { q: "Milloin viimeistään tilata joululahja?", a: "Tilaa viimeistään 14.12. saadaksesi tuotteen ennen joulua. Toimitusaika on 3–7 arkipäivää." },
    { q: "Miten valitsen oikean koon joululahjaksi?", a: "L on yleisimmin sopiva koko miehille. Epävarma? Valitse yksi koko ylöspäin." },
    { q: "Voiko joululahjan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus." },
  ],
  '/syntymapaivalahjat': [
    { q: "Mikä on hauska syntymäpäivälahja huumorin ystävälle?", a: "Huumoripaita, -huppari tai -muki on täydellinen syntymäpäivälahja. Suosituimpia ovat '100 % Eläkeläinen' ja ammattihuumori ikääntyvälle juhlijalle." },
    { q: "Sopiiko huumoripaita syntymäpäivälahjaan?", a: "Ehdottomasti! Hauska paita on yllättävä, persoonallinen ja tulee oikeasti käyttöön." },
    { q: "Miten valitsen oikean koon syntymäpäivälahjaan?", a: "L on yleisin koko miehille, M naisille. Epävarma? Yksi koko ylöspäin on turvallisempi." },
    { q: "Kuinka nopeasti syntymäpäivälahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin jos synttäripäivä lähestyy." },
  ],
  '/polttari-lahjat': [
    { q: "Mitkä ovat suosituimmat polttaripaidat?", a: "Suosituimpia ovat 'Game Over', 'Viimeinen vapaa ilta' ja personoidut polttaripaidat koko porukalle." },
    { q: "Sopiiko huumoripaita polttarilahjana?", a: "Ehdottomasti — polttaripaita on perinteinen ja hauska tapa juhlistaa tapahtumaa. Yhtenäiset paidat ryhmälle tekevät illan unohtumattomaksi." },
    { q: "Miten valitsen oikean koon polttaripaidoille?", a: "Kerää ryhmältä koot etukäteen. Epävarma? Unisex-koot hieman suuremmiksi." },
    { q: "Voiko polttaripaitoja tilata isomman erän?", a: "Kyllä! Ryhmätilaukset onnistuvat helposti — lisää eri koot koriin tai ota yhteyttä asiakaspalveluumme." },
  ],
  '/elakelahjat': [
    { q: "Mikä on paras hauska eläkelahja?", a: "'Olen eläkkeellä' ja '100 % eläkeläinen' -teemat ovat suosituimpia eläkelahja-ideoita. T-paidat, hupparit ja mukit sopivat hyvin." },
    { q: "Sopiiko huumoripaita eläkkeelle jäävälle työkavereille?", a: "Kyllä — hauska eläkelahja on työtovereiden perinteinen tapa toivottaa työkaveri hyvää eläkettä." },
    { q: "Miten valitsen oikean koon eläkelahjaan?", a: "L on miesten ja M naisten yleisin koko. Epävarma? Valitse yksi ylöspäin." },
    { q: "Kuinka nopeasti eläkelahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa ajoissa ennen eläkejuhlia." },
  ],
  '/lahja-kaverille': [
    { q: "Mikä on hauska lahja kaverille?", a: "Hauska lahja kaverille on huumoripaita, -huppari tai -muki kaverin harrastuksesta tai persoonallisuudesta. Alle 30 € saat loistavan lahjan." },
    { q: "Sopiiko huumoripaita kaverin synttärilahjaksi?", a: "Ehdottomasti! Hauska paita on yllättävä, persoonallinen ja tulee oikeasti käyttöön." },
    { q: "Miten valitsen oikean koon kaverille?", a: "Tiedät kaverin koon parhaiten. Epävarma? Valitse yksi koko ylöspäin." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin ennen synttäreitä." },
  ],
  '/lahja-tyokaverille': [
    { q: "Mikä on hauska lahja työkavereille?", a: "'No niin' -muki ja '100 % eläkeläinen' -paita ovat suosituimpia työkaverilahjoja. Ne sopivat työkaverin lähtöön tai syntymäpäivään." },
    { q: "Sopiiko huumoripaita työkaverin läksiäislahjaksi?", a: "Kyllä — hauska paita tai muki on oivallinen muisto yhteisistä vuosista." },
    { q: "Miten valitsen oikean koon työkaverin lahjaksi?", a: "Jos et tiedä kokoa, L tai M on turvallinen valinta. Muki tai tarra ovat hyviä koottomia vaihtoehtoja." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin ennen läksiäisiä." },
  ],
  '/hauskat-t-paidat': [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "T-paitamme ovat 100 % puuvillaa, painettu Suomessa DTG-tekniikalla." },
    { q: "Sopiiko hauska t-paita lahjaksi?", a: "Ehdottomasti! Hauska t-paita on persoonallinen ja tulee oikeasti käyttöön. Täydellinen syntymäpäivä-, joulu- tai läksiäislahja." },
    { q: "Miten valitsen oikean koon?", a: "L on miesten yleisin koko. Kokoopas löytyy jokaiselta tuotesivulta. Epävarma? Valitse XL." },
    { q: "Voiko t-paidan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  '/hauskat-hupparit': [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Hupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta. Lämmin, mukava ja kestävä. Koot S–3XL." },
    { q: "Sopiiko hauska huppari lahjaksi?", a: "Ehdottomasti! Huppari on käytännöllinen ja hauska lahja — sitä käytetään vuosia." },
    { q: "Miten valitsen oikean koon?", a: "L on yleisin koko. Kokoopas jokaisella tuotesivulla. Epävarma? Valitse XL." },
    { q: "Voiko hupparin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  '/haalarimerkit': [
    { q: "Sopivatko haalarimerkit kaikille haalareille?", a: "Kyllä, merkkimme sopivat kaikkiin haalareihin, reppuihin ja laukkuihin. Kiinnitys neulalla." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä?", a: "Kyllä! Räätälöityjä merkkejä tilauksesta. Ota yhteyttä asiakaspalveluumme." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Sopivatko haalarimerkit lahjaksi opiskelijalle?", a: "Ehdottomasti! Haalarimerkit ovat loistava lahja opiskelijalle kiltajuhliin tai tupaantuliaisiin." },
  ],
  '/opiskelijan-haalarimerkit': [
    { q: "Mitä haalarimerkit ovat?", a: "Haalarimerkit ovat pieniä brodeerattuja tai painettuja merkkejä jotka kiinnitetään haalariin tai reppuun. Ne ovat perinteinen tapa personoida opiskelijan haalarit." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä tai logolla?", a: "Kyllä! Tarjoamme räätälöityjä haalarimerkkejä kiltajärjestöille ja yksityishenkilöille. Kysy tarjous asiakaspalvelusta." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Suuret ryhmätilaukset voivat kestää pidempään." },
    { q: "Sopivatko haalarimerkit lahjaksi?", a: "Ehdottomasti! Haalarimerkit ovat oivallinen lahja opiskelijalle tai kiltatapahtumaan." },
  ],
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectJsonLd(html: string, ...schemas: object[]): string {
  const tags = schemas
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join('\n  ');
  return html.replace('</head>', `  ${tags}\n</head>`);
}

// ── Main middleware ───────────────────────────────────────────────────────────

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
  let productData: (SupabaseProduct & { categoryName: string }) | undefined;
  let pageSchemas: object[] = [];

  // Exact match (static pages, category pages, gift pages)
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
  // Product pages: /tuote/:slug — data fetched live from Supabase
  else if (path.startsWith('/tuote/')) {
    const slug = path.slice('/tuote/'.length).replace(/\/$/, '');
    const product = await fetchProductBySlug(slug);
    if (product) {
      const catName = CATEGORY_NAMES[product.category] || product.category;
      meta = {
        title: `${product.name} – ${catName} | Huumorikauppa.fi`,
        description: `${product.name} – hauska ${catName.toLowerCase()} lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta ${product.price.toFixed(2).replace('.', ',')} €. Tilaa nyt Huumorikauppa.fi:stä.`,
      };
      productData = { ...product, categoryName: catName };
    } else {
      // Fallback for unknown slugs (Supabase unavailable or product not found)
      const nameFromSlug = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      meta = {
        title: `${nameFromSlug} | Huumorikauppa.fi`,
        description: `${nameFromSlug} – hauska tuote lahjaksi tai itselle. Tilaa Huumorikauppa.fi:stä, nopea toimitus koko Suomeen.`,
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

  // Build additional structured data for category and gift pages
  if (meta && path.startsWith('/kategoria/')) {
    const catSlug = path.slice('/kategoria/'.length).replace(/\/$/, '');
    const catName = CATEGORY_NAMES[catSlug] || catSlug;
    const catProds = await fetchCategoryProducts([catSlug]);
    const catFaqs = CATEGORY_FAQS[catSlug] || [];
    const itemList = {
      "@context": "https://schema.org/",
      "@type": "ItemList",
      "name": `Hauskat ${catName}`,
      "numberOfItems": catProds.length,
      "itemListElement": catProds.map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
        "name": p.name,
        "image": p.image,
      })),
    };
    const breadcrumb = {
      "@context": "https://schema.org/",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Etusivu", "item": "https://huumorikauppa.fi/" },
        { "@type": "ListItem", "position": 2, "name": catName, "item": `https://huumorikauppa.fi/kategoria/${catSlug}` },
      ],
    };
    const speakable = {
      "@context": "https://schema.org/",
      "@type": "WebPage",
      "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".tldr-box", ".direct-answer", "h1"] },
    };
    pageSchemas = [itemList, breadcrumb, speakable];
    if (catFaqs.length > 0) {
      pageSchemas.push({
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": catFaqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      });
    }
  } else if (meta && GIFT_CATEGORY_CATS[path]) {
    const cats = GIFT_CATEGORY_CATS[path];
    const giftProds = await fetchCategoryProducts(cats);
    const giftFaqs = GIFT_FAQS[path] || [];
    const giftName = (meta.title || '').replace(/ \|.*$/, '').trim();
    if (giftProds.length > 0) {
      pageSchemas.push({
        "@context": "https://schema.org/",
        "@type": "ItemList",
        "name": giftName,
        "numberOfItems": giftProds.length,
        "itemListElement": giftProds.map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
          "name": p.name,
          "image": p.image,
        })),
      });
    }
    if (giftFaqs.length > 0) {
      pageSchemas.push({
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": giftFaqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      });
    }
    pageSchemas.push({
      "@context": "https://schema.org/",
      "@type": "WebPage",
      "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".tldr-box", ".direct-answer", "h1"] },
    });
  } else if (path === '/') {
    pageSchemas = [{
      "@context": "https://schema.org/",
      "@type": "WebPage",
      "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".tldr-box", ".direct-answer", "h1"] },
    }];
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

    if (meta.noindex) {
      html = html.replace(
        /<meta name="robots"[^>]*>/,
        `<meta name="robots" content="noindex, nofollow">`
      );
      html = html.replace(
        /<meta name="googlebot"[^>]*>/,
        `<meta name="googlebot" content="noindex, nofollow">`
      );
    }

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

    // Inject product JSON-LD for /tuote/ pages
    if (productData) {
      const pd = productData;
      const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const availability = pd.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";
      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": pd.name,
        "description": pd.description,
        "image": pd.images,
        "sku": pd.slug,
        "mpn": pd.slug,
        "brand": { "@type": "Brand", "name": "Huumorikauppa" },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "4",
          "bestRating": "5",
          "worstRating": "1"
        },
        "offers": {
          "@type": "Offer",
          "url": `https://huumorikauppa.fi/tuote/${pd.slug}`,
          "priceCurrency": "EUR",
          "price": pd.price.toFixed(2),
          "availability": availability,
          "itemCondition": "https://schema.org/NewCondition",
          "priceValidUntil": priceValidUntil,
          "seller": { "@type": "Organization", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" },
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": { "@type": "MonetaryAmount", "value": "0", "currency": "EUR" },
            "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "FI" },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
              "transitTime": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 4, "unitCode": "DAY" }
            }
          },
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "applicableCountry": "FI",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "merchantReturnDays": 14,
            "returnMethod": "https://schema.org/ReturnByMail",
            "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility"
          }
        }
      };
      const breadcrumbSchema = {
        "@context": "https://schema.org/",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Etusivu", "item": "https://huumorikauppa.fi/" },
          { "@type": "ListItem", "position": 2, "name": pd.categoryName, "item": `https://huumorikauppa.fi/kategoria/${pd.category}` },
          { "@type": "ListItem", "position": 3, "name": pd.name, "item": `https://huumorikauppa.fi/tuote/${pd.slug}` }
        ]
      };
      html = injectJsonLd(html, productSchema, breadcrumbSchema);

      // Update og:image, og:image:alt, og:type for product pages
      const firstImage = pd.images[0] || '';
      html = html.replace(
        /<meta property="og:image"[^>]*>/,
        `<meta property="og:image" content="${escapeHtml(firstImage)}">`
      );
      html = html.replace(
        /<meta property="og:image:alt"[^>]*>/,
        `<meta property="og:image:alt" content="${escapeHtml(pd.name)}">`
      );
      html = html.replace(
        /<meta property="og:type"[^>]*>/,
        `<meta property="og:type" content="product">`
      );
      html = html.replace(/<meta property="og:image:width"[^>]*>/, '<meta property="og:image:width" content="800">');
      html = html.replace(/<meta property="og:image:height"[^>]*>/, '<meta property="og:image:height" content="800">');
      html = html.replace(
        /<meta name="twitter:image"[^>]*>/,
        `<meta name="twitter:image" content="${escapeHtml(firstImage)}">`
      );
    }

    // Inject page-level schemas (ItemList, FAQPage, Speakable) for category/gift pages
    if (pageSchemas.length > 0) {
      html = injectJsonLd(html, ...pageSchemas);
    }

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
