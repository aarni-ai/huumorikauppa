/**
 * Abipaitojen kaupunkisivut /abipaidat/<slug> (3.11.2026, src/data/abikaupungit): tekstien eroavuus (5 sanan jaksot),
 * sanamäärä, tekstisäännöt, penkkaripäivä ja takaraja vakioista, UKK ja FAQPage, esirenderöinti, reitti, sivukartta,
 * canonical ja sisäiset linkit.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  ABIKAUPUNKI_SIVUT, ABIKAUPUNKI_SLUGIT, ABIKAUPUNKI_LINKIT, ABIKAUPUNKI_POLKU, ABI_TYOKALU, abiKaupunkiSivu,
} from "@/data/abikaupungit";
import { ABI_AIKATAULU, ABI_VIIMEINEN_TILAUSPAIVA, PENKKARIT_2027, RYHMA_NIMI_MAX, SELKA_NIMI_MAX } from "@/data/ryhmapaidat";
import { buildPrerenderPages, buildSiteNav } from "@/seo/prerender/pages";
import { renderPageHtml } from "@/seo/prerender/html";
import { LANDING_REDIRECTS } from "@/data/landingRoutes";

const ROOT = path.resolve(__dirname, "../..");
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), "utf8");

const sanat = (t: string) => t.toLocaleLowerCase("fi").match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) ?? [];
function jaksot(t: string, n = 5): Set<string> {
  const w = sanat(t);
  const s = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(" "));
  return s;
}
/** Yhteisten 5 sanan jaksojen osuus lyhyemmän tekstin jaksoista. */
function yhteinenOsuus(a: string, b: string): number {
  const A = jaksot(a);
  const B = jaksot(b);
  let n = 0;
  for (const x of A) if (B.has(x)) n++;
  return n / Math.min(A.size, B.size);
}

const kaikkiTeksti = (s: (typeof ABIKAUPUNKI_SIVUT)[number]) =>
  [s.title, s.description, s.h1, ...s.intro, ...s.osiot.flatMap((o) => [o.otsikko, ...o.teksti]), s.yhteinen.heading,
    ...s.yhteinen.paragraphs, ...s.faqs.flatMap((f) => [f.q, f.a])].join("\n");

const pages = buildPrerenderPages({ products: [] });
const nav = buildSiteNav([]);
const TEMPLATE = read("index.html");
const iso = (d: string) => { const [y, m, p] = d.split("-").map(Number); return `${p}.${m}.${y}`; };

