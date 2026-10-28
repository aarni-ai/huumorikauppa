import { isanpaivaAuki, jouluAuki, jouluLause, JOULU_PAIVA_LYHYT } from "@/data/tilauspaivat";
import { FATHERS_DAY_LAST_ORDER_TEXT, JOULU_TILAUSPAIVA_ISO, joulunTilauspaivaTyypille, paivaLyhyt } from "@/data/campaignSchedule";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import snapshot from "@/test/fixtures/products-snapshot.json";
import { categories } from "@/data/products";
import { onPiilotettu } from "@/lib/hiddenCategories";
import {
  CHRISTMAS_MENU,
  FATHERS_DAY_MENU,
  LANDING_MIN_PRODUCTS,
  LANDING_PATHS,
  LANDING_REDIRECTS,
  NOT_CREATED_LANDINGS,
  getLandingPage,
  landingPages,
  looksLikeMug,
  selectLandingProducts,
} from "@/data/landingPages";
import { CHRISTMAS_DEADLINE_PATH, CHRISTMAS_DEADLINE_PROMISE } from "@/data/christmas";
import { christmasDeadlinePage } from "@/data/christmasDeadlinePage";
import { buildPrerenderPages, buildSiteNav, normalizeProducts, type ProductRow } from "./prerender/pages";
import { renderPageHtml } from "./prerender/html";
import { EU_REITITYS_ALLE_MINIMIN, euPiilotetutTuotteet, kannanRivit, landingMinimi } from "@/test/euReititysMinimi";

