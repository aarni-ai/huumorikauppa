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
  { loc: "/hauskat-lahjat-miehelle", changefreq: "weekly", priority: "0.8" },
  { loc: "/hauskat-lahjat-naiselle", changefreq: "weekly", priority: "0.8" },
  { loc: "/polttari-lahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/isanpaiva-lahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/aitienpaiva-lahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/joululahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/syntymapaivalahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/elakelahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/lahja-kaverille", changefreq: "weekly", priority: "0.7" },
  { loc: "/lahja-tyokaverille", changefreq: "weekly", priority: "0.7" },
];

const SITUATION_GIFT_SLUGS = [
  "50-vuotiaalle-miehelle", "60-vuotiaalle-miehelle", "40-vuotiaalle-miehelle", "30-vuotiaalle-miehelle",
  "50-vuotiaalle-naiselle", "60-vuotiaalle-naiselle", "polttareihin", "tyokaverille", "opettajalle",
  "hoitajalle", "rakennusmiehelle", "kalastajalle", "metsastajalle", "kahvinystavalle", "isoaidille",
  "isoisalle", "syntymapaivasankarille", "muutoiset", "ystavalle", "siskolle", "veljelle", "vauvalle",
  "joululahjaksi-miehelle", "joululahjaksi-naiselle",
];

const CATEGORIES = [
  "t-paidat", "mukit", "tarrat", "hupparit", "bodyt",
  "peitot", "pipot", "seinataulut", "pitkahihaiset", "koristeet",
  "laukut", "lippikset", "haalarimerkit",
  "sukat", "avaimenperat", "asut", "naamiot",
];

const BLOG_SLUGS = [
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
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const out = [];
  const pageSize = 1000;
  let from = 0;
  for (let i = 0; i < 10; i++) {
    const to = from + pageSize - 1;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=slug,updated_at&order=updated_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: `${from}-${to}`,
          "Range-Unit": "items",
          Prefer: "count=exact",
        },
      }
    );
    if (!res.ok) break;
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return out;
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
${[...staticUrls, ...categoryUrls, ...situationUrls, ...productUrls, ...blogUrls].join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, max-age=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send(`Sitemap error: ${err && err.message ? err.message : "unknown"}`);
  }
}