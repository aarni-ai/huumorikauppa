/**
 * Search Consolen rakenteisen datan tarkistus koko esirenderöintiputkelle: tuotesivut, kategoria- ja
 * listaussivut, etusivu ja blogi. Sivut rakennetaan samoilla funktioilla kuin buildissa
 * (buildPrerenderPages + renderPageHtml), ja JSON-LD jäsennetään valmiista HTML:stä.
 */
import { describe, expect, it } from "vitest";
import { buildPrerenderPages, buildSiteNav, normalizeProducts, type ProductRow } from "./prerender/pages";
import { renderPageHtml } from "./prerender/html";
import { buildProductJsonLd, poistaPitkatViivat, serializeJsonLd } from "./structuredData";
import { RETURNS } from "./site";
import {
  ILMAINEN_TOIMITUS_RAJA,
  KASITTELYAIKA_MAX_ARKIPAIVAA,
  KASITTELYAIKA_MIN_ARKIPAIVAA,
  KULJETUSAIKA_MAX_ARKIPAIVAA,
  KULJETUSAIKA_MIN_ARKIPAIVAA,
  TOIMITUSAIKA_MAX_ARKIPAIVAA,
  TOIMITUSAIKA_MIN_ARKIPAIVAA,
  TOIMITUSMAKSU,
} from "../config/toimitus";
import { extractJsonLd, flattenNodes, validateProductPage } from "../../scripts/tuotedata-validointi.mjs";

const TEMPLATE = `<!doctype html><html lang="fi"><head><title>x</title><meta name="description" content="x"><link rel="canonical" href="https://huumorikauppa.fi/" /></head><body><div id="root"></div></body></html>`;

const rows: ProductRow[] = [
  { id: "p1", slug: "tonnin-seteli-t-paita", name: "Tonnin seteli | T-Paita", category: "t-paidat", price: "24.90", description: "Se oli tonnin seteli.", images: ["https://images-api.printify.com/a.jpg"], stock: 100 },
  { id: "p2", slug: "made-in-espoo-hauska-t-paita", name: "Made in Espoo – hauska t-paita", category: "t-paidat", price: 24.9, description: "Made in Espoo — alkuperäinen espoolainen tuote.", images: ["https://images-api.printify.com/b.jpg"], stock: 100 },
  { id: "p3", slug: "tonnin-seteli-peitto", name: "Tonnin seteli | Peitto", category: "peitot", price: 89.9, description: "Lämmin peitto.", images: ["https://images-api.printify.com/c.jpg"], stock: 10 },
  { id: "p4", slug: "loppunut-huppari", name: "Loppunut | Huppari", category: "hupparit", price: 49.9, description: "Huppari.", images: ["https://images-api.printify.com/d.jpg"], stock: 0 },
  { id: "p5", slug: "oma-teksti-t-paita", name: "Oma teksti | T-Paita", category: "t-paidat", price: 29.9, description: "Paita omalla tekstillä.", images: ["https://images-api.printify.com/e.jpg"], stock: 100 },
  { id: "p6", slug: "tasan-raja-huppari", name: "Tasan raja | Huppari", category: "hupparit", price: ILMAINEN_TOIMITUS_RAJA, description: "Huppari.", images: ["https://images-api.printify.com/f.jpg"], stock: 5 },
];

const products = normalizeProducts(rows);
const pages = buildPrerenderPages({ products });
const nav = buildSiteNav(products);
const htmlByPath = new Map(pages.map((p) => [p.path, renderPageHtml(TEMPLATE, p, nav)]));
const expectedDeliveryDays = { min: TOIMITUSAIKA_MIN_ARKIPAIVAA, max: TOIMITUSAIKA_MAX_ARKIPAIVAA };
const expectedShipping = { fee: TOIMITUSMAKSU, freeThreshold: ILMAINEN_TOIMITUS_RAJA };

type Node = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function nodesOf(html: string): Node[] {
  const blocks = extractJsonLd(html);
  for (const b of blocks) expect(b.error).toBeUndefined();
  return blocks.flatMap((b: { data?: unknown }) => flattenNodes(b.data));
}

function allObjects(html: string): Node[] {
  const out: Node[] = [];
  const visit = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") {
      out.push(v as Node);
      Object.values(v).forEach(visit);
    }
  };
  extractJsonLd(html).forEach((b: { data?: unknown }) => visit(b.data));
  return out;
}

function productOf(slug: string): Node {
  const products = nodesOf(htmlByPath.get(`/tuote/${slug}`)!).filter((n) => n["@type"] === "Product");
  expect(products).toHaveLength(1);
  return products[0];
}

