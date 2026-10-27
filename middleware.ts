/**
 * Vercel Edge Middleware - Bot SEO injector
 *
 * Detects search engine and AI crawler requests and injects per-page
 * title, description, canonical and OG tags into the HTML response.
 * Product data is fetched live from Supabase REST API so the middleware
 * stays correct as the catalog grows without any code changes.
 * Falls through transparently for human visitors.
 *
 * Build-vaiheen esirenderöinti (scripts/prerender.mjs) kirjoittaa useimmille reiteille
 * valmiin dist/<reitti>/index.html:n, jossa on jo oikeat metat, JSON-LD ja sisältö kaikille
 * user agenteille. Middleware tarkistaa ensin, onko reitti esirenderöity (sivulla on oma
 * canonical), ja päästää pyynnön silloin suoraan staattiseen tiedostoon. Injektointia
 * tarvitaan vain reiteille, joita buildissa ei ollut (esim. myöhemmin lisätyt tuotteet).
 */
import { buildBreadcrumbJsonLd, buildProductJsonLd, serializeJsonLd } from './src/seo/structuredData.js';
import { onPiilotettuTuote } from './src/lib/hiddenCategories.js';
import { kaksoiskappaleenPerusslug } from './api/_lib/kaksoiskappaleet.js';
import { proxiedImage } from './src/lib/imageProxy.js';
import { isPrerenderedHtml } from './src/seo/prerenderDetect.js';
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from './src/config/toimitus.js';

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
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  stock: number;
  variants?: unknown;
}

const SUPABASE_URL: string = (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) || '';
const SUPABASE_KEY: string = (typeof process !== 'undefined' && (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY)) || '';

