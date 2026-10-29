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
