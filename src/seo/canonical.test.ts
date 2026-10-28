/**
 * Canonical-korjaus 28.10.2026 (KASVU-RAPORTTI.md "Canonical-korjaus"). Search Console raportoi 57 sivua
 * "Kaksoiskappale, Google valitsi eri kanonisen sivun kuin käyttäjä" (/lahjat/... ja /kategoria/...).
 * Testi varmistaa, että indeksoitavat /lahjat/- ja /kategoria/-sivut eivät taas ala muistuttaa toisiaan:
 * oma otsikko, H1, johdanto, UKK ja tuoteruudukko, ja yhdistetyt sivut ovat vain 301-ohjauksia.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import snapshot from "@/test/fixtures/products-snapshot.json";
import { buildPrerenderPages, buildSiteNav, normalizeProducts, type ProductRow } from "./prerender/pages";
import { renderPageHtml } from "./prerender/html";
import { LANDING_REDIRECTS } from "@/data/landingRoutes";
import { YHDISTETYT_KATEGORIAT, kategoriaPolku } from "@/lib/hiddenCategories";
import { kannanRivit } from "@/test/euReititysMinimi";

const ROOT = path.resolve(__dirname, "../..");
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), "utf8");

const products = normalizeProducts(kannanRivit(snapshot as unknown as ProductRow[]));
const pages = buildPrerenderPages({ products });
const nav = buildSiteNav(products);
const TEMPLATE = read("index.html");

const isFamily = (p: string) => p.startsWith("/lahjat/") || p.startsWith("/kategoria/");
const family = pages.filter((p) => isFamily(p.path));
/** Lahja- ja kategoriasivut, joihin perheen sivuja verrataan (ei tuote-, blogi- tai sisältösivuja). */
const giftLike = pages.filter(
  (p) => !/^\/(tuote|blogi|kaupunki|ammatti|harrastus|murre)\//.test(p.path) && (p.products?.length ?? 0) > 0,
);
const introText = (p: (typeof pages)[number]) => (p.intro ?? []).join(" ").trim();
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