async function fetchProductBySlug(slug: string): Promise<SupabaseProduct | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=id,slug,name,description,images,price,category,stock,variants&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return null;
    const data: SupabaseProduct[] = await res.json();
    const product = data[0] ?? null;
    // Myynnistä piilotetut kategoriat (mukit) eivät saa tuotemetoja.
    if (product && onPiilotettuTuote(product)) return null;
    return product;
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
    description: `Hauskat lahjat: t-paitoja, huppareita ja tarroja hauskalla tekstillä. Yli 700 tuotetta, toimitus ${TOIMITUSMAKSU_TEKSTI} €, ilmainen ${ILMAINEN_RAJA_TEKSTI} eurosta.`,
  },
  '/kaikki-tuotteet': {
    title: 'Kaikki hauskat tuotteet | Huumorikauppa.fi',
    description: 'Selaa kaikki hauskat tuotteet: t-paidat, hupparit, tarrat, bodyt ja paljon muuta. Löydä hauska lahja.',
  },
  '/blogi': {
    title: 'Blogi - Lahjaideat ja vinkit | Huumorikauppa.fi',
    description: 'Lahjaideoita, hauskan ostajan oppaita ja inspiraatiota jokaiseen tilaisuuteen. Löydä hauska lahja blogin avulla.',
  },
  '/yhteystiedot': {
    title: 'Yhteystiedot | Huumorikauppa.fi',
    description: 'Ota yhteyttä Huumorikauppaan. Vastaamme nopeasti asiakaspalvelukysymyksiin.',
  },
  '/tietoa-meista': {
    title: 'Tietoa meistä | Huumorikauppa.fi',
    description: 'Huumorikauppa on suomalainen verkkokauppa hauskoille lahjoille ja huumorituotteille. Hauskat t-paidat, hupparit ja tarrat.',
  },
  '/usein-kysytyt-kysymykset': {
    title: 'Usein kysytyt kysymykset | Huumorikauppa.fi',
    description: 'Vastaukset yleisimpiin kysymyksiin toimituksesta, palautusoikeudesta, koosta ja tilaamisesta.',
  },
  '/toimitusehdot': {
    title: 'Toimitusehdot | Huumorikauppa.fi',
    description: `Huumorikaupan toimitusehdot. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä, ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.`,
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
    title: 'Äitienpäivälahjat - Hauskat ideat äidille | Huumorikauppa.fi',
    description: 'Hauskat äitienpäivälahjat äidille, mummille tai tädille. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/t-paidat': {
    title: 'Hauskat T-paidat - Huumoripaitat | Huumorikauppa.fi',
    description: 'Hauskat t-paidat suomalaisella huumorilla. Laaja valikoima huumoriteemoja: ammattihuumori, eläkeläinen, kalamies ja paljon muuta. Tilaa nyt!',
  },
  '/kategoria/hupparit': {
    title: 'Hauskat Hupparit - Huumorihupparit | Huumorikauppa.fi',
    description: 'Hauskat hupparit kaikille! Laaja valikoima huumoriteemoja: ammattihuumori, eläkeläinen, kalamies ja paljon muuta. Nopea toimitus.',
  },
  '/kategoria/mukit': {
    title: 'Hauskat Mukit - Huumorimukit | Huumorikauppa.fi',
    description: 'Mukit eivät enää kuulu valikoimaan. Katso hauskat t-paidat ja hupparit.',
  },
  '/kategoria/tarrat': {
    title: 'Hauskat Tarrat - Huumoritarrat | Huumorikauppa.fi',
    description: 'Hauskat tarrat läppäriin, autoon, vesipulloon ja muualle. Laadukas vinyyli, kestää ulkona.',
  },
  '/kategoria/bodyt': {
    title: 'Hauskat Vauva-Bodyt - Hauskoja Vauvalahjoja | Huumorikauppa.fi',
    description: 'Hauskat vauva-bodyt vauvalahjaksi. Tuotteet painetaan tilauksesta.',
  },
  '/kategoria/pipot': {
    title: 'Hauskat Pipot - Huumorihatuilla | Huumorikauppa.fi',
    description: 'Hauskat pipot suomalaisella huumorilla. Lämpimät ja persoonalliset talvipipot, loistava lahja!',
  },
  '/kategoria/lippikset': {
    title: 'Hauskat Lippikset - Huumorilakit | Huumorikauppa.fi',
    description: 'Hauskat lippikset kesäksi tai lahjaksi. Brodeeratut logot ja hauskuudet.',
  },
  '/kategoria/peitot': {
    title: 'Hauskat Peitot - Huumoripeitot | Huumorikauppa.fi',
    description: 'Hauskat fleecepeitot lahjaksi tai itselle. Lämpimät ja hauskuuttavat kuviot. Loistava lahja!',
  },
  '/kategoria/laukut': {
    title: 'Hauskat Laukut ja Kangaskassit | Huumorikauppa.fi',
    description: 'Hauskat kangaskassit ja laukut suomalaisella huumorilla. Ekologinen ja hauska lahja!',
  },
  '/kategoria/seinataulut': {
    title: 'Hauskat Seinätaulut - Sisustus Huumorilla | Huumorikauppa.fi',
    description: 'Hauskat seinätaulut kodin sisustukseen. Piristä seinät suomalaisella huumorilla!',
  },
  '/kategoria/koristeet': {
    title: 'Hauskat Koristeet - Sisustuskoristeet | Huumorikauppa.fi',
    description: 'Hauskat koristeet kotiin ja toimistoon. Uniikit koristeet suomalaisella huumorilla.',
  },
  '/kategoria/pitkahihaiset': {
    title: 'Hauskat Pitkähihaiset Paidat | Huumorikauppa.fi',
    description: 'Hauskat pitkähihaiset paidat suomalaisella huumorilla. Laadukkaat ja mukavat.',
  },
  '/kategoria/haalarimerkit': {
    title: 'Haalarimerkit - Hauskat merkit haalareihin | Huumorikauppa.fi',
    description: 'Haalarimerkit opiskelijoille ja kaikille haalarien ystäville. Brodeeratut ja painetut merkit. Nopea toimitus.',
  },
  '/hauskat-lahjat-miehelle': {
    title: 'Hauskat Lahjat Miehelle - Hauskat ideat | Huumorikauppa.fi',
    description: 'Hauskat lahjat miehelle: isälle, ukille, kaverille tai puolisolle. Huumoripaidat ja -hupparit ammattihuumorilla. Nopea toimitus.',
  },
  '/hauskat-lahjat-naiselle': {
    title: 'Hauskat Lahjat Naiselle - Hauskat ideat | Huumorikauppa.fi',
    description: 'Hauskat lahjat naiselle: äidille, mummille tai tyttökaverille. Huumoripaidat ja -hupparit. Nopea toimitus.',
  },
  '/polttari-lahjat': {
    title: 'Polttarilahjat - Hauskat Ideat Polttareihin | Huumorikauppa.fi',
    description: 'Hauskat polttarilahjat morsiamelle ja sulhaselle. Yhteiset polttaripaidat koko porukalle. Tilaa nyt!',
  },
  '/aitienpaiva-lahjat': {
    title: 'Äitienpäivälahjat - Hauskat Ideat Äidille | Huumorikauppa.fi',
    description: 'Hauskat äitienpäivälahjat äidille ja mummille. Persoonalliset lahjat jotka muistetaan. Nopea toimitus.',
  },
  '/joululahjat': {
    title: 'Joululahjat 2026 - Hauskat Ideat Koko Perheelle | Huumorikauppa.fi',
    description: 'Hauskat joululahjat 2026 koko perheelle. Tilaa viimeistään 20.11.2026, niin lahja ehtii perille jouluaattoon mennessä.',
  },
  '/elakelahjat': {
    title: 'Eläkeläislahjat - Hauskat muistot eläkkeelle siirtyvälle | Huumorikauppa.fi',
    description: 'Eläkeläislahja joka muistetaan: hauskat ideat eläkkeelle jäävälle. Tilaa verkosta helposti.',
  },
  '/lahja-kaverille': {
    title: 'Hauska lahja kaverille - Hauskat ideat | Huumorikauppa.fi',
    description: 'Hauska lahja kaverille - 15+ ideaa jotka varmasti toimii. Nopea toimitus koko Suomeen.',
  },
  '/lahja-tyokaverille': {
    title: 'Lahjat työkavereille - Hauskat toimistolahjat | Huumorikauppa.fi',
    description: 'Hauska toimistolahja työkavereille - Ideat, jotka saavat kaikki nauramaan. Tilaa nyt!',
  },
  '/hauskat-t-paidat': {
    title: 'Hauskat T-paidat - Huumoripaidat | Huumorikauppa.fi',
    description: 'Hauskat t-paidat lahjaksi tai itselle. Huumoripaitoja kalamiehille, isille, äijille ja kaikille hauskan ystäville. Tilaa nyt.',
  },
  '/hauskat-hupparit': {
    title: 'Hauskat Hupparit - Huumorihupparit | Huumorikauppa.fi',
    description: 'Hauskat hupparit lahjaksi tai itselle. Lämpimiä huumorihuppareita ammattihuumorilla. painetaan tilauksesta, nopea toimitus.',
  },
  '/lahja-miehelle': {
    title: 'Lahja Miehelle - Hauskat lahjaideat | Huumorikauppa.fi',
    description: 'Hauska lahja miehelle - isälle, ukille, kaverille tai puolisolle. Huumoripaidat ja -hupparit ammattihuumorilla. Tilaa Huumorikauppa.fi:stä.',
  },
  '/syntymapaivalahjat': {
    title: 'Syntymäpäivälahjat - Hauskat synttärilahjat | Huumorikauppa.fi',
    description: 'Hauskat syntymäpäivälahjat kaikkiin ikiin. Huumorituotteita pyöreille vuosille ja arkisille synttäreille. Tilaa Huumorikauppa.fi:stä.',
  },
  '/suomalaiset-tyopaikkameemit-top-50': {
    title: 'Suomalaiset Työpaikkameemit Top 50 - 2026 | Huumorikauppa.fi',
    description: 'Suomalaiset työpaikkameemit koottuna: 50 toimistomeemin kokoelma. Tunnista oma työpaikkasi!',
  },
  '/hauskimmat-tyopaikkalaput-2026': {
    title: 'Hauskimmat Työpaikkalaput 2026 - Toimistovitsit | Huumorikauppa.fi',
    description: 'Työpaikkalaput 2026: toimistovitsit ja lappushuumori. Tunnista oma toimistosi!',
  },
  '/haalarimerkit': {
    title: 'Haalarimerkit Opiskelijalle - Hauskat merkit haalareihin | Huumorikauppa.fi',
    description: 'Haalarimerkit opiskelijoille - räätälöitäviä ja valmiita malleja. Toimitamme nopeasti Suomeen. Tilaa Huumorikauppa.fi:stä.',
  },
  '/opiskelijan-haalarimerkit': {
    title: 'Opiskelijan haalarimerkit - Hauskat merkit | Huumorikauppa.fi',
    description: 'Opiskelijan haalarimerkit kaikille kiltojen ja ainejärjestöjen jäsenille. Räätälöitävät merkit ja valmiit mallit.',
  },
  '/admin': {
    title: 'Admin - Huumorikauppa',
    description: 'Huumorikaupan admin-paneeli.',
    noindex: true,
  },
  '/admin/login': {
    title: 'Admin-kirjautuminen - Huumorikauppa',
    description: 'Huumorikaupan admin-paneeli.',
    noindex: true,
  },
};

