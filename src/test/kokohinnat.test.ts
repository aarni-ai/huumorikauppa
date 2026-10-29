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
    // S ja M kate yli 10 %, 3XL alle 10 % hinnalla 57,90 € (kulu 36,00 €)
    costs: { "1": 2400, "2": 2400, "3": 3600 },
    shipping_cents: 1089,
  },
};

describe("koon mukaiset hupparihinnat", () => {
  it("S-2XL perushinta, 3XL+ iso hinta", () => {
    const r = hinnoitteleRivi(huppari);
    expect(rivinHinta(r, "M")).toBe(KOKOHINNAT.hupparit.perus);
    expect(rivinHinta(r, "3XL")).toBe(KOKOHINNAT.hupparit.iso);
    expect(rivinHinta(r, undefined)).toBe(KOKOHINNAT.hupparit.perus);
    expect(rivinHinta({ category: "kahvikupit", price: 19.9 }, "3XL")).toBe(19.9);
  });

  it("rivi saa perushinnan ja size_prices-kartan", () => {
    const r = hinnoitteleRivi(huppari);
    expect(r.price).toBe(52.9);
    expect(r.variants.size_prices).toEqual({ "3XL": 57.9 });
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
    expect(JSON.stringify(tilaus)).toContain("52.9");
  });
});

describe("t-paitojen hinnoittelu 29.10.2026", () => {
  const paita = (name: string) => hinnoitteleRivi({ name, category: "t-paidat", price: 24.9, variants: { sizes: ["M", "3XL"] } });
  it("suora kilpailijavertailu: 24,90 €, 3XL+ 27,90 €", () => {
    for (const n of ["Saatanan Tunarit | T-Paita", "Se oli tonnin seteli | T-paita", "I love my girlfriend | T-paita", "Kalju | T-paita", "Olen eläkkeellä | T-paita"]) {
      const r = paita(n);
      expect(r.price, n).toBe(24.9);
      expect(rivinHinta(r, "3XL"), n).toBe(27.9);
    }
  });
  it("muut t-paidat 27,90 € kaikissa ko'oissa", () => {
    const r = paita("Kala oli tätäkin isompi | T-paita kalastajalle");
    expect(r.price).toBe(27.9);
    expect(rivinHinta(r, "3XL")).toBe(27.9);
  });
  it("juliste 24,90 €, koriste 22,90 €, tarra ennallaan", () => {
    expect(hinnoitteleRivi({ name: "x", category: "seinataulut", price: 22.9, variants: {} }).price).toBe(24.9);
    expect(hinnoitteleRivi({ name: "x", category: "koristeet", price: 19.9, variants: {} }).price).toBe(22.9);
    expect(hinnoitteleRivi({ name: "x", category: "tarrat", price: 11.9, variants: {} }).price).toBe(11.9);
  });
});
