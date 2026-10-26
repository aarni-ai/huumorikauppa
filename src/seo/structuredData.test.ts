import { describe, expect, it } from "vitest";
import {
  ORGANIZATION_ID,
  WEBSITE_ID,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildProductJsonLd,
  buildSiteJsonLd,
  serializeJsonLd,
  shippingFeeForPrice,
} from "./structuredData";
import { isPrerenderedHtml } from "./prerenderDetect";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = Record<string, any>;

const product = {
  id: "feb0714c-3539-49ee-9b33-19214d3081f8",
  slug: "amatimies-t-paita",
  name: "Amatimies | T-Paita",
  description: "Hauska paita.",
  images: ["https://huumorikauppa.fi/api/img?u=a.jpg"],
  price: 24.9,
  stock: 100,
  categoryName: "T-Paidat",
};

describe("buildSiteJsonLd", () => {
  const site = buildSiteJsonLd() as Node;
  const graph = site["@graph"] as Node[];
  const org = graph.find((n) => n["@type"] === "Organization")!;
  const web = graph.find((n) => n["@type"] === "WebSite")!;

  it("is valid JSON with schema.org context", () => {
    expect(JSON.parse(JSON.stringify(site))["@context"]).toBe("https://schema.org");
  });

  it("describes the organization with logo, contact email and repo-listed social profiles", () => {
    expect(org["@id"]).toBe(ORGANIZATION_ID);
    expect(org.name).toBe("Huumorikauppa");
    expect(org.url).toBe("https://huumorikauppa.fi/");
    expect(org.logo.url).toBe("https://huumorikauppa.fi/logo.png");
    expect(org.email).toBe("huumorikauppa@gmail.com");
    expect(org.contactPoint.email).toBe("huumorikauppa@gmail.com");
    expect(org.sameAs).toContain("https://www.instagram.com/huumorikauppa_fi");
    expect(org.sameAs).toContain("https://www.facebook.com/profile.php?id=61584153329326");
    expect(org.hasMerchantReturnPolicy.merchantReturnDays).toBe(14);
  });

  it("has a WebSite SearchAction pointing to /haku", () => {
    expect(web["@id"]).toBe(WEBSITE_ID);
    expect(web.publisher).toEqual({ "@id": ORGANIZATION_ID });
    expect(web.potentialAction["@type"]).toBe("SearchAction");
    expect(web.potentialAction.target.urlTemplate).toBe("https://huumorikauppa.fi/haku?q={search_term_string}");
    expect(web.potentialAction["query-input"]).toBe("required name=search_term_string");
  });
});