describe("rakenteinen data: tuotesivut", () => {
  for (const r of rows) {
    it(`${r.slug}: täsmälleen yksi kelvollinen Product`, () => {
      const html = htmlByPath.get(`/tuote/${r.slug}`);
      expect(html).toBeDefined();
      const personalised = r.slug === "oma-teksti-t-paita";
      const res = validateProductPage(html!, { expectedDeliveryDays, expectedShipping, personalised });
      expect(res.errors).toEqual([]);
      expect(res.products).toBe(1);
      expect(res.personalised).toBe(personalised);
    });
  }

  it("Product-kentät: name, image, description, sku, brand Huumorikauppa", () => {
    const p = productOf("tonnin-seteli-t-paita");
    expect(p.name).toBe("Tonnin seteli | T-Paita");
    expect(p.sku).toBe("p1");
    expect(p.brand).toEqual({ "@type": "Brand", name: "Huumorikauppa" });
    expect(p.description).toBeTruthy();
    expect(p.image[0]).toMatch(/^https:\/\//);
  });

  it("Offer: hinta kahdella desimaalilla, EUR, NewCondition, myyjä ja tuleva priceValidUntil", () => {
    const o = productOf("tonnin-seteli-t-paita").offers;
    expect(o.price).toBe("24.90");
    expect(o.priceCurrency).toBe("EUR");
    expect(o.url).toBe("https://huumorikauppa.fi/tuote/tonnin-seteli-t-paita");
    expect(o.itemCondition).toBe("https://schema.org/NewCondition");
    expect(o.seller.name).toBe("Huumorikauppa");
    expect(Date.parse(o.priceValidUntil)).toBeGreaterThan(Date.now());
  });

  it("saatavuus seuraa varastoa: stock 0 -> OutOfStock, muuten InStock", () => {
    expect(productOf("loppunut-huppari").offers.availability).toBe("https://schema.org/OutOfStock");
    expect(productOf("tonnin-seteli-t-paita").offers.availability).toBe("https://schema.org/InStock");
  });

  it("toimitusmaksu tulee src/config/toimitus.ts:stä: maksullinen alle rajan, ilmainen rajasta alkaen", () => {
    const alle = productOf("tonnin-seteli-t-paita").offers.shippingDetails;
    expect(alle.shippingRate).toEqual({ "@type": "MonetaryAmount", value: TOIMITUSMAKSU.toFixed(2), currency: "EUR" });
    expect(alle.shippingDestination.addressCountry).toBe("FI");
    expect(productOf("tonnin-seteli-peitto").offers.shippingDetails.shippingRate.value).toBe("0.00");
    expect(productOf("tasan-raja-huppari").offers.shippingDetails.shippingRate.value).toBe("0.00");
    const dt = alle.deliveryTime;
    expect([dt.handlingTime.minValue, dt.handlingTime.maxValue]).toEqual([KASITTELYAIKA_MIN_ARKIPAIVAA, KASITTELYAIKA_MAX_ARKIPAIVAA]);
    expect([dt.transitTime.minValue, dt.transitTime.maxValue]).toEqual([KULJETUSAIKA_MIN_ARKIPAIVAA, KULJETUSAIKA_MAX_ARKIPAIVAA]);
    expect(dt.handlingTime.unitCode).toBe("DAY");
  });

  it("palautuskäytäntö vastaa palautusehtoja; personoidulle tuotteelle ei palautusoikeutta", () => {
    const rp = productOf("tonnin-seteli-t-paita").offers.hasMerchantReturnPolicy;
    expect(rp).toEqual({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "FI",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: RETURNS.days,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    });
    expect(productOf("oma-teksti-t-paita").offers.hasMerchantReturnPolicy.returnPolicyCategory).toBe(
      "https://schema.org/MerchantReturnNotPermitted",
    );
  });

  it("tietokannan ajatusviivat muuttuvat yhdysmerkeiksi nimessä, kuvauksessa ja murupolussa", () => {
    const html = htmlByPath.get("/tuote/made-in-espoo-hauska-t-paita")!;
    expect(productOf("made-in-espoo-hauska-t-paita").name).toBe("Made in Espoo - hauska t-paita");
    const crumbs = nodesOf(html).find((n) => n["@type"] === "BreadcrumbList")!;
    expect(crumbs.itemListElement.at(-1).name).toBe("Made in Espoo - hauska t-paita");
  });
});

describe("rakenteinen data: kaikki esirenderöidyt sivut", () => {
  it("kattaa etusivun, kategoriat, listaussivut, joulusivut ja blogin", () => {
    for (const p of ["/", "/kategoria/t-paidat", "/kaikki-tuotteet", "/joululahjat", "/blogi"]) expect(htmlByPath.has(p), p).toBe(true);
    expect([...htmlByPath.keys()].some((p) => p.startsWith("/blogi/"))).toBe(true);
  });

  it("JSON-LD on kelvollista, ei ajatusviivoja eikä arvioita, eikä Productia muualla kuin tuotesivulla", () => {
    for (const [path, html] of htmlByPath) {
      const blocks = extractJsonLd(html);
      expect(blocks.length, path).toBeGreaterThan(0);
      for (const b of blocks) expect(b.error, path).toBeUndefined();
      expect(JSON.stringify(blocks.map((b: { data?: unknown }) => b.data)), path).not.toMatch(/[–—]/);
      const objs = allObjects(html);
      for (const o of objs) {
        expect("aggregateRating" in o || "review" in o, `${path}: aggregateRating/review`).toBe(false);
        expect(["AggregateRating", "Review"].includes(o["@type"]), `${path}: ${o["@type"]}`).toBe(false);
      }
      const productCount = objs.filter((o) => o["@type"] === "Product").length;
      expect(productCount, path).toBe(path.startsWith("/tuote/") ? 1 : 0);
    }
  });

  it("listaussivujen ItemList-tuotenimissä ei ole ajatusviivoja", () => {
    const html = htmlByPath.get("/kategoria/t-paidat")!;
    const names = allObjects(html).filter((o) => o["@type"] === "ListItem").map((o) => String(o.name ?? ""));
    expect(names).toContain("Made in Espoo - hauska t-paita");
  });
});

describe("serializeJsonLd", () => {
  it("poistaa ajatusviivat kaikista merkkijonoista ja escapoi <-merkin", () => {
    const out = serializeJsonLd({ a: "A – B", b: ["3—10"], c: { d: "</script>" }, n: 5 });
    expect(out).not.toMatch(/[–—<]/);
    expect(JSON.parse(out)).toEqual({ a: "A - B", b: ["3-10"], c: { d: "</script>" }, n: 5 });
  });

  it("poistaPitkatViivat ei muuta muita arvoja", () => {
    const p = buildProductJsonLd({ id: "x", slug: "x", name: "X", images: [], price: 10 });
    expect(poistaPitkatViivat(p)).toEqual(p);
  });
});