const ROOT = path.resolve(__dirname, "../..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

/** Tuotedatan tilannekuva (Supabase, 21.10.2026): sama suodatus kuin kaupassa. */
// Oma tausta: rivit osoittavat kannan tapaan EU-kopioihin (src/test/euReititysMinimi.ts kannanRivit).
const products = normalizeProducts(kannanRivit(snapshot as unknown as ProductRow[]));
const pages = buildPrerenderPages({ products });
const byPath = new Map(pages.map((p) => [p.path, p]));
const nav = buildSiteNav(products);
const TEMPLATE = read("index.html");
const landingSet = new Set(landingPages.map((p) => p.path));

function pageTexts(p: (typeof landingPages)[number]): string[] {
  return [p.title, p.description, p.h1, p.name, ...p.intro, ...p.faqs.flatMap((f) => [f.q, f.a])];
}

const BANNED = [
  /\bparas\b/i,
  /\bparhaa?t\b/i,
  /\bparhaan\b/i,
  /\bparasta\b/i,
  /suomen johtava/i,
  /suomen hauskin/i,
  /suosituin/i,
  /painet\w* suomessa/i,
  /\bmuki/i,
  /\behkä\b/i,
  /\bsaattaa\b/i,
  /mahdollisesti/i,
];

describe("landing pages: data and copy rules", () => {
  it("has at least 40 unique landing pages and the light route list matches", () => {
    expect(landingPages.length).toBeGreaterThanOrEqual(40);
    expect(new Set(landingPages.map((p) => p.path)).size).toBe(landingPages.length);
    expect([...LANDING_PATHS]).toEqual(landingPages.map((p) => p.path));
  });

  it.each(landingPages.map((p) => [p.path, p] as const))("%s: title, description, h1, intro and FAQ", (_path, p) => {
    expect(p.title.length).toBeLessThan(60);
    expect(p.description.length).toBeLessThan(155);
    expect(p.description.length).toBeGreaterThan(70);
    expect(p.h1.length).toBeGreaterThan(5);
    expect(p.intro.length).toBeGreaterThanOrEqual(2);
    expect(p.intro.length).toBeLessThanOrEqual(3);
    expect(p.faqs.length).toBeGreaterThanOrEqual(4);
    expect(p.faqs.length).toBeLessThanOrEqual(6);
    for (const text of pageTexts(p)) {
      expect(text).not.toMatch(/[–—]/);
      for (const re of BANNED) expect(text, `${re}`).not.toMatch(re);
    }
  });

  it("titles, descriptions, H1s and first intro sentences are unique", () => {
    for (const key of ["title", "description", "h1"] as const) {
      const values = landingPages.map((p) => p[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
    const firstSentences = landingPages.map((p) => p.intro[0].split(/[.:]/)[0]);
    expect(new Set(firstSentences).size).toBe(firstSentences.length);
    // Kappaleet eivät toistu sivulta toiselle (ei templaattikopioita)
    const paragraphs = landingPages.flatMap((p) => p.intro);
    expect(new Set(paragraphs).size).toBe(paragraphs.length);
  });

  it("only promises the one computed Christmas date (never written by hand); the only other dates are Father's Day and its last order day", () => {
    const all = landingPages.flatMap(pageTexts).join("\n");
    const dates = new Set(all.match(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g) ?? []);
    // Joulun tilauspäivä (laskettu, src/data/campaignSchedule.ts) näkyy vain, kun tilausaika on auki.
    const joulu = jouluAuki() ? [JOULU_PAIVA_LYHYT.split(" ")[1]] : [];
    // Isänpäivän tilauspäivä (laskettu, src/data/campaignSchedule.ts) näkyy vain, kun tilausaika on auki.
    const isa = isanpaivaAuki() ? [FATHERS_DAY_LAST_ORDER_TEXT.split(" ")[1]] : [];
    // Harrastus- ja ammattisarjojen t-paitasivut (landingPagesSarjat.ts) näyttävät t-paitojen oman, myöhemmän päivän.
    const joulutpaita = jouluAuki() ? [paivaLyhyt(joulunTilauspaivaTyypille("t-paidat")).split(" ")[1]] : [];
    expect([...dates].sort()).toEqual([...new Set([...joulu, ...joulutpaita, ...isa, "8.11.2026"])].sort());
    for (const p of landingPages) {
      if (isa.length && pageTexts(p).join("\n").includes(isa[0])) {
        expect(["/isanpaivalahja", "/hauska-isanpaivalahja"], p.path).toContain(p.path);
      }
    }
    const deadline = [christmasDeadlinePage.title, christmasDeadlinePage.description, ...christmasDeadlinePage.intro,
      ...christmasDeadlinePage.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
      ...christmasDeadlinePage.faqs.flatMap((f) => [f.q, f.a])].join("\n");
    expect(new Set(deadline.match(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g) ?? [])).toEqual(new Set(jouluAuki() ? [...joulu, "1.12.2026"] : joulu));
    expect(deadline).not.toMatch(/[–—]/);
    expect(christmasDeadlinePage.title.length).toBeLessThan(60);
    expect(christmasDeadlinePage.description.length).toBeLessThan(155);
    expect(CHRISTMAS_DEADLINE_PROMISE).toBe(jouluLause());
    // Laskettu arvo tänä jouluna (muutos vaatii tietoisen päätöksen).
    expect(JOULU_TILAUSPAIVA_ISO).toBe("2026-11-30");
  });

  it("links to at least 3 other landing pages and to a visible category", () => {
    const catSlugs = new Set<string>(categories.filter((c) => !onPiilotettu(c.slug)).map((c) => c.slug));
    for (const p of landingPages) {
      const related = p.related.filter((r) => r !== p.path);
      expect(related.length, p.path).toBeGreaterThanOrEqual(3);
      for (const r of related) expect(landingSet.has(r), `${p.path} -> ${r}`).toBe(true);
      expect(p.categories.length, p.path).toBeGreaterThan(0);
      for (const c of p.categories) expect(catSlugs.has(c), `${p.path} -> ${c}`).toBe(true);
    }
  });

  it("merged and dropped pages are not landing pages and point to existing pages", () => {
    for (const [from, to] of Object.entries({ ...LANDING_REDIRECTS, ...NOT_CREATED_LANDINGS })) {
      expect(landingSet.has(from), from).toBe(false);
      expect(to, from).toMatch(/^\/[a-z0-9/-]+$/);
    }
    for (const to of Object.values(NOT_CREATED_LANDINGS)) expect(landingSet.has(to), to).toBe(true);
  });

  it("Christmas menu links only to real pages", () => {
    for (const item of CHRISTMAS_MENU) {
      expect(landingSet.has(item.href) || item.href === CHRISTMAS_DEADLINE_PATH, item.href).toBe(true);
    }
  });
});

describe("landing pages: products (snapshot of the live catalog)", () => {
  it("snapshot is filtered like the shop (no drafts, no mugs)", () => {
    expect(products.length).toBeGreaterThan(400);
    expect(products.some((p) => p.category === "mukit")).toBe(false);
  });

  it.each(landingPages.map((p) => [p.path, p] as const))("%s has at least 8 fitting products", (_path, p) => {
    const list = selectLandingProducts(p, products);
    expect(list.length).toBeGreaterThanOrEqual(landingMinimi(p.path));
    for (const item of list) {
      expect(item.category).not.toBe("mukit");
      expect(looksLikeMug(item), item.slug).toBe(false);
    }
  });

  it("EU-reitityksen poikkeussivut: vaje johtuu vain EU-reitityksestä ja poikkeus poistetaan, kun sivu on täynnä", () => {
    const euPiilotetut = euPiilotetutTuotteet(snapshot as unknown as ProductRow[]);
    for (const pagePath of EU_REITITYS_ALLE_MINIMIN) {
      const p = getLandingPage(pagePath)!;
      expect(p, pagePath).toBeTruthy();
      expect(selectLandingProducts(p, products).length, `${pagePath}: poista EU_REITITYS_ALLE_MINIMIN-listalta`).toBeLessThan(LANDING_MIN_PRODUCTS);
      // selectLandingProducts hylkää piilotetut (looksLikeMug), joten EU-piilotetut lasketaan sivun suodattimella.
      const euSopivat = euPiilotetut.filter((x) => p.filter(x)).length;
      expect(selectLandingProducts(p, products).length + euSopivat, pagePath).toBeGreaterThanOrEqual(LANDING_MIN_PRODUCTS);
    }
  });

  it("price pages respect their budget", () => {
    for (const [pagePath, max] of [["/lahjat/alle-30-euroa", 30], ["/joululahja-alle-50-euroa", 50], ["/salainen-joulupukki-lahja", 30]] as const) {
      const list = selectLandingProducts(getLandingPage(pagePath)!, products);
      expect(list.every((p) => p.price <= max), pagePath).toBe(true);
    }
  });

  it("teen page has no alcohol or swearing", () => {
    const list = selectLandingProducts(getLandingPage("/joululahja-teinille")!, products);
    for (const p of list) expect(p.name.toLowerCase(), p.slug).not.toMatch(/kalja|alkoholi|saatana|aatana/);
  });
});

describe("landing pages: prerendered HTML", () => {
  it.each(landingPages.map((p) => [p.path] as const))("%s renders full HTML without JS", (pagePath) => {
    const page = byPath.get(pagePath)!;
    expect(page).toBeTruthy();
    const html = renderPageHtml(TEMPLATE, page, nav);
    const def = getLandingPage(pagePath)!;
    expect(html).toContain(`<link rel="canonical" href="https://huumorikauppa.fi${pagePath}" />`);
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toContain(`<title>${def.title.replace(/&/g, "&amp;")}</title>`);
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain('"@type":"FAQPage"');
    const productLinks = html.match(/href="\/tuote\//g) ?? [];
    expect(productLinks.length).toBeGreaterThanOrEqual(landingMinimi(pagePath));
    const landingLinks = new Set(
      [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]).filter((h) => h !== pagePath && landingSet.has(h)),
    );
    expect(landingLinks.size).toBeGreaterThanOrEqual(3);
    expect(html).toMatch(/href="\/kategoria\/[a-z-]+"/);
    expect(html).not.toContain("/kategoria/mukit");
  });

  it("Father's Day: menu, merged old pages and links between the two new pages", () => {
    const hrefs = FATHERS_DAY_MENU.map((m) => m.href);
    expect(hrefs.slice(0, 2)).toEqual(["/isanpaivalahja", "/hauska-isanpaivalahja"]);
    for (const h of hrefs) expect(landingSet.has(h), h).toBe(true);
    expect(LANDING_REDIRECTS["/isanpaiva-lahjat"]).toBe("/hauska-isanpaivalahja");
    expect(LANDING_REDIRECTS["/lahjat/isanpaiva"]).toBe("/hauska-isanpaivalahja");
    const general = getLandingPage("/isanpaivalahja")!;
    const humor = getLandingPage("/hauska-isanpaivalahja")!;
    expect(general.related).toContain("/hauska-isanpaivalahja");
    expect(humor.related).toContain("/isanpaivalahja");
    for (const p of [general, humor]) {
      expect(p.related).toContain("/joululahja-isalle");
      expect(p.related).toContain("/lahjat/isoisalle");
      expect(selectLandingProducts(p, products).length, p.path).toBeGreaterThanOrEqual(LANDING_MIN_PRODUCTS);
    }
    expect(getLandingPage("/joululahja-isalle")!.related).toEqual(expect.arrayContaining(["/isanpaivalahja", "/hauska-isanpaivalahja"]));
  });

  it("superseded and redirected paths are not prerendered", () => {
    for (const from of Object.keys(LANDING_REDIRECTS)) expect(byPath.has(from), from).toBe(false);
    for (const from of Object.keys(NOT_CREATED_LANDINGS)) expect(byPath.has(from), from).toBe(false);
  });

  it("Christmas deadline page is prerendered with FAQ and links to the gift guides", () => {
    const page = byPath.get(CHRISTMAS_DEADLINE_PATH)!;
    const html = renderPageHtml(TEMPLATE, page, nav);
    expect(html).toContain(CHRISTMAS_DEADLINE_PROMISE);
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('href="/joululahjat"');
    expect(html).toContain('href="/joululahja-isalle"');
  });

  it("no page links to the hidden mug category", () => {
    for (const p of pages) {
      const html = renderPageHtml(TEMPLATE, p, nav);
      expect(html, p.path).not.toContain('href="/kategoria/mukit"');
    }
  });
});

describe("routing, sitemap and redirects", () => {
  const sitemap = read("api/sitemap.js");
  const vercel = JSON.parse(read("vercel.json")) as { redirects: { source: string; destination: string; statusCode?: number; permanent?: boolean }[] };

  it("App.tsx routes every landing page and the deadline page", () => {
    const app = read("src/App.tsx");
    expect(app).toContain("LANDING_PATHS.map");
    expect(app).toContain("LANDING_REDIRECTS");
    expect(app).toContain("path={CHRISTMAS_DEADLINE_PATH}");
  });

  it("sitemap lists every landing page, the deadline page and no redirected path", () => {
    const listed = sitemap.slice(sitemap.indexOf("const LANDING_PATHS"), sitemap.indexOf("];", sitemap.indexOf("const LANDING_PATHS")));
    for (const p of LANDING_PATHS) expect(listed, p).toContain(`"${p}"`);
    expect(sitemap).toContain('"/joulun-viimeiset-tilauspaivat"');
    for (const from of Object.keys(LANDING_REDIRECTS)) {
      const slug = from.split("/").pop()!;
      expect(sitemap, from).not.toContain(`"${from}"`);
      expect(sitemap, from).not.toMatch(new RegExp(`"${slug}"`));
    }
    expect(sitemap).not.toMatch(/[äöå]"/);
    expect(sitemap).toContain('"ylojarvi"');
    expect(sitemap).toContain('"lempaala"');
    // Oma tausta: luonnokset rajataan omasta tuotelähteestä (is_active !== false).
    expect(sitemap).toContain("p.is_active !== false");
  });

  it("vercel.json has a 301 for every merged page and both raw and encoded umlaut paths", () => {
    for (const [from, to] of Object.entries(LANDING_REDIRECTS)) {
      const sources = [from];
      if (/[^\x20-\x7e]/.test(from)) sources.push(encodeURI(from));
      for (const source of sources) {
        const rule = vercel.redirects.find((r) => r.source === source);
        expect(rule, source).toBeTruthy();
        expect(rule!.destination).toBe(to);
        expect(rule!.statusCode ?? (rule!.permanent ? 308 : 0)).toBe(301);
      }
    }
  });

  it("no source file links to /kategoria/mukit", () => {
    const files = [
      "src/pages/Index.tsx",
      "src/pages/OfficeNotesPage.tsx",
      "src/components/layout/Header.tsx",
      "src/data/blogProducts.ts",
      "src/data/landingPages.ts",
      "src/data/landingRoutes.ts",
    ];
    for (const f of files) expect(read(f), f).not.toContain("/kategoria/mukit");
    // Footer listaa kategoriat datasta: piilotetut suodatetaan pois.
    expect(read("src/components/layout/Footer.tsx")).toMatch(/onPiilotettu|onKategoriasivu/);
  });

  it("content-graph slugs are ASCII", async () => {
    const { professions } = await import("@/data/professions");
    const { municipalities } = await import("@/data/municipalities");
    for (const s of [...professions, ...municipalities].map((x) => x.slug)) expect(s).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("tonnin seteli -laskeutumissivu", () => {
  const page = getLandingPage("/tonnin-seteli-paita")!;
  const TONNI_SLUGS = ["tonnin-seteli-t-paita", "se-oli-tonnin-seteli-t-paita", "tonnin-seteli-huppari", "se-oli-tonnin-seteli-huppari"];

  it("näyttää kaikki tonnin seteli -tuotteet ensin, ei mukia, vähintään 8 tuotetta", () => {
    expect(page).toBeTruthy();
    const list = selectLandingProducts(page, products);
    expect(list.length).toBeGreaterThanOrEqual(LANDING_MIN_PRODUCTS);
    expect(new Set(list.slice(0, 4).map((p) => p.slug))).toEqual(new Set(TONNI_SLUGS));
    expect(list.some((p) => p.slug === "tonnin-seteli-kahvikuppi")).toBe(false);
    for (const p of list) expect(looksLikeMug(p), p.slug).toBe(false);
  });

  it("ensimmäinen virke kertoo, mikä vitsi on, ja sivu linkittää tuotesivuille", () => {
    expect(page.intro[0]).toMatch(/^Se oli tonnin seteli on suomalainen meemilausahdus/);
    expect(page.faqs.length).toBeGreaterThanOrEqual(4);
    expect(page.faqs.length).toBeLessThanOrEqual(5);
    expect((page.extraLinks ?? []).map((l) => l.href)).toEqual(
      expect.arrayContaining(["/tuote/tonnin-seteli-t-paita", "/tuote/se-oli-tonnin-seteli-t-paita"]),
    );
    const html = renderPageHtml(TEMPLATE, byPath.get(page.path)!, nav);
    for (const slug of TONNI_SLUGS) expect(html).toContain(`href="/tuote/${slug}"`);
  });

  it("joulusivut nostavat sivun ja tuotteet (nosto ja linkki)", () => {
    for (const path of ["/joululahjat", "/joululahja-isalle", "/joululahja-miehelle-jolla-on-kaikki"]) {
      const p = getLandingPage(path)!;
      expect(p.related, path).toContain("/tonnin-seteli-paita");
      expect(p.spotlight?.links.map((l) => l.href), path).toContain("/tonnin-seteli-paita");
      expect(p.spotlight!.text).not.toMatch(/[–—]/);
      for (const re of BANNED) expect(p.spotlight!.text, `${path} ${re}`).not.toMatch(re);
      const html = renderPageHtml(TEMPLATE, byPath.get(path)!, nav);
      expect(html, path).toContain('href="/tonnin-seteli-paita"');
      expect(html, path).toContain('href="/tuote/tonnin-seteli-t-paita"');
    }
    // /joululahjat näyttää tuotteet myös omassa listassaan
    const xmas = selectLandingProducts(getLandingPage("/joululahjat")!, products).map((p) => p.slug);
    for (const slug of TONNI_SLUGS) expect(xmas).toContain(slug);
  });

  it("etusivu nostaa sivun ja t-paidan", () => {
    const index = read("src/pages/Index.tsx");
    expect(index).toContain("TONNIN_SETELI_PATH");
    expect(index).toContain('/tuote/tonnin-seteli-t-paita');
  });
});
