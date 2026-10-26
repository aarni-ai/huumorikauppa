import { describe, expect, it } from "vitest";
import { buildProductJsonLd, buildSiteJsonLd, serializeJsonLd } from "./structuredData";
import { isCustomTextProduct } from "../lib/customProduct";
import { TOIMITUSAIKA_MAX_ARKIPAIVAA, TOIMITUSAIKA_MIN_ARKIPAIVAA } from "../config/toimitus";
import { PERSONOITU_AVAINSANAT, looksPersonalised, validateProduct, validateProductPage } from "../../scripts/tuotedata-validointi.mjs";

const expectedDeliveryDays = { min: TOIMITUSAIKA_MIN_ARKIPAIVAA, max: TOIMITUSAIKA_MAX_ARKIPAIVAA };

const samples = [
  { id: "a1", slug: "amatimies-t-paita", name: "Amatimies | T-Paita", description: "Hauska paita.", images: ["https://huumorikauppa.fi/api/img?u=a.jpg"], price: 24.9, stock: 100, categoryName: "T-Paidat" },
  { id: "b2", slug: "kallis-huppari", name: "Kallis | Huppari", description: "Lämmin huppari.", images: ["https://huumorikauppa.fi/api/img?u=b.jpg", "https://huumorikauppa.fi/api/img?u=c.jpg"], price: 89.9, stock: 5 },
  { id: "c3", slug: "oma-teksti-t-paita", name: "Oma teksti | T-Paita", description: "Paita omalla tekstillä.", images: ["https://huumorikauppa.fi/api/img?u=d.jpg"], price: 29.9 },
  { id: "d4", slug: "loppunut-muki", name: "Loppunut | Muki", description: "Muki.", images: ["https://huumorikauppa.fi/api/img?u=e.jpg"], price: 19.9, stock: 0 },
];

function page(jsonLd: unknown[]): string {
  return `<html><head>${jsonLd.map((j) => `<script type="application/ld+json">${serializeJsonLd(j)}</script>`).join("")}</head><body></body></html>`;
}

describe("validoi-tuotedata: rakentajan tuottama Product-JSON-LD", () => {
  for (const s of samples) {
    it(`${s.slug} läpäisee tarkistuksen`, () => {
      const personalised = looksPersonalised(s.name, s.description);
      expect(validateProduct(buildProductJsonLd(s), { expectedDeliveryDays, personalised })).toEqual([]);
      const res = validateProductPage(page([buildSiteJsonLd(), buildProductJsonLd(s)]), { expectedDeliveryDays, personalised });
      expect(res.errors).toEqual([]);
      expect(res.products).toBe(1);
      expect(res.personalised).toBe(personalised);
    });
  }

  it("personoitu tuote saa MerchantReturnNotPermitted", () => {
    expect(looksPersonalised(samples[2].name, samples[2].description)).toBe(true);
    const res = validateProductPage(page([buildProductJsonLd(samples[2])]), { expectedDeliveryDays, personalised: true });
    expect(res.personalised).toBe(true);
  });

  it("validaattorin personointitunnistus vastaa sovelluksen tunnistusta", () => {
    for (const k of PERSONOITU_AVAINSANAT) {
      expect(isCustomTextProduct({ name: `Tuote ${k}`, description: "" })).toBe(true);
    }
    for (const s of samples) {
      expect(looksPersonalised(s.name, s.description)).toBe(isCustomTextProduct({ name: s.name, description: s.description }));
    }
  });
});

describe("validoi-tuotedata: virheiden tunnistus", () => {
  const base = buildProductJsonLd(samples[0]) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const clone = () => JSON.parse(JSON.stringify(base));

  it("huomaa puuttuvat ja väärän tyyppiset kentät", () => {
    const p = clone();
    delete p.sku;
    p.image = ["/kuva.jpg"];
    p.brand = "Huumorikauppa";
    p.offers.priceCurrency = "USD";
    delete p.offers.priceValidUntil;
    delete p.offers.shippingDetails.deliveryTime.handlingTime;
    p.aggregateRating = { "@type": "AggregateRating", ratingValue: 5 };
    const errors = validateProduct(p, { expectedDeliveryDays }).join("\n");
    expect(errors).toMatch(/sku puuttuu/);
    expect(errors).toMatch(/image\[0\] ei ole absoluuttinen/);
    expect(errors).toMatch(/brand/);
    expect(errors).toMatch(/priceCurrency/);
    expect(errors).toMatch(/priceValidUntil/);
    expect(errors).toMatch(/handlingTime/);
    expect(errors).toMatch(/aggregateRating/);
  });

  it("huomaa vanhentuneen hinnan, väärän toimitusajan ja personoidun tuotteen palautusoikeuden", () => {
    const p = clone();
    p.offers.priceValidUntil = "2000-12-31";
    p.offers.shippingDetails.deliveryTime.transitTime.maxValue = 20;
    const errors = validateProduct(p, { expectedDeliveryDays, personalised: true }).join("\n");
    expect(errors).toMatch(/menneisyydessä/);
    expect(errors).toMatch(/lupaus 3-10/);
    expect(errors).toMatch(/MerchantReturnNotPermitted/);
  });

  it("huomaa rikkinäisen JSONin ja puuttuvan Productin", () => {
    const res = validateProductPage('<script type="application/ld+json">{rikki</script>');
    expect(res.errors.join("\n")).toMatch(/kelvollista JSONia/);
    expect(res.errors.join("\n")).toMatch(/Product-solmuja 0/);
  });
});