// Blog post metadata (slug without /blogi/ prefix)
const BLOG_META: Record<string, PageMeta> = {
  'hauskat-joululahjaideat-miehelle-2026': {
    title: "50 hauskaa joululahjaideaa miehelle 2026 | Huumorikauppa",
    description: "Hauska joululahja miehelle: 50 ideaa harrastuksen, työn, iän ja huumorintajun mukaan. Lisäksi vinkit koon valintaan ja tilaamiseen ajoissa.",
  },
  'pikkujoululahja-alle-20-euroa': {
    title: "Pikkujoululahja alle 20 €: näin valitset | Huumorikauppa",
    description: "Pikkujoululahja alle 20 euroa: valintakriteerit, ideat eri porukoille, toimituskulujen huomioiminen ja yhteistilauksen vinkit.",
  },
  'lahja-miehelle-jolla-on-kaikki': {
    title: "Lahja miehelle jolla on kaikki: jouluideat | Huumorikauppa",
    description: "Lahja miehelle jolla on jo kaikkea: viisi tapaa löytää idea, kysymyslista ideointiin ja personoidut lahjat, joita hän ei osta itse.",
  },
  'elakelahja-joka-naurattaa': {
    title: "Eläkelahja joka naurattaa: ideat ja vinkit | Huumorikauppa",
    description: "Hauska eläkelahja: millainen huumori toimii, mitä välttää, ideat työkavereiden yhteislahjaksi ja vinkit lahjan antamiseen eläkejuhlissa.",
  },
  'mita-ostaa-tyokaverille-jouluksi': {
    title: "Mitä ostaa työkaverille jouluksi? Ideat | Huumorikauppa",
    description: "Joululahja työkaverille: kenelle ostaa, paljonko käyttää, mikä huumori sopii työpaikalle ja ideat eri työkavereille.",
  },
  'joululahja-isalle-hauskat-ideat': {
    title: "Hauska joululahja isälle: ideat 2026 | Huumorikauppa",
    description: "Hauska joululahja isälle: ideat isätyypin mukaan, lasten piirustus paitaan, isänpäivän ja joulun lahjojen yhteensovitus ja tilausaikataulu.",
  },
  'salaisen-joulupukin-lahja-10-20-30-euroa': {
    title: "Salaisen joulupukin lahja 10, 20 ja 30 € | Huumorikauppa",
    description: "Salaisen joulupukin lahja 10, 20 tai 30 eurolla: ideat jokaiselle budjetille, arvonnan pelisäännöt ja vinkit toimituskulujen huomioimiseen.",
  },
  'hauska-lahja-teinille-jouluksi': {
    title: "Hauska joululahja teinille: ideat ja vinkit | Huumorikauppa",
    description: "Hauska joululahja teinille: mikä huumori toimii 13-19-vuotiaalle, mitä välttää, ideat harrastusten mukaan ja vinkit oman tekstin lahjaan.",
  },
  'lahja-kalastajalle-metsastajalle-mokkeilijalle': {
    title: "Lahja kalastajalle, metsästäjälle, mökille | Huumorikauppa",
    description: "Hauska joululahja kalastajalle, metsästäjälle tai mökkeilijälle: miksi välinelahja on riski, ideat lajin mukaan ja porukan yhteinen paita.",
  },
  'joululahjan-viimeiset-tilauspaivat-2026': {
    title: "Joululahjan viimeinen tilauspäivä 2026 | Huumorikauppa",
    description: "Joululahjat 2026: tilaa viimeistään perjantaina 20.11.2026, niin lupaamme toimituksen jouluaattoon. Näin suunnittelet tilauksen ja palautukset.",
  },
  '20-hauskinta-t-paitaa-2026': {
    title: '20 hauskaa t-paitaa 2026 | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa t-paitaa? Listasimme 20 parasta huumori-t-paitaa 2026! Kaikille sopivat koot. Tilaa nyt, nopea toimitus.',
  },
  'hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat': {
    title: 'Hauskat Syntymäpäivälahjat - Ideat Miehelle ja Naiselle | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa syntymäpäivälahjaa? Hauskat ideat miehelle ja naiselle! Nopea toimitus koko Suomeen.',
  },
  'hauskat-mukit-toimistoon-ja-lahjaksi': {
    title: 'Hauskat mukit toimistoon ja lahjaksi | Huumorikauppa.fi',
    description: 'Opas hauskoihin mukeihin töihin ja kotiin. Mukit eivät enää kuulu valikoimaan.',
  },
  'parhaat-polttaripaidat-ja-polttarilahjat-2026': {
    title: 'Polttarilahjat 2026 - Hauskat ideat | Huumorikauppa.fi',
    description: 'Polttarilahjat morsiamelle ja sulhaselle 2026: hauskat paidat ja ryhmäpaidat.',
  },
  'parhaat-joululahjat-ja-pikkujoululahjat-2026': {
    title: 'Joululahjat 2026 - Hauskat ideat koko perheelle | Huumorikauppa.fi',
    description: 'Hauskat joululahjaideat 2026 koko perheelle. Tilaa viimeistään 20.11.2026, niin lahja ehtii jouluaattoon mennessä.',
  },
  'parhaat-hauskat-lahjat-miehelle': {
    title: 'Hauskat lahjat miehelle - 25 ideaa | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa miehelle? 25+ parasta ideaa kaiken ikäisille miehille! Nopea toimitus.',
  },
  'hauskat-lahjat-naiselle-opas': {
    title: 'Hauskat Lahjat Naiselle - Ideat Joita Hän Ei Odota | Huumorikauppa.fi',
    description: 'Hauskat lahjat naiselle! Persoonalliset ja hauskat ideat kaikille naisille. Nopea toimitus koko Suomeen.',
  },
  'mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea': {
    title: 'Mitä Antaa 50-Vuotiaalle Jolla On Jo Kaikkea? | Huumorikauppa.fi',
    description: '50-vuotiaan lahja on aina hankala! Meillä on ratkaisut - hauskat ja persoonalliset lahjat 50v täyttävälle.',
  },
  'hauskat-isanpaivalahjat-opas': {
    title: 'Hauskat Isänpäivälahjat - Opas Parhaaseen Lahjaan | Huumorikauppa.fi',
    description: 'Mitä antaa isälle isänpäiväksi? Hauskat ideat kaikenlaisille isille. Nopea toimitus.',
  },
  'hauska-aitienpaivalahja-opas': {
    title: 'Hauska Äitienpäivälahjat - Opas Lahjaan Joka Yllättää | Huumorikauppa.fi',
    description: 'Hauskat äitienpäivälahjat! Ideat jotka äiti muistaa. Nopea toimitus koko Suomeen.',
  },
  'hauskat-elakelahjat-opas': {
    title: 'Hauskat Eläkeläislahjat - Hauskat ideat Eläkkeelle Siirtyvälle | Huumorikauppa.fi',
    description: 'Eläkeläislahja joka muistetaan: hauskat ideat eläkkeelle jäävälle. Tilaa verkosta helposti.',
  },
  'parhaat-hauskat-tarrat-lappariin': {
    title: 'Hauskat Tarrat Läppäriin ja Muualle | Huumorikauppa.fi',
    description: 'Hauskat tarrat läppäriin, puhelimeen, auton takalasiin tai seinälle! Laadukkaat suomalaiset huumoritarrat.',
  },
  'hauska-vauvalahja-parhaat-bodyt': {
    title: 'Hauska Vauvalahja - Hauskat Bodyt ja Muut Ideat | Huumorikauppa.fi',
    description: 'Hauskat vauvalahjavinkit! Hauska body on hauska lahja uudelle perheelle. Tilaa nyt.',
  },
  'parhaat-meemituotteet-2025': {
    title: 'Hauskat Meemituotteet 2025 - Hauskat Meemin Inspiroimat Lahjat | Huumorikauppa.fi',
    description: 'Meemit ja hauskat lahjat - hauska yhdistelmä! Löydä hauskat meemituotteet 2025. Tilaa helposti.',
  },
  'hauskat-seinataulut-sisusta-huumorilla': {
    title: 'Hauskat Seinätaulut - Sisusta Koti Huumorilla | Huumorikauppa.fi',
    description: 'Hauskat seinätaulut kodin sisustukseen! Piristä seinät suomalaisella huumorilla. Nopea toimitus.',
  },
  'miksi-hauska-paita-paras-lahja': {
    title: 'Miksi Hauska T-paita On Hauska Lahja? - Syyt Selitetty | Huumorikauppa.fi',
    description: 'Hauska t-paita lahjaksi - miksi se toimii aina? Lue hauskat syyt ja vinkit oikean paidan valintaan.',
  },
  'lahja-miehelle-30v-40v-50v-60v': {
    title: 'Lahja Miehelle 30v, 40v, 50v tai 60v - Hauskat Ideat | Huumorikauppa.fi',
    description: 'Miehen pyöreä syntymäpäivä tulossa? Löydä hauska lahja 30-, 40-, 50- tai 60-vuotiaalle!',
  },
  'lahja-naiselle-30v-40v-50v-60v': {
    title: 'Lahja Naiselle 30v, 40v, 50v tai 60v - Hauskat Ideat | Huumorikauppa.fi',
    description: 'Naisen pyöreä syntymäpäivä? Hauskat ja persoonalliset lahjaideat 30-, 40-, 50- ja 60-vuotiaalle naiselle!',
  },
  'hauskat-syntymapaivaLahjat-opas': {
    title: 'Hauskat Syntymäpäivälahjat - Hauska Opas 2025 | Huumorikauppa.fi',
    description: 'Hauskat syntymäpäivälahjat 2025! Ideat kaikille - miehelle, naiselle, lapselle. Nopea toimitus.',
  },
  'lahja-henkilolle-jolla-on-jo-kaikkea': {
    title: 'Lahja Henkilölle Jolla On Jo Kaikkea - 20 Ideaa | Huumorikauppa.fi',
    description: 'Kaverilla tai sukulaisella jo kaikki? Meillä on ratkaisut! 20 hauskaa lahjaa henkilölle jolla on jo kaikkea.',
  },
  'hauskat-lahjat-tyokavereille-opas': {
    title: 'Hauskat Lahjat Työkavereille - Toimistolahjat Jotka Toimii | Huumorikauppa.fi',
    description: 'Hauskat lahjat työkavereille! Toimistolahjat jotka saavat kaikki nauramaan. Tilaa nyt.',
  },
  'hauska-lahja-kalastajalle': {
    title: 'Hauska Lahja Kalastajalle - Hauskat ideat Kalamiehenlahjaan | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa kalastajalle? Löydä hauskat ideat - t-paidat ja muut hauskuudet!',
  },
  'hauska-lahja-alle-20-euroa': {
    title: 'Hauska Lahja Alle 20 Euroa - Hauskat Edulliset Ideat | Huumorikauppa.fi',
    description: 'Hauskat lahjat alle 20 €! Edullisia ja hauskoja ideoita kaikkiin tilaisuuksiin. Nopea toimitus.',
  },
  'hauska-lahja-saunojalle': {
    title: 'Hauska Lahja Saunojalle - Hauskat Saunavinkit | Huumorikauppa.fi',
    description: 'Lahja saunojalle? Me tiedämme mitä suomalaiset saunojat haluavat! Hauskat lahjat saunan ystäville.',
  },
  'hauska-lahja-nortille-ja-gamerille': {
    title: 'Hauska Lahja Nortille ja Gamerille - Ideat Jotka Osuvat | Huumorikauppa.fi',
    description: 'Hauska lahja nortille tai gamerille? Löydä hauskat ideat - t-paidat ja muut geeklahjat!',
  },
  'hauskat-valmistujaislahjat': {
    title: 'Hauskat Valmistujaislahjat - Ideat Ylioppilaalle ja Opiskelijalle | Huumorikauppa.fi',
    description: 'Hauskat valmistujaislahjat 2026! Ideat ylioppilaalle, opiskelijalle ja ammattilaiselle. Tilaa nyt.',
  },
  'hauskat-pipot-suomi': {
    title: 'Hauskat Pipot - Löydä Hauska Humoristinen Pipo | Huumorikauppa.fi',
    description: 'Hauskat pipot suomalaisella huumorilla! Lämmin ja hauska pipo lahjaksi tai itselle. Tilaa nyt.',
  },
  'hauskat-peitot-lahjaksi': {
    title: 'Hauska Peitto Lahjaksi - Hauskat Huumoripeittoideat | Huumorikauppa.fi',
    description: 'Hauska peitto lahjaksi! Laadukas ja hauska peitto - pitää lämpimänä ja hymyilyttää. Tilaa nyt.',
  },
  'hauska-lahja-opettajalle': {
    title: 'Hauska Lahja Opettajalle - Hauskat Opettajanlahjavinkit | Huumorikauppa.fi',
    description: 'Opettajanlahja joka muistetaan! Hauskat ideat opettajalle. Nopea toimitus.',
  },
  'hauska-lahja-urheilijalle': {
    title: 'Hauska Lahja Urheilijalle - Hauskat Liikuntalahjaideat | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa urheilijalle? Hauskat lahjaideat kuntosali- ja juoksuharrastajille.',
  },
  'hauskat-laukut-kangaskassit': {
    title: 'Hauskat Laukut ja Kangaskassit - Hauskat Valinnat | Huumorikauppa.fi',
    description: 'Hauskat kangaskassit ja laukut suomalaisella huumorilla! Ekologinen ja hauska - erinomainen lahja.',
  },
  'hauskat-lahjat-koiraihmiselle': {
    title: 'Hauska Lahja Koiraihmiselle - Ideat Koiraharrastajalle | Huumorikauppa.fi',
    description: 'Lahja koiran omistajalle? Hauskat ideat kaikille koiraihmisille! Nopea toimitus.',
  },
  'hauskat-lahjat-kissaihmiselle': {
    title: 'Hauska Lahja Kissaihmiselle - Ideat Kissan Omistajalle | Huumorikauppa.fi',
    description: 'Hauskat lahjat kissaihmiselle! T-paidat ja muut kissakeskeiset hauskuudet.',
  },
  'hauskat-valmistujaislahjat-2026': {
    title: 'Hauskat Valmistujaislahjat 2026 - Ylioppilas ja AMK | Huumorikauppa.fi',
    description: 'Hauskat valmistujaislahjat 2026! Ideat ylioppilaalle, AMK:sta valmistuvalle ja maisterille. Nopea toimitus.',
  },
  'hauska-lahja-juhannukseen-2026': {
    title: 'Hauska Lahja Juhannukseen 2026 - Mökki- ja saunapaidat | Huumorikauppa.fi',
    description: 'Hauskat juhannuslahjat 2026! Mökkimukit, saunapaidat ja tarrat koko juhannusseurueelle. Tilaa ennen 19.6.',
  },
  'hauskat-lahjat-alle-30-euroa': {
    title: 'Hauskat Lahjat Alle 30 Euroa - Top 10 Edullista Ideaa | Huumorikauppa.fi',
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
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "T-paitamme ovat 100 % puuvillaa tai puuvilla-polyesteri-sekoitteita. Materiaali on pehmeä ihoa vasten ja kestää useita pesuja muuttumatta. Koot XS-3XL." },
    { q: "Onko t-paidat painetaan tilauksesta?", a: "Kyllä, kaikki t-paitamme painetaan tilauksesta tilauksesta DTG-tekniikalla (Direct-to-Garment), joka tuottaa kirkkaan ja kestävän painatuksen." },
    { q: "Kuinka nopeasti tilaus toimitetaan?", a: `Tilaukset toimitetaan ${TOIMITUSAIKA_TEKSTI} arkipäivässä koko Suomeen Posti tai Matkahuoltoin kautta. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin. Saat sähköpostiisi seurantakoodin heti kun paketti lähtee.` },
    { q: "Voiko t-paidan palauttaa?", a: "Kyllä, standardituotteilla on 14 päivän palautusoikeus. Palautus on helppo - ota yhteyttä asiakaspalveluumme, saat ohjeet sähköpostitse." },
  ],
  'hupparit': [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Hupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta (80/20). Materiaali on lämmin, pehmeä ja kestää useita pesuja. Koot S-3XL." },
    { q: "Onko hupparit painetaan tilauksesta?", a: "Kyllä, kaikki hupparimme painetaan tilauksesta tilauksesta DTG-tekniikalla." },
    { q: "Kuinka nopeasti huppari toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää koko Suomeen. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.` },
    { q: "Voiko hupparin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme saadaksesi palautusohjeet." },
  ],
  'mukit': [
    { q: "Onko mukit konepesun kestäviä?", a: "Kyllä, kaikki mukimme kestävät konepesua. Suosittelemme pesemään matalalla lämpötilalla (40°C) painatuksen säilymiseksi pidempään." },
    { q: "Minkä kokoisia mukit ovat?", a: "Mukimme ovat standardi 11 oz (noin 325 ml) -kokoisia. Sopivat aamukahviin tai teehen." },
    { q: "Kuinka nopeasti muki toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.` },
    { q: "Voiko mukin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus kaikille tuotteille. Ota yhteyttä asiakaspalveluumme." },
  ],
  'tarrat': [
    { q: "Onko tarrat ulkokäyttöön sopivia?", a: "Kyllä, tarramme ovat laadukasta vinyyliä joka kestää kosteutta, UV-valoa ja lämpötilavaihteluita. Sopivat autoon, vesipulloon, läppäriin ja ulkokäyttöön." },
    { q: "Kuinka kauan tarrat kestävät?", a: "Ulkokäytössä laadukkaiden tarramme elinikä on 2-5 vuotta olosuhteista riippuen. Sisäkäytössä huomattavasti pidempään." },
    { q: "Kuinka nopeasti tarrat toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.` },
    { q: "Voiko tarrat palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'pipot': [
    { q: "Minkälaisesta materiaalista pipot ovat?", a: "Pipomme ovat pehmeää akryyli-materiaalia, joka on lämmin, joustava ja helppohoitoinen. Brodeeraus kestää pesua." },
    { q: "Sopiiko pipo lahjaksi?", a: "Ehdottomasti! Hauska pipo on loistava joululahja, syntymäpäivälahja tai pikkujoululahja työkavereille." },
    { q: "Kuinka nopeasti pipo toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.` },
    { q: "Voiko pipon palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'lippikset': [
    { q: "Minkälaisesta materiaalista lippikset ovat?", a: "Lippiksemme ovat laadukkaasta puuvilla- tai polyesteri-materiaalista. Brodeeraus on kestävä ja pysyy siistinä." },
    { q: "Sopiiko lippis lahjaksi?", a: "Kyllä, hauska lippis on erinomainen lahja erityisesti kesällä. Sopii syntymäpäiviin, polttareihin ja muihin juhliin." },
    { q: "Kuinka nopeasti lippis toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.` },
    { q: "Voiko lippiksen palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'haalarimerkit': [
    { q: "Sopivatko haalarimerkit kaikille haalareille?", a: "Kyllä, haalarimerkkimme sopivat kaikkiin haalareihin, laukkuihin ja reppuihin. Kiinnitys tapahtuu turvallisesti neulalla." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä?", a: "Kyllä, tarjoamme myös räätälöityjä haalarimerkkejä. Ota yhteyttä asiakaspalveluumme tilausta varten." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.` },
    { q: "Sopivatko haalarimerkit lahjaksi?", a: "Ehdottomasti! Haalarimerkit ovat loistava lahja opiskelijalle kiltajuhliin tai tupaantuliaisiin." },
  ],
};

// Gift page path → FAQ entries
const GIFT_FAQS: Record<string, Array<{q: string; a: string}>> = {
  '/hauskat-lahjat-miehelle': [
    { q: "Mikä on hauska lahja miehelle?", a: "Suosituimpia hauskoja lahjoja miehelle ovat huumoripaita, -huppari tai -muki joka liittyy hänen harrastukseensa tai ammattiinsa. Suosituimpia ovat kalamies-, ammattimies- ja Mersumies-teemat." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle miehelle?", a: "'100 % eläkeläinen' ja 'Museo-kappale' -teemat ovat erityisen suosittuja 50-vuotiaiden lahjoina. Myös ammattihuumoriaiheet toimivat hyvin." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "L on miesten yleisin koko. Kokoopas löytyy jokaisen tuotteen sivulta. Epävarma? Valitse XL - löysä istuvuus on turvallisempi kuin liian pieni." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Tällä hetkellä emme tarjoa lahjapakettia, mutta tilausvahvistus toimii mukavana lahjasaatteena digitaalisesti." },
  ],
  '/hauskat-lahjat-naiselle': [
    { q: "Mikä on hauska lahja naiselle?", a: "Suosituimpia lahjoja naiselle ovat 'Maailman paras äiti' -hupparit, söpöt huumoriaiheeiset tuotteet. Myös kangaskassit ovat suosittuja." },
    { q: "Sopiiko huumoripaita lahjaksi naiselle?", a: "Kyllä, erityisesti äitiaiheeiset ja arjen huumori- ja viiniaiheeiset tuotteet ovat naisten suosiossa." },
    { q: "Miten valitsen oikean koon lahjaksi naiselle?", a: "M tai L on yleisimmät naisten koot. Ylisuuri (oversized) tyyli on tällä hetkellä trendikäs." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Emme tällä hetkellä tarjoa lahjapakettia, mutta tilausvahvistus soveltuu digitaaliseksi lahjasaatteeksi." },
  ],
  '/lahja-miehelle': [
    { q: "Mikä on hyvä lahja miehelle joka tykkää huumorista?", a: "Hauska lahja miehelle on tuote joka liittyy hänen harrastukseensa tai ammattiinsa - kalamies, sähkömies, eläkeläinen, Mersumies. Valikoimastamme löydät yli 75 hauskaa ideaa." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle?", a: "Ehdottomasti. Suosituimpia ovat '100 % Eläkeläinen', 'Museo-kappale' ja ammattihuumori. Hauska paita on aina yllättävä ja muistettava lahja." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "L on miesten yleisin koko. Epävarma? Valitse yksi koko ylöspäin - löysä istuvuus on turvallisempi." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Lahjapakettia ei tarjota tällä hetkellä, mutta tilausvahvistus sopii lahjasaatteeksi." },
  ],
  '/joululahjat': [
    { q: "Mikä on hauska joululahja huumorin ystävälle?", a: "Hauska joululahja on t-paita, huppari tai pipo suomalaisesta ammattihuumorista. Suosituimpia ovat kalamies-, äijä- ja eläkeläisteemat." },
    { q: "Milloin viimeistään tilata joululahja?", a: "Tilaa viimeistään perjantaina 20.11.2026, niin tilaus ehtii perille jouluaattoon mennessä. Tuotteet painetaan tilauksesta painotaloissa, ja päivämäärä on laskettu hitaimman painotalon tuotanto- ja toimitusajan mukaan." },
    { q: "Miten valitsen oikean koon joululahjaksi?", a: "L on yleisimmin sopiva koko miehille. Epävarma? Valitse yksi koko ylöspäin." },
    { q: "Voiko joululahjan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus." },
  ],
  '/syntymapaivalahjat': [
    { q: "Mikä on hauska syntymäpäivälahja huumorin ystävälle?", a: "Huumoripaita, -huppari tai -muki on hauska syntymäpäivälahja. Suosituimpia ovat '100 % Eläkeläinen' ja ammattihuumori ikääntyvälle juhlijalle." },
    { q: "Sopiiko huumoripaita syntymäpäivälahjaan?", a: "Ehdottomasti! Hauska paita on yllättävä, persoonallinen ja tulee oikeasti käyttöön." },
    { q: "Miten valitsen oikean koon syntymäpäivälahjaan?", a: "L on yleisin koko miehille, M naisille. Epävarma? Yksi koko ylöspäin on turvallisempi." },
    { q: "Kuinka nopeasti syntymäpäivälahja toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Tilaa hyvissä ajoin jos synttäripäivä lähestyy.` },
  ],
  '/polttari-lahjat': [
    { q: "Mitkä ovat suosituimmat polttaripaidat?", a: "Suosituimpia ovat 'Game Over', 'Viimeinen vapaa ilta' ja personoidut polttaripaidat koko porukalle." },
    { q: "Sopiiko huumoripaita polttarilahjana?", a: "Ehdottomasti - polttaripaita on perinteinen ja hauska tapa juhlistaa tapahtumaa. Yhtenäiset paidat ryhmälle tekevät illan unohtumattomaksi." },
    { q: "Miten valitsen oikean koon polttaripaidoille?", a: "Kerää ryhmältä koot etukäteen. Epävarma? Unisex-koot hieman suuremmiksi." },
    { q: "Voiko polttaripaitoja tilata isomman erän?", a: "Kyllä! Ryhmätilaukset onnistuvat helposti - lisää eri koot koriin tai ota yhteyttä asiakaspalveluumme." },
  ],
  '/elakelahjat': [
    { q: "Mikä on hauska eläkelahja?", a: "'Olen eläkkeellä' ja '100 % eläkeläinen' -teemat ovat suosituimpia eläkelahja-ideoita. T-paidat, hupparit ja mukit sopivat hyvin." },
    { q: "Sopiiko huumoripaita eläkkeelle jäävälle työkavereille?", a: "Kyllä - hauska eläkelahja on työtovereiden perinteinen tapa toivottaa työkaveri hyvää eläkettä." },
    { q: "Miten valitsen oikean koon eläkelahjaan?", a: "L on miesten ja M naisten yleisin koko. Epävarma? Valitse yksi ylöspäin." },
    { q: "Kuinka nopeasti eläkelahja toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Tilaa ajoissa ennen eläkejuhlia.` },
  ],
  '/lahja-kaverille': [
    { q: "Mikä on hauska lahja kaverille?", a: "Hauska lahja kaverille on huumoripaita, -huppari tai -muki kaverin harrastuksesta tai persoonallisuudesta. Alle 30 € saat loistavan lahjan." },
    { q: "Sopiiko huumoripaita kaverin synttärilahjaksi?", a: "Ehdottomasti! Hauska paita on yllättävä, persoonallinen ja tulee oikeasti käyttöön." },
    { q: "Miten valitsen oikean koon kaverille?", a: "Tiedät kaverin koon parhaiten. Epävarma? Valitse yksi koko ylöspäin." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Tilaa hyvissä ajoin ennen synttäreitä.` },
  ],
  '/lahja-tyokaverille': [
    { q: "Mikä on hauska lahja työkavereille?", a: "'No niin' -muki ja '100 % eläkeläinen' -paita ovat suosituimpia työkaverilahjoja. Ne sopivat työkaverin lähtöön tai syntymäpäivään." },
    { q: "Sopiiko huumoripaita työkaverin läksiäislahjaksi?", a: "Kyllä - hauska paita tai muki on oivallinen muisto yhteisistä vuosista." },
    { q: "Miten valitsen oikean koon työkaverin lahjaksi?", a: "Jos et tiedä kokoa, L tai M on turvallinen valinta. Muki tai tarra ovat hyviä koottomia vaihtoehtoja." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Tilaa hyvissä ajoin ennen läksiäisiä.` },
  ],
  '/hauskat-t-paidat': [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "T-paitamme ovat 100 % puuvillaa, painetaan tilauksesta DTG-tekniikalla." },
    { q: "Sopiiko hauska t-paita lahjaksi?", a: "Ehdottomasti! Hauska t-paita on persoonallinen ja tulee oikeasti käyttöön. Hauska syntymäpäivä-, joulu- tai läksiäislahja." },
    { q: "Miten valitsen oikean koon?", a: "L on miesten yleisin koko. Kokoopas löytyy jokaiselta tuotesivulta. Epävarma? Valitse XL." },
    { q: "Voiko t-paidan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  '/hauskat-hupparit': [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Hupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta. Lämmin, mukava ja kestävä. Koot S-3XL." },
    { q: "Sopiiko hauska huppari lahjaksi?", a: "Ehdottomasti! Huppari on käytännöllinen ja hauska lahja - sitä käytetään vuosia." },
    { q: "Miten valitsen oikean koon?", a: "L on yleisin koko. Kokoopas jokaisella tuotesivulla. Epävarma? Valitse XL." },
    { q: "Voiko hupparin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  '/haalarimerkit': [
    { q: "Sopivatko haalarimerkit kaikille haalareille?", a: "Kyllä, merkkimme sopivat kaikkiin haalareihin, reppuihin ja laukkuihin. Kiinnitys neulalla." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä?", a: "Kyllä! Räätälöityjä merkkejä tilauksesta. Ota yhteyttä asiakaspalveluumme." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.` },
    { q: "Sopivatko haalarimerkit lahjaksi opiskelijalle?", a: "Ehdottomasti! Haalarimerkit ovat loistava lahja opiskelijalle kiltajuhliin tai tupaantuliaisiin." },
  ],
  '/opiskelijan-haalarimerkit': [
    { q: "Mitä haalarimerkit ovat?", a: "Haalarimerkit ovat pieniä brodeerattuja tai painettuja merkkejä jotka kiinnitetään haalariin tai reppuun. Ne ovat perinteinen tapa personoida opiskelijan haalarit." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä tai logolla?", a: "Kyllä! Tarjoamme räätälöityjä haalarimerkkejä kiltajärjestöille ja yksityishenkilöille. Kysy tarjous asiakaspalvelusta." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. Suuret ryhmätilaukset voivat kestää pidempään.` },
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
    .map(s => `<script type="application/ld+json">\n${serializeJsonLd(s)}\n</script>`)
    .join('\n  ');
  return html.replace('</head>', `  ${tags}\n</head>`);
}

// ── Unknown products: real 404 ───────────────────────────────────────────────

export type ProductStatus = 'known' | 'missing' | 'hidden' | 'unknown';

export function productSlugFromPath(path: string): string {
  const raw = path.slice('/tuote/'.length).replace(/\/+$/, '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Buildissa kirjoitettu lista myynnissä olevista tuoteslugeista (scripts/prerender.mjs). */
let knownSlugsCache: { at: number; slugs: Set<string> | null } | null = null;
const KNOWN_SLUGS_TTL_MS = 5 * 60 * 1000;

async function knownProductSlugs(origin: string): Promise<Set<string> | null> {
  if (knownSlugsCache && Date.now() - knownSlugsCache.at < KNOWN_SLUGS_TTL_MS) return knownSlugsCache.slugs;
  let slugs: Set<string> | null = null;
  try {
    const res = await fetch(`${origin}/product-slugs.json`, {
      headers: { 'x-bot-inject': 'true' },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) slugs = new Set(data.filter((s): s is string => typeof s === 'string'));
    }
  } catch {
    slugs = null;
  }
  knownSlugsCache = { at: Date.now(), slugs };
  return slugs;
}

/**
 * known = myynnissä (tai ei voitu tarkistaa -> 'unknown', jolloin pyyntö päästetään läpi),
 * missing = slugia ei ole tai tuote on luonnos, hidden = piilotettu kategoria (mukit).
 */
export async function productStatus(origin: string, slug: string): Promise<ProductStatus> {
  if (!slug || slug.includes('/')) return 'missing';
  const known = await knownProductSlugs(origin);
  if (known?.has(slug)) return 'known';
  // Buildin jälkeen lisätyt tuotteet: tarkistetaan Supabasesta.
  if (!SUPABASE_URL || !SUPABASE_KEY) return 'unknown';
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=slug,name,category,is_active,variants&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return 'unknown';
    const rows: Array<{ slug: string; name?: string; category: string; is_active?: boolean | null; variants?: unknown }> = await res.json();
    if (!Array.isArray(rows)) return 'unknown';
    const row = rows[0];
    if (!row || row.is_active === false) return 'missing';
    if (onPiilotettuTuote(row)) return 'hidden';
    return 'known';
  } catch {
    return 'unknown';
  }
}

const FALLBACK_404_HTML =
  '<!doctype html><html lang="fi"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow">' +
  '<title>Sivua ei löytynyt | Huumorikauppa</title></head><body><h1>Sivua ei löytynyt</h1>' +
  '<p><a href="/kaikki-tuotteet">Kaikki tuotteet</a></p></body></html>';

async function notFoundResponse(origin: string): Promise<Response> {
  let body = FALLBACK_404_HTML;
  try {
    const res = await fetch(`${origin}/404.html`, {
      headers: { 'x-bot-inject': 'true' },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) body = await res.text();
  } catch {
    // käytetään varasivua
  }
  return new Response(body, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, max-age=0, s-maxage=300',
    },
  });
}

// ── Main middleware ───────────────────────────────────────────────────────────

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (request.headers.get('x-bot-inject') === 'true') {
    return undefined;
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // Tuntematon tuote -> oikea 404 (ei pehmeää 404:ää SPA-kuorella). Koskee kaikkia user agenteja.
  if (path.startsWith('/tuote/')) {
    // Lovable-synkronoinnin kaksoiskappale ("...-0d6670") -> perusrivi (api/_lib/kaksoiskappaleet.js).
    const perus = kaksoiskappaleenPerusslug(productSlugFromPath(path));
    if (perus) return Response.redirect(`${url.origin}/tuote/${perus}`, 301);
    const status = await productStatus(url.origin, productSlugFromPath(path));
    if (status === 'missing') return notFoundResponse(url.origin);
    if (status === 'hidden') return Response.redirect(`${url.origin}/kaikki-tuotteet`, 301);
  }

  const ua = request.headers.get('user-agent') || '';
  if (!BOT_REGEX.test(ua)) {
    return undefined;
  }

  // 1) Haetaan reitin oma HTML. Esirenderöidyllä reitillä se on staattinen tiedosto, jossa on
  //    jo sivun oma canonical: päästetään pyyntö silloin läpi koskematta (ei tuplatageja).
  //    Muuten vastaus on SPA-kuori (vercel.json-rewrite), johon metat injektoidaan alla.
  let baseHtml: string;
  try {
    const baseResponse = await fetch(new Request(url.origin + path, {
      headers: { 'x-bot-inject': 'true' },
      redirect: 'manual',
    }));
    if (!baseResponse.ok) return undefined;
    baseHtml = await baseResponse.text();
  } catch {
    return undefined;
  }
  if (isPrerenderedHtml(baseHtml, path)) {
    return undefined;
  }

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
        description: 'Lahjaideoita ja hauskan ostajan oppaita Huumorikaupasta. Löydä hauska lahja!',
      };
    }
  }
  // Product pages: /tuote/:slug - data fetched live from Supabase
  else if (path.startsWith('/tuote/')) {
    const slug = path.slice('/tuote/'.length).replace(/\/$/, '');
    const product = await fetchProductBySlug(slug);
    if (product) {
      const catName = CATEGORY_NAMES[product.category] || product.category;
      meta = {
        title: `${product.name} - ${catName} | Huumorikauppa.fi`,
        description: `${product.name} - hauska ${catName.toLowerCase()} lahjaksi tai itselle. Korkealaatuinen, painetaan tilauksesta. Hinta ${product.price.toFixed(2).replace('.', ',')} €. Tilaa nyt Huumorikauppa.fi:stä.`,
      };
      productData = { ...product, categoryName: catName };
    } else {
      // Fallback for unknown slugs (Supabase unavailable or product not found)
      const nameFromSlug = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      meta = {
        title: `${nameFromSlug} | Huumorikauppa.fi`,
        description: `${nameFromSlug} - hauska tuote lahjaksi tai itselle. Tilaa Huumorikauppa.fi:stä, nopea toimitus koko Suomeen.`,
      };
    }
  }
  // Situation gift pages: /lahjat/:slug
  else if (path.startsWith('/lahjat/')) {
    const slug = path.slice('/lahjat/'.length).replace(/\/$/, '');
    meta = {
      title: `${slug.replace(/-/g, ' ')} - Hauska lahja | Huumorikauppa.fi`,
      description: `Hauskat lahjat ja tuotteet Huumorikaupasta. Nopea toimitus, ilmainen ${ILMAINEN_RAJA_TEKSTI} eurosta.`,
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
    let html = baseHtml;

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
      // Sama Product + Offer -rakenne kuin esirenderöinnissä ja ProductPagessa (src/seo/structuredData.ts).
      const images = (pd.images || [])
        .filter(Boolean)
        .map((img) => proxiedImage(img.startsWith('http') ? img : `https://huumorikauppa.fi${img}`, { absolute: true }));
      const productSchema = buildProductJsonLd({
        id: pd.id,
        slug: pd.slug,
        name: pd.name,
        description: pd.description,
        images,
        price: Number(pd.price),
        stock: pd.stock,
        categoryName: pd.categoryName,
        variants: pd.variants,
      });
      const breadcrumbSchema = buildBreadcrumbJsonLd([
        { name: 'Etusivu', url: 'https://huumorikauppa.fi/' },
        { name: pd.categoryName, url: `https://huumorikauppa.fi/kategoria/${pd.category}` },
        { name: pd.name, url: `https://huumorikauppa.fi/tuote/${pd.slug}` },
      ]);
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
