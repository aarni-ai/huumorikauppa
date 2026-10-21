import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { GIFT_ROUTE_SLUGS, buildPrerenderPages, buildSiteNav, normalizeProducts, type ProductRow } from "./pages";
import { STATIC_PAGE_META, type StaticPageMeta } from "../staticPageMeta";
import { buildLlmsFullTxt, buildLlmsTxt } from "../llms";

const rows: ProductRow[] = [
  { id: "1", slug: "amatimies-t-paita", name: "Amatimies | T-Paita", category: "t-paidat", price: "24.90", description: "Amatimies isälle.", images: ["https://images-api.printify.com/a.jpg"], stock: 100 },
  { id: "2", slug: "kalamies-huppari", name: "Kalamies | Huppari", category: "hupparit", price: 49.9, description: "Kalastus", images: [], stock: 100 },
  { id: "3", slug: "luonnos", name: "Luonnos", category: "t-paidat", price: 24.9, is_active: false },
  { id: "4", slug: "kahvimuki", name: "Kahvimuki", category: "mukit", price: 19.9 },
];

const products = normalizeProducts(rows);
const pages = buildPrerenderPages({ products });
const byPath = new Map(pages.map((p) => [p.path, p]));

describe("normalizeProducts", () => {
  it("uses the same filter as the shop: drafts and hidden categories (mukit) are excluded", () => {
    expect(products.map((p) => p.slug)).toEqual(["amatimies-t-paita", "kalamies-huppari"]);
    expect(products[0].price).toBe(24.9);
  });
});

describe("buildPrerenderPages", () => {
  it("has unique paths", () => {
    expect(new Set(pages.map((p) => p.path)).size).toBe(pages.length);
  });

  it("covers the key indexable routes and skips the hidden mug category", () => {
    for (const p of [
      "/",
      "/kaikki-tuotteet",
      "/joululahjat",
      "/kategoria/t-paidat",
      "/tuote/amatimies-t-paita",
      "/blogi",
      "/usein-kysytyt-kysymykset",
      "/toimitusehdot",
      "/palautusehdot",
      "/aitienpaiva",
      "/lahjat/50-vuotiaalle-miehelle",
    ]) {
      expect(byPath.has(p), p).toBe(true);
    }
    expect(byPath.has("/kategoria/mukit")).toBe(false);
    expect(byPath.has("/tuote/kahvimuki")).toBe(false);
    expect(byPath.has("/tuote/luonnos")).toBe(false);
    expect(pages.some((p) => p.path.startsWith("/blogi/"))).toBe(true);
  });

  it("every gift route is a real route in App.tsx", () => {
    const app = fs.readFileSync(path.resolve(__dirname, "../../App.tsx"), "utf8");
    for (const slug of GIFT_ROUTE_SLUGS) {
      expect(app, slug).toContain(`path="/${slug}"`);
      expect(byPath.has(`/${slug}`), slug).toBe(true);
    }
  });

  it("every page has a title, description, single H1 text and breadcrumbs (except home)", () => {
    for (const p of pages) {
      expect(p.title, p.path).toBeTruthy();
      expect(p.description, p.path).toBeTruthy();
      expect(p.h1, p.path).toBeTruthy();
      if (p.path !== "/") expect(p.breadcrumbs.length, p.path).toBeGreaterThan(1);
      expect(() => JSON.parse(JSON.stringify(p.jsonLd))).not.toThrow();
    }
  });

  it("product pages carry Product JSON-LD, price and FAQ", () => {
    const page = byPath.get("/tuote/amatimies-t-paita")!;
    expect(page.title).toBe("Amatimies | T-Paita | Huumorikauppa");
    expect(page.price).toBe(24.9);
    expect(page.ogType).toBe("product");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = page.jsonLd.find((j) => j["@type"] === "Product") as Record<string, any>;
    expect(product.sku).toBe("1");
    expect(product.offers.price).toBe("24.90");
    expect(page.faqs!.length).toBeGreaterThan(0);
    expect(page.breadcrumbs.map((b) => b.name)).toEqual(["Etusivu", "T-Paidat", "Amatimies | T-Paita"]);
  });

  it("category pages list their products and have FAQ JSON-LD", () => {
    const page = byPath.get("/kategoria/t-paidat")!;
    expect(page.products!.map((p) => p.slug)).toEqual(["amatimies-t-paita"]);
    expect(page.jsonLd.map((j) => j["@type"])).toEqual(["CollectionPage", "FAQPage"]);
  });

  it("uses component HTML for content pages when provided", () => {
    const withHtml = buildPrerenderPages({ products, componentHtml: { "/toimitusehdot": "<p>Ehdot</p>" } });
    expect(withHtml.find((p) => p.path === "/toimitusehdot")!.contentHtml).toBe("<p>Ehdot</p>");
  });

  it("renders without product data (missing env at build)", () => {
    const noProducts = buildPrerenderPages({ products: [] });
    expect(noProducts.some((p) => p.path.startsWith("/tuote/"))).toBe(false);
    expect(noProducts.some((p) => p.path === "/joululahjat")).toBe(true);
  });
});

describe("STATIC_PAGE_META copy rules", () => {
  it("titles fit in 60 characters and copy has no em/en dashes", () => {
    for (const [p, meta] of Object.entries(STATIC_PAGE_META) as [string, StaticPageMeta][]) {
      expect(meta.title.length, p).toBeLessThanOrEqual(60);
      for (const text of [meta.title, meta.description, meta.h1, meta.intro ?? ""]) {
        expect(text, p).not.toMatch(/[–—]/);
      }
    }
  });
});

describe("buildSiteNav", () => {
  it("only lists categories that have products", () => {
    const nav = buildSiteNav(products);
    const hrefs = nav.main.map((l) => l.href);
    expect(hrefs).toContain("/kategoria/t-paidat");
    expect(hrefs).not.toContain("/kategoria/mukit");
    expect(hrefs).not.toContain("/kategoria/laukut");
  });
});

describe("llms.txt", () => {
  const short = buildLlmsTxt(products);
  const full = buildLlmsFullTxt(products);
  it("states delivery, returns and contact facts without dashes", () => {
    expect(short).toContain("3-10 arkipäivää");
    expect(short).toContain("6,90 €");
    expect(short).toContain("Yli 79 €");
    expect(short).toContain("14 päivän peruutusoikeus");
    expect(short).toContain("huumorikauppa@gmail.com");
    expect(short).toContain("Mukeja ei tällä hetkellä myydä.");
    expect(short).not.toContain("/kategoria/mukit");
    expect(short + full).not.toMatch(/[–—]/);
  });
  it("lists products with prices in the full version", () => {
    expect(full).toContain("- Amatimies | T-Paita, 24,90 €: https://huumorikauppa.fi/tuote/amatimies-t-paita");
  });
});
