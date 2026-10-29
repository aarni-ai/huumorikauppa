import { kaikkiTuotteet } from "./_lib/tuotteet.js";
import { onPiilotettuTuote } from "./_lib/piilotetut.js";
import PAKETIT from "./_lib/paketit-data.js";
import { OHJATUT_TUOTESLUGIT } from "./_lib/ohjatut-tuotteet.js";
import { KOKONAAN_EI_SAATAVILLA } from "./_lib/printify-saatavuus.js";
import { onKaksoiskappaleTaiTestikopio } from "./_lib/kaksoiskappaleet.js";
import { onEuReititetty } from "./_lib/eu-reititys.js";
/**
 * Dynamic sitemap.xml — fetches ALL products from Supabase and emits a
 * complete sitemap including products, categories, gift-landing pages,
 * blog posts and static pages. Runs on Vercel's Node runtime.
 *
 * Wired in vercel.json:  /sitemap.xml -> /api/sitemap
 */

const SITE = "https://huumorikauppa.fi";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://exhzrrbvipqwhjhjgnxs.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/kaikki-tuotteet", changefreq: "daily", priority: "0.9" },
  { loc: "/blogi", changefreq: "weekly", priority: "0.8" },
  { loc: "/usein-kysytyt-kysymykset", changefreq: "monthly", priority: "0.5" },
  { loc: "/toimitusehdot", changefreq: "monthly", priority: "0.3" },
  { loc: "/palautusehdot", changefreq: "monthly", priority: "0.3" },
  { loc: "/tietosuojakaytanto", changefreq: "monthly", priority: "0.3" },
  { loc: "/yhteystiedot", changefreq: "monthly", priority: "0.5" },
  { loc: "/polttari-lahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/aitienpaiva", changefreq: "weekly", priority: "0.7" },
  { loc: "/joulun-viimeiset-tilauspaivat", changefreq: "weekly", priority: "0.8" },
  { loc: "/ryhmatilaukset", changefreq: "monthly", priority: "0.7" },
  { loc: "/media", changefreq: "monthly", priority: "0.4" },
  { loc: "/lahjakortti", changefreq: "monthly", priority: "0.7" },
  { loc: "/paketit", changefreq: "weekly", priority: "0.7" },
  ...PAKETIT.map((p) => ({ loc: `/paketit/${p.slug}`, changefreq: "weekly", priority: "0.6" })),
];

/**
 * Laskeutumissivut. Pidä samana kuin src/data/landingRoutes.ts:n LANDING_PATHS
 * (src/seo/sitemap.test.ts tarkistaa).
 */
const LANDING_PATHS = [
  "/joululahjat",
  "/lahjat/joululahjaksi-miehelle",
  "/lahjat/joululahjaksi-naiselle",
  "/joululahja-miehelle-jolla-on-kaikki",
  "/joululahja-isalle",
  "/joululahja-aidille",
  "/joululahja-vaimolle",
  "/joululahja-kaverille",
  "/joululahja-tyokaverille",
  "/lahjat/pomolle",
  "/joululahja-mummolle",
  "/joululahja-papalle",
  "/joululahja-elakelaiselle",
  "/joululahja-teinille",
  "/lahjat/alle-30-euroa",
  "/joululahja-alle-50-euroa",
  "/lahjat/pikkujouluihin",
  "/salainen-joulupukki-lahja",
  "/black-friday",
  "/meemipaidat",
  "/suomalainen-huumori-paidat",
  "/tonnin-seteli-paita",
  "/setamiespaidat",
  "/lahjat/30-vuotiaalle-miehelle",
  "/lahjat/40-vuotiaalle-miehelle",
  "/lahjat/50-vuotiaalle-miehelle",
  "/lahjat/60-vuotiaalle-miehelle",
  "/lahjat/70-vuotiaalle",
  "/lahjat/50-vuotiaalle-naiselle",
  "/lahjat/60-vuotiaalle-naiselle",
  "/elakelahjat",
  "/lahjat/isoisalle",
  "/lahjat/isoaidille",
  "/lahjat/siskolle",
  "/lahjat/veljelle",
  "/lahjat/puolisolle",
  "/lahjat/vauvalle",
  "/lahja-kaverille",
  "/lahjat/tyokaverille",
  "/isanpaivalahja",
  "/hauska-isanpaivalahja",
  "/hauskat-lahjat-miehelle",
  "/hauskat-lahjat-naiselle",
  "/syntymapaivalahjat",
  "/lahjat/harrastajalle",
  "/lahjat/remontoijalle",
  "/lahjat/kalastajalle",
  "/lahjat/metsastajalle",
  "/lahjat/autoilijalle",
  "/lahjat/golfaajalle",
  "/lahjat/mokkeilijalle",
  "/lahjat/maanviljelijalle",
  "/lahjat/it-ihmiselle",
  "/ammattipaidat",
];