describe("canonical: /lahjat/ ja /kategoria/ -sivut ovat keskenään erilaisia", () => {
  it("perheessä on sivuja ja jokainen niistä on indeksoitava ja oikealla canonicalilla", () => {
    expect(family.length).toBeGreaterThanOrEqual(15);
    for (const p of family) {
      const html = renderPageHtml(TEMPLATE, p, nav);
      expect(html, p.path).toContain(`<link rel="canonical" href="https://huumorikauppa.fi${p.path}" />`);
      expect(html, p.path).not.toMatch(/<meta name="robots" content="[^"]*noindex/);
    }
  });

  it("kahdella indeksoitavalla /lahjat/- tai /kategoria/-sivulla ei ole samaa otsikkoa, H1:tä tai johdantoa", () => {
    for (const key of ["title", "h1", "description"] as const) {
      const values = family.map((p) => norm(p[key] ?? ""));
      const dupes = values.filter((v, i) => values.indexOf(v) !== i);
      expect(dupes, key).toEqual([]);
    }
    const intros = family.map((p) => norm(introText(p)));
    for (const [i, intro] of intros.entries()) {
      expect(intro.length, family[i].path).toBeGreaterThan(0);
      expect(intros.indexOf(intro), `${family[i].path}: sama johdanto kuin ${family[intros.indexOf(intro)].path}`).toBe(i);
    }
    // Ensimmäinen kappale ei toistu muilla lahja- tai kategoriasivuilla (ei templaattia nimen vaihdolla).
    const firsts = giftLike.map((p) => norm(p.intro?.[0] ?? "")).filter(Boolean);
    for (const p of family) {
      const first = norm(p.intro?.[0] ?? "");
      expect(firsts.filter((f) => f === first).length, p.path).toBe(1);
    }
  });

  it("otsikot ja H1:t eivät ole samoja muiden lahjasivujen kanssa", () => {
    for (const p of family) {
      for (const other of giftLike) {
        if (other.path === p.path) continue;
        expect(norm(other.title), `${p.path} vs ${other.path}`).not.toBe(norm(p.title));
        expect(norm(other.h1), `${p.path} vs ${other.path}`).not.toBe(norm(p.h1));
      }
    }
  });

  it("jokaisella sivulla on oma UKK (3-6 kysymystä) ja FAQPage-JSON-LD esirenderöidyssä HTML:ssä", () => {
    const firstQuestions = new Map<string, string>();
    for (const p of family) {
      const faqs = p.faqs ?? [];
      expect(faqs.length, p.path).toBeGreaterThanOrEqual(3);
      expect(faqs.length, p.path).toBeLessThanOrEqual(6);
      const key = faqs.map((f) => norm(f.q)).join("|");
      expect(firstQuestions.get(key), `${p.path}: sama UKK kuin ${firstQuestions.get(key)}`).toBeUndefined();
      firstQuestions.set(key, p.path);
      const html = renderPageHtml(TEMPLATE, p, nav);
      expect(html, p.path).toContain('"@type":"FAQPage"');
      expect(html, p.path).toContain(faqs[0].q.replace(/&/g, "&amp;").replace(/"/g, "&quot;"));
    }
  });

  it("tuoteruudukko eroaa muista lahjasivuista (12 ensimmäistä tuotetta eivät ole samat samassa järjestyksessä)", () => {
    const head = (p: (typeof pages)[number]) => (p.products ?? []).slice(0, 12).map((x) => x.slug).join(",");
    for (const p of family) {
      expect((p.products ?? []).length, p.path).toBeGreaterThanOrEqual(8);
      for (const other of giftLike) {
        if (other.path === p.path) continue;
        expect(head(other), `${p.path} ja ${other.path}: sama tuoteruudukko`).not.toBe(head(p));
      }
    }
  });
});

describe("canonical: yhdistetyt sivut ovat vain 301-ohjauksia", () => {
  const sources = Object.keys(LANDING_REDIRECTS);
  const vercel = JSON.parse(read("vercel.json")) as { redirects: { source: string; destination: string }[] };

  it("ohjattuja polkuja ei esirenderöidä, ohjaus ei ketjuunnu ja kohde on olemassa", () => {
    const byPath = new Set(pages.map((p) => p.path));
    for (const [from, to] of Object.entries(LANDING_REDIRECTS)) {
      expect(byPath.has(from), from).toBe(false);
      expect(LANDING_REDIRECTS[to], `${from} -> ${to} ketjuuntuu`).toBeUndefined();
      expect(vercel.redirects.some((r) => r.source === to), `${to} ohjautuu itse`).toBe(false);
      if (!to.startsWith("/blogi/")) expect(byPath.has(to), `${from} -> ${to}`).toBe(true);
    }
  });

  it("yhdistetyt kategoriat ohjautuvat ja tuotteiden murupolku osoittaa kohdesivuun", () => {
    for (const [slug, to] of Object.entries(YHDISTETYT_KATEGORIAT)) {
      expect(LANDING_REDIRECTS[`/kategoria/${slug}`], slug).toBe(to);
      expect(kategoriaPolku(slug)).toBe(to);
    }
    expect(kategoriaPolku("t-paidat")).toBe("/kategoria/t-paidat");
  });

  it("mikään esirenderöity sivu ei linkitä ohjattuun polkuun", () => {
    const pattern = new RegExp(`href="(${sources.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})"`);
    for (const p of pages) {
      const html = renderPageHtml(TEMPLATE, p, nav);
      expect(html.match(pattern)?.[1], p.path).toBeUndefined();
    }
  });

  it("lähdekoodin linkit eivät osoita ohjattuihin polkuihin", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) walk(rel);
        else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) files.push(rel);
      }
    };
    walk("src");
    const allowed = new Set(["src/data/landingRoutes.ts", "src/lib/hiddenCategories.ts"]);
    for (const f of files) {
      if (allowed.has(f)) continue;
      const src = read(f);
      for (const s of sources) {
        // Linkki: "polku", markdown-linkki ](polku) tai `polku` täsmälleen.
        for (const q of [`"${s}"`, `](${s})`, `\`${s}\``]) expect(src.includes(q), `${f}: ${q}`).toBe(false);
      }
    }
  });

  it("sivukartta listaa vain kategoriat, joilla on oma sivu", () => {
    const sitemap = read("api/sitemap.js");
    const cats = sitemap.slice(sitemap.indexOf("const CATEGORIES"), sitemap.indexOf(";", sitemap.indexOf("const CATEGORIES")));
    for (const slug of Object.keys(YHDISTETYT_KATEGORIAT)) expect(cats, slug).not.toContain(`"${slug}"`);
    expect(cats).toContain('"t-paidat"');
    expect(cats).toContain('"hupparit"');
  });
});