describe("abipaitojen kaupunkisivut", () => {
  it("20 kaupunkia luvatuilla ASCII-slugeilla, kaikilla sisältö", () => {
    expect([...ABIKAUPUNKI_SLUGIT]).toEqual([
      "helsinki", "espoo", "tampere", "vantaa", "oulu", "turku", "jyvaskyla", "kuopio", "lahti", "pori", "joensuu",
      "lappeenranta", "hameenlinna", "vaasa", "seinajoki", "rovaniemi", "mikkeli", "kotka", "salo", "porvoo",
    ]);
    expect(ABIKAUPUNKI_SIVUT.map((s) => s.slug)).toEqual([...ABIKAUPUNKI_SLUGIT]);
    for (const s of ABIKAUPUNKI_SIVUT) expect(s.slug).toMatch(/^[a-z]+$/);
  });

  it("tekstien eroavuus: 5 sanan jaksoista alle 15 % yhteisiä minkä tahansa kahden sivun välillä", () => {
    for (const [i, a] of ABIKAUPUNKI_SIVUT.entries()) {
      for (const b of ABIKAUPUNKI_SIVUT.slice(i + 1)) {
        expect(yhteinenOsuus(a.omaTeksti, b.omaTeksti), `${a.slug} ja ${b.slug}`).toBeLessThan(0.15);
      }
    }
    // Mallipohjan tunnistus: kun kaupungin nimi poistetaan, ensimmäinen kappale ei toistu toisella sivulla.
    const ilmanNimea = ABIKAUPUNKI_SIVUT.map((s) => s.intro[0].replace(new RegExp(s.kaupunki.slice(0, 4) + "\\p{L}*", "gu"), "X"));
    expect(new Set(ilmanNimea).size).toBe(ABIKAUPUNKI_SIVUT.length);
  });

  it("otsikko, H1 ja kuvaus ovat sivukohtaisia", () => {
    for (const key of ["title", "h1", "description"] as const) {
      expect(new Set(ABIKAUPUNKI_SIVUT.map((s) => s[key])).size, key).toBe(ABIKAUPUNKI_SIVUT.length);
    }
  });

  for (const s of ABIKAUPUNKI_SIVUT) {
    describe(s.path, () => {
      it("sanamäärä: oma teksti 200-350 sanaa", () => {
        const n = sanat(s.omaTeksti).length;
        expect(n).toBeGreaterThanOrEqual(200);
        expect(n).toBeLessThanOrEqual(350);
      });

      it("ajatusviivattomuus ja tekstisäännöt", () => {
        const t = kaikkiTeksti(s);
        expect(t).not.toMatch(/[–—]/);
        expect(t).not.toMatch(/(?<!\p{L})(saattaa|saattavat|ehkä|todennäköisesti|pyrimme|voi olla että|mahdollisesti)(?!\p{L})/iu);
        expect(t).not.toMatch(/suosituin|suosituimpi|suomen paras|halvin|paras hinta|nopein|myydyin|painetaan suomessa|seniori/i);
        // Lukioita ei nimetä (esim. "Kallion lukio").
        expect(t).not.toMatch(/\p{Lu}\p{L}+n (yhteis)?lukio/u);
      });

      it("hakuotsikko alle 60 ja kuvaus alle 155 merkkiä", () => {
        expect(s.title.length).toBeLessThan(60);
        expect(s.title).toMatch(/ \| Huumorikauppa$/);
        expect(s.description.length).toBeLessThan(155);
        expect(s.description.length).toBeGreaterThan(70);
      });

      it("takaraja- ja penkkaripäivä vakioista", () => {
        expect(s.omaTeksti).toContain(`to ${iso(ABI_VIIMEINEN_TILAUSPAIVA)}`);
        expect(s.omaTeksti).toContain(iso(PENKKARIT_2027));
        expect(s.omaTeksti).toContain("to 14.1.2027");
        expect(s.omaTeksti).toContain("18.2.2027");
        expect(s.yhteinen.paragraphs).toContain(ABI_AIKATAULU);
        expect(s.ryhma.takaraja).toBe(ABI_VIIMEINEN_TILAUSPAIVA);
        expect(s.faqs[0].a).toBe(ABI_AIKATAULU);
      });

      it("UKK 3-5 kysymystä, oma kysymys mukana", () => {
        expect(s.faqs.length).toBeGreaterThanOrEqual(3);
        expect(s.faqs.length).toBeLessThanOrEqual(5);
        expect(s.ukk.length).toBeGreaterThanOrEqual(1);
        expect(s.faqs[0].q).toContain(s.inessiivi);
      });

      it("suunnittelutyökalun esimerkki mahtuu rajoihin", () => {
        expect(s.ryhma.tyyppi).toBe("abi");
        expect(s.esimerkki.nimi.length).toBeLessThanOrEqual(RYHMA_NIMI_MAX);
        expect(s.esimerkki.teksti.length).toBeLessThanOrEqual(28);
        for (const j of s.esimerkki.jasenet) expect(j.length).toBeLessThanOrEqual(SELKA_NIMI_MAX);
      });

      it("sisäiset linkit: 2-3 lähikaupunkia, takaisin /abipaidat ja ryhmätyökaluun", () => {
        expect(s.lahella.length).toBeGreaterThanOrEqual(2);
        expect(s.lahella.length).toBeLessThanOrEqual(3);
        expect(s.lahella).not.toContain(s.slug);
        expect(s.lahellaLinkit.map((l) => l.href)).toEqual(s.lahella.map(ABIKAUPUNKI_POLKU));
        const page = pages.find((p) => p.path === s.path)!;
        const hrefs = (page.sections ?? []).flatMap((x) => x.links ?? []).map((l) => l.href);
        expect(hrefs).toContain("/abipaidat");
        expect(hrefs).toContain(ABI_TYOKALU.href);
        for (const l of s.lahella) expect(hrefs).toContain(ABIKAUPUNKI_POLKU(l));
        for (const h of hrefs) expect(LANDING_REDIRECTS[h.split("#")[0]], h).toBeUndefined();
      });

      it("esirenderöinti: canonical, indeksoitava, FAQPage ja murupolku", () => {
        const page = pages.find((p) => p.path === s.path)!;
        expect(page).toBeDefined();
        expect(page.title).toBe(s.title);
        expect(page.faqs).toEqual(s.faqs);
        const html = renderPageHtml(TEMPLATE, page, nav);
        expect(html).toContain(`<link rel="canonical" href="https://huumorikauppa.fi${s.path}" />`);
        expect(html).not.toMatch(/<meta name="robots" content="[^"]*noindex/);
        expect(html).toContain('"@type":"FAQPage"');
        expect(html).toContain("BreadcrumbList");
        expect(abiKaupunkiSivu(s.slug)).toBe(s);
      });
    });
  }

  it("/abipaidat linkittää kaikkiin kaupunkisivuihin (React ja esirenderöinti)", () => {
    expect(ABIKAUPUNKI_LINKIT.map((l) => l.href)).toEqual(ABIKAUPUNKI_SLUGIT.map(ABIKAUPUNKI_POLKU));
    const abi = pages.find((p) => p.path === "/abipaidat")!;
    const hrefs = (abi.sections ?? []).flatMap((x) => x.links ?? []).map((l) => l.href);
    for (const s of ABIKAUPUNKI_SIVUT) expect(hrefs).toContain(s.path);
    expect(read("src/pages/RyhmaPaitaPage.tsx")).toContain("ABIKAUPUNKI_LINKIT");
    expect(read("src/pages/RyhmaPaitaPage.tsx")).toContain('id="suunnittele"');
  });

  it("sivukartta: jokainen kaupunkisivu samassa järjestyksessä, reitti App.tsx:ssä", () => {
    const sitemap = read("api/sitemap.js");
    const loyt = [...sitemap.matchAll(/loc: "\/abipaidat\/([a-z]+)"/g)].map((m) => m[1]);
    expect(loyt).toEqual([...ABIKAUPUNKI_SLUGIT]);
    expect(read("src/App.tsx")).toContain('<Route path="/abipaidat/:kaupunki"');
    expect(abiKaupunkiSivu("tuntematon")).toBeUndefined();
  });
});
