import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import productSlugs from "@/test/fixtures/productSlugs.json";
import { YRITYS_ALAT, YRITYS_ALA_POLUT } from "./yritysAlat";
import { AUKOT_SLUGIT } from "./aukkomallisto2026";
import { yritysAlaFaqs } from "./yritysAlaSivu";
import { LANDING_REDIRECTS } from "./landingRoutes";
import { LOGOPAITA_HINTA, LOGOPAITA_MIN_KPL } from "../../api/_lib/logopaita.js";
import { YRITYS_JOULU_TEKSTI } from "./yrityksetPage";

const DASHES = /[–—]/;
const HEDGES = /(?<!\p{L})(saattaa|saattavat|ehkä|todennäköisesti|pyrimme)(?!\p{L})/iu;
const slugit = new Set(productSlugs as string[]);
// Kilpailija-aukkojen mallisto (2.11.2026) tuodaan kauppaan erikseen: sallitaan, mutta fixturesta pitää löytyä vähintään 8.
const aukot = new Set(AUKOT_SLUGIT);
const root = path.resolve(__dirname, "../..");

describe("yritysten alakohtaiset sivut 2.11.2026", () => {
  it("9 alaa luvatuilla osoitteilla", () => {
    expect(YRITYS_ALA_POLUT).toEqual([
      "/yritykset/rakennus", "/yritykset/insinoorit", "/yritykset/vpk", "/yritykset/terveys", "/yritykset/kauneus",
      "/yritykset/it", "/yritykset/mainos", "/yritykset/tapahtumat", "/yritykset/urheiluseurat",
    ]);
  });

  it.each(YRITYS_ALAT.map((a) => [a.slug, a] as const))("%s: 8-12 myynnissä olevaa tuotetta, tekstisäännöt, SEO-rajat", (_s, ala) => {
    expect(ala.tuotteet.length).toBeGreaterThanOrEqual(8);
    expect(ala.tuotteet.length).toBeLessThanOrEqual(12);
    expect(new Set(ala.tuotteet).size).toBe(ala.tuotteet.length);
    for (const s of ala.tuotteet) expect(slugit.has(s) || aukot.has(s), s).toBe(true);
    expect(ala.tuotteet.filter((s) => slugit.has(s)).length).toBeGreaterThanOrEqual(8);
    const teksti = JSON.stringify({ ...ala, tuotteet: [], faqs: yritysAlaFaqs(ala) });
    expect(teksti).not.toMatch(DASHES);
    expect(teksti).not.toMatch(HEDGES);
    expect(teksti).not.toMatch(/suosituin|myydyin|suomen paras/i);
    expect(ala.metaTitle.length).toBeLessThan(60);
    expect(ala.description.length).toBeLessThan(155);
    expect(ala.ideat.length).toBeGreaterThanOrEqual(3);
    expect(LANDING_REDIRECTS[ala.katso.href]).toBeUndefined();
  });

  it("oma logo 29,90 €/kpl vähintään 10 kpl ja joulutakaraja kysymyksissä", () => {
    expect(LOGOPAITA_HINTA).toBe(29.9);
    expect(LOGOPAITA_MIN_KPL).toBe(10);
    const faq = JSON.stringify(yritysAlaFaqs(YRITYS_ALAT[0]));
    expect(faq).toContain("29,90 €/kpl");
    expect(faq).toContain(YRITYS_JOULU_TEKSTI);
  });

  it("sivut ovat sitemapissa, reitissä ja esirenderöinnissä", () => {
    const sitemap = fs.readFileSync(path.join(root, "api/sitemap.js"), "utf8");
    for (const p of YRITYS_ALA_POLUT) expect(sitemap, p).toContain(`loc: "${p}"`);
    expect(fs.readFileSync(path.join(root, "src/App.tsx"), "utf8")).toContain('<Route path="/yritykset/:ala"');
    expect(fs.readFileSync(path.join(root, "src/seo/prerender/pages.ts"), "utf8")).toContain("...buildBusinessVerticalPages(products)");
  });
});
