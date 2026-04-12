import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SITE = "https://huumorikauppa.fi";

const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/kaikki-tuotteet", changefreq: "daily", priority: "0.9" },
  { loc: "/blogi", changefreq: "weekly", priority: "0.8" },
  { loc: "/usein-kysytyt-kysymykset", changefreq: "monthly", priority: "0.5" },
  { loc: "/toimitusehdot", changefreq: "monthly", priority: "0.3" },
  { loc: "/palautusehdot", changefreq: "monthly", priority: "0.3" },
  { loc: "/tietosuojakaytanto", changefreq: "monthly", priority: "0.3" },
  { loc: "/yhteystiedot", changefreq: "monthly", priority: "0.5" },
  // Gift category pages
  { loc: "/hauskat-lahjat-miehelle", changefreq: "weekly", priority: "0.8" },
  { loc: "/hauskat-lahjat-naiselle", changefreq: "weekly", priority: "0.8" },
  { loc: "/polttari-lahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/isanpaiva-lahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/aitienpaiva-lahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/joululahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/syntymapaivaLahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/elakelahjat", changefreq: "weekly", priority: "0.7" },
  { loc: "/lahja-kaverille", changefreq: "weekly", priority: "0.7" },
  { loc: "/lahja-tyokaverille", changefreq: "weekly", priority: "0.7" },
];

const CATEGORIES = [
  "t-paidat", "mukit", "tarrat", "hupparit", "bodyt",
  "peitot", "pipot", "seinataulut", "pitkahihaiset", "koristeet",
];

// Blog post slugs - these are static content
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

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function toW3CDate(date: string): string {
  return new Date(date).toISOString().split("T")[0];
}

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: products, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Static pages
  const staticUrls = STATIC_PAGES.map(
    (p) => `  <url>
    <loc>${escapeXml(SITE + p.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  );

  // Category pages
  const categoryUrls = CATEGORIES.map(
    (cat) => `  <url>
    <loc>${escapeXml(SITE + "/kategoria/" + cat)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  );

  // Product pages (dynamic from DB)
  const productUrls = (products || []).map(
    (p: any) => `  <url>
    <loc>${escapeXml(SITE + "/tuote/" + p.slug)}</loc>
    <lastmod>${toW3CDate(p.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  );

  // Blog pages
  const blogUrls = BLOG_SLUGS.map(
    (slug) => `  <url>
    <loc>${escapeXml(SITE + "/blogi/" + slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...categoryUrls, ...productUrls, ...blogUrls].join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, max-age=3600",
    },
  });
});
