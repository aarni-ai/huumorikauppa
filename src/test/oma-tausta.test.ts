import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { laskeTilaus, KassaVirhe } from "../../api/_lib/kassa.js";
import { printifyVariantti, myynnissa } from "../../api/_lib/tuotteet.js";
import { seuraavaYritys, puuttuvatVariantit, halytetaanko } from "../../api/_lib/tilaus.js";
import { tilausRunko } from "../../api/_lib/printify.js";
import { PIILOTETUT_KATEGORIAT as PALVELIN } from "../../api/_lib/piilotetut.js";
import { PIILOTETUT_KATEGORIAT as SELAIN } from "@/lib/hiddenCategories";

const paita = {
  id: "p1", slug: "paita", name: "Paita", category: "t-paidat", price: 34.9, stock: 99, is_active: true,
  printify_product_id: "pf1", variants: { variant_map: { "Musta|M": 11, "Musta|L": 12, "Valkoinen|M": 13 } },
};
const yksikoko = { ...paita, id: "p2", slug: "pipo", name: "Pipo", category: "pipot", price: 32.9, variants: { variant_map: { "Musta|OS": 21 } } };
const muki = { ...paita, id: "p3", slug: "muki", name: "Muki", category: "mukit", variants: { variant_map: { "|11oz": 31 } } };
const tuotteet = [paita, yksikoko, muki];
const pyynto = (items: unknown[]) => ({
  items, customerEmail: "a@b.fi", customerName: "Testi Asiakas",
  shippingAddress: { address: "Katu 1", zip: "00100", city: "Helsinki" },
});

describe("Printify-variantti", () => {
  it("suora avain väri|koko", () => expect(printifyVariantti(paita, "Musta", "L")).toBe(12));
  it("yksikokoinen tuote ilman kokoa löytyy (vanhan taustan virhe)", () => expect(printifyVariantti(yksikoko, "Musta", undefined)).toBe(21));
  it("monitulkintainen tai puuttuva palauttaa null", () => {
    expect(printifyVariantti(paita, undefined, "M")).toBeNull();
    expect(printifyVariantti(paita, "Punainen", "M")).toBeNull();
    expect(printifyVariantti({ ...paita, variants: {} }, "Musta", "M")).toBeNull();
  });
});

describe("Kassa", () => {
  it("laskee hinnan palvelimen tiedoista, toimitus alle 79 €", () => {
    const t = laskeTilaus(pyynto([{ id: "p1", quantity: 1, size: "M", color: "Musta", price: 1 }]), tuotteet, null);
    expect(t.total).toBe(41.8);
    expect(t.shipping).toBe(6.9);
    expect(t.rivit[0]).toMatchObject({ variant_id: 11, printify_product_id: "pf1", unit_cents: 3490 });
  });
  it("ilmainen toimitus ja prosenttialennus", () => {
    const t = laskeTilaus(pyynto([{ id: "p1", quantity: 3, size: "M", color: "Musta" }]), tuotteet, { type: "percent", value: 10 });
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(94.23);
  });
  it("ei maksua tuotteesta, jonka varianttia ei löydy", () => {
    expect(() => laskeTilaus(pyynto([{ id: "p1", quantity: 1, size: "XXL", color: "Musta" }]), tuotteet, null)).toThrow(KassaVirhe);
  });
  it("mukit eivät ole myynnissä", () => {
    expect(myynnissa(muki)).toBe(false);
    expect(() => laskeTilaus(pyynto([{ id: "p3", quantity: 1 }]), tuotteet, null)).toThrow(/ei ole enää myynnissä/);
  });
  it("piilotetut kategoriat samat selaimessa ja palvelimella", () => expect([...PALVELIN]).toEqual([...SELAIN]));
});

describe("Printify-siirto", () => {
  it("puuttuvat variantit tunnistetaan", () => {
    expect(puuttuvatVariantit([{ name: "A", printify_product_id: "x", variant_id: 1 }, { name: "B", printify_product_id: "x", variant_id: null }])).toEqual(["B"]);
  });
  it("uudelleenyritys kasvavin välein ja hälytys kerran vuorokaudessa", () => {
    const nyt = new Date("2026-10-21T10:00:00Z");
    expect(seuraavaYritys(1, nyt).toISOString()).toBe("2026-10-21T10:15:00.000Z");
    expect(seuraavaYritys(9, nyt).toISOString()).toBe("2026-10-21T14:00:00.000Z");
    expect(halytetaanko({ alert_sent_at: null }, nyt)).toBe(true);
    expect(halytetaanko({ alert_sent_at: "2026-10-21T09:00:00Z" }, nyt)).toBe(false);
    expect(halytetaanko({ alert_sent_at: "2026-10-20T09:00:00Z" }, nyt)).toBe(true);
  });
  it("tilauksen runko: vastaanottajan nimi ja osoite", () => {
    const r = tilausRunko({
      id: "abcdef12-0000", customer_email: "a@b.fi", customer_name: "Maksaja Nimi", recipient_name: "Toini Aro",
      shipping_address: { address: "Tarvasjoentie 619", zip: "21530", city: "Paimio", phone: "0401234567" },
      items: [{ printify_product_id: "pf1", variant_id: 11, quantity: 2 }],
    });
    expect(r.address_to).toMatchObject({ first_name: "Toini", last_name: "Aro", address1: "Tarvasjoentie 619", zip: "21530", city: "Paimio" });
    expect(r.line_items).toEqual([{ product_id: "pf1", variant_id: 11, quantity: 2 }]);
    expect(r.external_id).toBe("abcdef12-0000");
  });
});

describe("Tilannekuva", () => {
  it("jokaisella tuotteella Printify-tunnus ja variant_map", () => {
    const d = JSON.parse(readFileSync("data/products-snapshot.json", "utf8"));
    expect(d.length).toBeGreaterThan(700);
    expect(d.every((p: { printify_product_id?: string; variants?: { variant_map?: object } }) => p.printify_product_id && p.variants?.variant_map)).toBe(true);
  });
});