/**
 * Muut /lahjat/-sivut (src/data/situationGifts.ts). 28.10.2026 (canonical-korjaus) jokainen tilannesivu on joko
 * laskeutumissivu (LANDING_PATHS) tai 301-ohjaus (vercel.json), joten erillisiä tilannesivuja ei ole.
 */
const SITUATION_GIFT_SLUGS = [];

/** Kaupunkisivut, joilla on omat kaupunkituotteet (src/data/municipalities.ts, ASCII-slugit). */
const CITY_SLUGS = [
  "helsinki", "espoo", "tampere", "vantaa", "oulu", "turku", "jyvaskyla", "lahti", "kuopio", "joensuu",
  "rovaniemi", "vaasa", "seinajoki", "pori", "hameenlinna", "mikkeli", "kokkola", "lappeenranta", "imatra",
  "kotka", "kouvola", "porvoo", "salo", "savonlinna", "hyvinkaa", "jarvenpaa", "kerava", "rauma", "kajaani",
  "lohja", "tornio", "kemi", "nokia", "riihimaki", "raisio", "kaarina", "naantali", "ylojarvi", "kangasala",
  "iisalmi", "varkaus", "heinola", "lempaala", "pirkkala", "forssa", "lieksa", "valkeakoski", "akaa",
  "orimattila", "harjavalta", "nummela",
];

// Kategoriat, joilla on oma sivu. Mukit on piilotettu ja kategoriat, joissa on alle 8 tuotetta, ohjautuvat 301:llä
// muualle (src/lib/hiddenCategories.ts YHDISTETYT_KATEGORIAT, 28.10.2026).
const CATEGORIES = ["t-paidat", "hupparit"];