describe("buildProductJsonLd", () => {
  const p = buildProductJsonLd(product) as Node;

  it("uses product id as sku and Huumorikauppa as brand", () => {
    expect(p["@type"]).toBe("Product");
    expect(p.sku).toBe(product.id);
    expect(p.brand).toEqual({ "@type": "Brand", name: "Huumorikauppa" });
    expect(p.image).toEqual(product.images);
    expect(p.url).toBe("https://huumorikauppa.fi/tuote/amatimies-t-paita");
    expect(p).not.toHaveProperty("aggregateRating");
  });

  it("has an EUR offer that is in stock", () => {
    expect(p.offers["@type"]).toBe("Offer");
    expect(p.offers.price).toBe("24.90");
    expect(p.offers.priceCurrency).toBe("EUR");
    expect(p.offers.availability).toBe("https://schema.org/InStock");
    expect(p.offers.url).toBe(p.url);
    expect(p.offers.seller).toEqual({ "@type": "Organization", "@id": ORGANIZATION_ID, name: "Huumorikauppa" });
    expect(p.offers.itemCondition).toBe("https://schema.org/NewCondition");
    expect(p.offers.priceValidUntil).toMatch(/^\d{4}-12-31$/);
    expect(Number(p.offers.priceValidUntil.slice(0, 4))).toBe(new Date().getUTCFullYear() + 1);
  });

  it("ships to Finland with the shop's rates and delivery window", () => {
    const ship = p.offers.shippingDetails;
    expect(ship["@type"]).toBe("OfferShippingDetails");
    expect(ship.shippingDestination.addressCountry).toBe("FI");
    expect(ship.shippingRate).toEqual({ "@type": "MonetaryAmount", value: "6.90", currency: "EUR" });
    const { handlingTime, transitTime } = ship.deliveryTime;
    expect(handlingTime).toMatchObject({ "@type": "QuantitativeValue", unitCode: "DAY" });
    expect(transitTime).toMatchObject({ "@type": "QuantitativeValue", unitCode: "DAY" });
    // Käsittely + kuljetus = kaupan lupaama 3-10 arkipäivää.
    expect(handlingTime.minValue + transitTime.minValue).toBe(3);
    expect(handlingTime.maxValue + transitTime.maxValue).toBe(10);
    const expensive = buildProductJsonLd({ ...product, price: 89.9 }) as Node;
    expect(expensive.offers.shippingDetails.shippingRate.value).toBe("0.00");
  });

  it("has a 14 day Finnish return policy", () => {
    expect(p.offers.hasMerchantReturnPolicy).toMatchObject({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "FI",
      merchantReturnDays: 14,
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    });
  });

  it("does not allow returns for personalised products", () => {
    const custom = buildProductJsonLd({ ...product, name: "Oma teksti | T-Paita", description: "Paita omalla tekstillä." }) as Node;
    expect(custom.offers.hasMerchantReturnPolicy).toEqual({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "FI",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    });
    const flagged = buildProductJsonLd({ ...product, personalised: true }) as Node;
    expect(flagged.offers.hasMerchantReturnPolicy.returnPolicyCategory).toBe("https://schema.org/MerchantReturnNotPermitted");
  });

  it("marks sold out products OutOfStock", () => {
    const sold = buildProductJsonLd({ ...product, stock: 0 }) as Node;
    expect(sold.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("shippingFeeForPrice", () => {
  it("is free from 79 EUR", () => {
    expect(shippingFeeForPrice(78.9)).toBe(6.9);
    expect(shippingFeeForPrice(79)).toBe(0);
  });
});

describe("buildBreadcrumbJsonLd / buildFaqJsonLd", () => {
  it("numbers breadcrumb items and makes urls absolute", () => {
    const bc = buildBreadcrumbJsonLd([
      { name: "Etusivu", url: "/" },
      { name: "T-Paidat", url: "https://huumorikauppa.fi/kategoria/t-paidat" },
    ]) as Node;
    expect(bc["@type"]).toBe("BreadcrumbList");
    expect(bc.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Etusivu", item: "https://huumorikauppa.fi/" },
      { "@type": "ListItem", position: 2, name: "T-Paidat", item: "https://huumorikauppa.fi/kategoria/t-paidat" },
    ]);
  });

  it("builds FAQPage questions", () => {
    const faq = buildFaqJsonLd([{ q: "Kysymys?", a: "Vastaus." }]) as Node;
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Kysymys?",
      acceptedAnswer: { "@type": "Answer", text: "Vastaus." },
    });
  });
});

describe("serializeJsonLd", () => {
  it("cannot break out of the script tag", () => {
    const out = serializeJsonLd({ description: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).description).toBe("</script><script>alert(1)</script>");
  });
});

describe("isPrerenderedHtml", () => {
  const html = '<link rel="canonical" href="https://huumorikauppa.fi/joululahjat" /><div id="root"><div data-prerender="true"></div></div>';
  it("detects a page prerendered for this path", () => {
    expect(isPrerenderedHtml(html, "/joululahjat")).toBe(true);
    expect(isPrerenderedHtml(html, "/joululahjat/")).toBe(true);
  });
  it("does not match other paths or the SPA shell", () => {
    expect(isPrerenderedHtml(html, "/tuote/uusi")).toBe(false);
    expect(isPrerenderedHtml('<div id="root"><div data-prerender="true"></div></div>', "/tuote/uusi")).toBe(false);
  });
});
