import { describe, expect, it } from "vitest";
import { rivinHinta, hinnoitteleRivi, KOKOHINNAT } from "../../api/_lib/kokohinnat.js";
import { laskeKate, tuotteenKateraja } from "../../api/_lib/kate.js";
import { valmisteleRivi } from "../../api/_lib/tuotteet.js";
import { laskeTilaus } from "../../api/_lib/kassa.js";

const huppari = {
  id: "h1", slug: "testi-huppari", name: "Testi | Huppari", category: "hupparit", price: 49.9, is_active: true,
  printify_product_id: "pf1",
  variants: {
    sizes: ["S", "M", "3XL"], colors: ["Musta"],
    variant_map: { "Musta|S": 1, "Musta|M": 2, "Musta|3XL": 3 },
    // S ja M kate yli 10 %, 3XL alle 10 % hinnalla 55,00 € (kulu 33,50 €)
    costs: { "1": 2400, "2": 2400, "3": 3350 },
    shipping_cents: 1089,
  },
};

describe("koon mukaiset hupparihinnat", () => {
  it("S-2XL perushinta, 3XL+ iso hinta", () => {
    const r = hinnoitteleRivi(huppari);
    expect(rivinHinta(r, "M")).toBe(KOKOHINNAT.hupparit.perus);
    expect(rivinHinta(r, "3XL")).toBe(KOKOHINNAT.hupparit.iso);
    expect(rivinHinta(r, undefined)).toBe(KOKOHINNAT.hupparit.perus);
    expect(rivinHinta({ category: "t-paidat", price: 24.9 }, "3XL")).toBe(24.9);
  });

  it("rivi saa perushinnan ja size_prices-kartan", () => {
    const r = hinnoitteleRivi(huppari);
    expect(r.price).toBe(49.99);
    expect(r.variants.size_prices).toEqual({ "3XL": 55 });
  });

  it("hupparin katesääntö on 10 %, muiden 20 %", () => {
    expect(tuotteenKateraja(huppari)).toBe(0.1);
    expect(tuotteenKateraja({ category: "t-paidat" })).toBe(0.2);
    const r = hinnoitteleRivi(huppari);
    expect(laskeKate(r, 1).sallittu).toBe(true);
    expect(laskeKate(r, 3).sallittu).toBe(false);
  });

  it("alle rajan jäävä koko piilotetaan, tuote jää myyntiin", () => {
    const r = valmisteleRivi(huppari);
    expect(r.unavailable_variants).toEqual(["Musta|3XL"]);
  });

  it("kassa veloittaa koon hinnan", () => {
    const t = valmisteleRivi(huppari);
    const p = { items: [{ id: "h1", color: "Musta", size: "M", quantity: 1 }], customerEmail: "a@b.fi", shippingAddress: { address: "Katu 1", zip: "00100", city: "Helsinki" } };
    const tilaus = laskeTilaus(p, [t], null);
    expect(JSON.stringify(tilaus)).toContain("49.99");
  });
});