const BLOG_SLUGS = [
  // 28.10.2026: joulun ja pikkujoulun hakuoppaat (src/data/blogJouluHaut2026.ts).
  "hauska-joulupaita",
  "pikkujouluasu-2026",
  "pikkujoulu-teema-ideat",
  "pikkujouluohjelma-tyopaikalle",
  "pikkujoululahja-miehelle",
  "joululahja-tyttoystavalle",
  "joululahja-vanhemmille",
  "hauska-joululahja-ystavalle",
  "joululahja-tyontekijoille",
  "joululahja-opiskelijalle",
  // 28.10.2026: isänpäivän ja joulun sesonkioppaat (src/data/blogSesonki2026.ts).
  "isanpaivalahja-isoisalle",
  "lahja-ensimmaiseksi-isanpaivaksi",
  "pikkujoulujen-lahjapeli",
  "pikkujoulupaidat-porukalle",
  "joululahja-poikaystavalle",
  "joululahja-anopille-ja-appiukolle",
  "joululahja-siskolle",
  // 27.10.2026: puuttuneet artikkelit (testi src/test/sitemap-blogi.test.ts vertaa blogidataan).
  "hauska-lahja-helsinkilaiselle",
  "hauska-lahja-juhannukseen-2026",
  "hauska-lahja-kaverille",
  "hauska-lahja-mokkilaiselle",
  "hauska-lahja-pomolle",
  "hauska-lahja-tamperelaiselle",
  "hauskat-lahjat-alle-30-euroa",
  "hauskat-lahjat-kissaihmiselle",
  "hauskat-lahjat-koiraihmiselle",
  "hauskat-lahjat-teinipojalle-ja-tytolle",
  "hauskat-laukut-kangaskassit",
  "hauskat-pikkujoululahjat-tyokavereille",
  "hauskat-valmistujaislahjat-2026",
  "hauskimmat-elakelahjat-selviytymisopas",
  "kaupunkipaita-idea-kotiseudulle",
  "kaupunkituotteet-hauska-lahja-kotiseutuylpealle",
  // 26.10.2026: joulun lisäoppaat (src/data/blogJoulu2026Lisa.ts).
  "hauska-joululahja-naiselle",
  "joululahja-aidille-hauskat-ideat",
  "joululahja-papalle-ja-ukille",
  "joululahja-elakelaiselle",
  "joululahja-kaverille-alle-30-euroa",
  "joululahja-veljelle",
  "hauskat-joululahjaideat-miehelle-2026",
  "pikkujoululahja-alle-20-euroa",
  "lahja-miehelle-jolla-on-kaikki",
  "elakelahja-joka-naurattaa",
  "mita-ostaa-tyokaverille-jouluksi",
  "joululahja-isalle-hauskat-ideat",
  "salaisen-joulupukin-lahja-10-20-30-euroa",
  "hauska-lahja-teinille-jouluksi",
  "lahja-kalastajalle-metsastajalle-mokkeilijalle",
  "joululahjan-viimeiset-tilauspaivat-2026",
  "20-hauskinta-t-paitaa-2026",
  "hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat",
  "hauskat-mukit-toimistoon-ja-lahjaksi",
  "parhaat-polttaripaidat-ja-polttarilahjat-2026",
  "parhaat-joululahjat-ja-pikkujoululahjat-2026",
  "parhaat-hauskat-lahjat-miehelle",
  "hauskat-lahjat-naiselle-opas",
  "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea",
  "hauskat-isanpaivalahjat-opas",
  "hauska-aitienpaivalahja-opas",
  "hauskat-elakelahjat-opas",
  "parhaat-hauskat-tarrat-lappariin",
  "hauska-vauvalahja-parhaat-bodyt",
  "parhaat-meemituotteet-2025",
  "hauskat-seinataulut-sisusta-huumorilla",
  "miksi-hauska-paita-paras-lahja",
  "lahja-miehelle-30v-40v-50v-60v",
  "lahja-naiselle-30v-40v-50v-60v",
  "hauskat-syntymapaivaLahjat-opas",
  "lahja-henkilolle-jolla-on-jo-kaikkea",
  "hauskat-lahjat-tyokavereille-opas",
  "hauska-lahja-kalastajalle",
  "hauska-lahja-alle-20-euroa",
  "hauska-lahja-saunojalle",
  "hauska-lahja-nortille-ja-gamerille",
  "hauskat-valmistujaislahjat",
  "hauskat-pipot-suomi",
  "hauskat-peitot-lahjaksi",
  "hauska-lahja-opettajalle",
  "hauska-lahja-urheilijalle",
  "hauskat-hupparit-lahjaksi",
  "hauskat-koristeet-lahjaksi",
  "lahja-tuoreille-vanhemmille",
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toW3CDate(date) {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

async function fetchAllProducts() {
  // Oma tausta (21.10.2026): tuotteet omasta lähteestä (tietokanta tai tilannekuva). Sama rajaus kuin kaupassa ja
  // mainissa: ei luonnoksia, ei piilotettuja (mukit, myös väärässä kategoriassa), ei ohjattuja kaksoiskappaleita.
  const rivit = (await kaikkiTuotteet()).filter((p) => p.is_active !== false && !onPiilotettuTuote(p) && !OHJATUT_TUOTESLUGIT.has(p.slug) && !KOKONAAN_EI_SAATAVILLA.has(p.slug) && !onKaksoiskappaleTaiTestikopio(p.slug) && !onEuReititetty(p));
  return rivit
    .map((p) => ({ slug: p.slug, updated_at: p.updated_at }))
    .sort((x, y) => String(y.updated_at || "").localeCompare(String(x.updated_at || "")));
}

export default async function handler(req, res) {
  try {
    const products = await fetchAllProducts();
    const today = new Date().toISOString().split("T")[0];

    const staticUrls = STATIC_PAGES.map(
      (p) => `  <url>
    <loc>${escapeXml(SITE + p.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    );

    const categoryUrls = CATEGORIES.map(
      (cat) => `  <url>
    <loc>${escapeXml(SITE + "/kategoria/" + cat)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    );

    const productUrls = products.map(
      (p) => `  <url>
    <loc>${escapeXml(SITE + "/tuote/" + p.slug)}</loc>
    <lastmod>${toW3CDate(p.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
    );

    const blogUrls = BLOG_SLUGS.map(
      (slug) => `  <url>
    <loc>${escapeXml(SITE + "/blogi/" + slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    );

    const landingUrls = LANDING_PATHS.map(
      (loc) => `  <url>
    <loc>${escapeXml(SITE + loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    );

    const cityUrls = CITY_SLUGS.map(
      (slug) => `  <url>
    <loc>${escapeXml(SITE + "/kaupunki/" + slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
    );

    const situationUrls = SITUATION_GIFT_SLUGS.map(
      (slug) => `  <url>
    <loc>${escapeXml(SITE + "/lahjat/" + slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...landingUrls, ...categoryUrls, ...situationUrls, ...cityUrls, ...productUrls, ...blogUrls].join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send(`Sitemap error: ${err && err.message ? err.message : "unknown"}`);
  }
}