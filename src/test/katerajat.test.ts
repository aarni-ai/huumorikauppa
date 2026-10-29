import { describe, expect, it } from "vitest";
import { laskeTilaus } from "../../api/_lib/kassa.js";
import { OLETUSKOODIT } from "../../api/_lib/kassa.js";
import { TILAUKSEN_MIN_KATE_EUROA, LISATUOTE_KATEGORIAT } from "../../api/_lib/vakiot.js";

const osoite = { address: "K 1", zip: "00100", city: "Hki" };
const tarra = {
  id: "s1", slug: "tarra", name: "Tarra", category: "tarrat", price: 11.9, is_active: true, printify_product_id: "pf9",
  variants: { variant_map: { "Valkoinen|3x3": 21 }, costs: { "21": 150 }, shipping_cents: 559 },
};

describe("katerajat 29.10.2026", () => {
  it("vähimmäiskate 7 € ja kiinteät koodit poistettu", () => {
    expect(TILAUKSEN_MIN_KATE_EUROA).toBe(7);
    expect(OLETUSKOODIT).toEqual({});
    expect(LISATUOTE_KATEGORIAT).toContain("tarrat");
  });
  it("pelkkä tarra hylätään", () => {
    const p = { items: [{ id: "s1", quantity: 2, size: "3x3", color: "Valkoinen" }], customerEmail: "a@b.fi", shippingAddress: osoite };
    expect(() => laskeTilaus(p, [tarra], null)).toThrow(/Tarra myydään/);
  });
});

import { HINNASTOT, HINNASTO, PRINTIFY_ALV_VAHENNETTAVA } from "../../api/_lib/vakiot.js";
import { hinnoitteleRivi, rivinHinta } from "../../api/_lib/kokohinnat.js";
import { laskeTilauksenNettokate } from "../../api/_lib/kate.js";

describe("ALV-varasuunnitelma (pois päältä)", () => {
  it("kytkin pois ja perushinnasto käytössä", () => {
    expect(PRINTIFY_ALV_VAHENNETTAVA).toBe(true);
    expect(HINNASTO).toBe(HINNASTOT.perus);
  });
  it("varahinnasto hinnoittelee t-paidat ja hupparit", () => {
    const p = hinnoitteleRivi({ name: "Kala | T-paita", category: "t-paidat", price: 24.9, variants: { sizes: ["M", "3XL"] } }, HINNASTOT.alvKulu);
    expect(p.price).toBe(31.9);
    expect(rivinHinta(p, "3XL")).toBe(35.9);
    const h = hinnoitteleRivi({ name: "Kalju | Huppari", category: "hupparit", price: 49.9, variants: { sizes: ["M", "4XL"] } }, HINNASTOT.alvKulu);
    expect(h.price).toBe(65.9);
    expect(rivinHinta(h, "4XL")).toBe(72.9);
  });
  it("kulukerroin 1,255 pienentää katetta Printify-kulujen ALV:n verran", () => {
    const t = { category: "t-paidat", variants: { variant_map: { "Musta|M": 1 }, costs: { "1": 890 }, shipping_cents: 849 } };
    const ilman = laskeTilauksenNettokate([{ tuote: t, varianttiId: 1, maara: 1, yksikkohinta: 24.9 }], 6.9);
    const alv = laskeTilauksenNettokate([{ tuote: t, varianttiId: 1, maara: 1, yksikkohinta: 24.9 }], 6.9, { kerroin: 1.255 });
    expect(ilman.nettokate - alv.nettokate).toBeCloseTo(17.39 * 0.255, 1);
  });
});
