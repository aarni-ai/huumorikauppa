import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { laskeTilaus, KassaVirhe } from "../../api/_lib/kassa.js";
import { laskeKate, heikoinKate } from "../../api/_lib/kate.js";
import { printifyVariantti, myynnissa } from "../../api/_lib/tuotteet.js";
import { seuraavaYritys, puuttuvatVariantit, halytetaanko } from "../../api/_lib/tilaus.js";
import { tilausRunko } from "../../api/_lib/printify.js";
import { TOIMITUS, ILMAINEN_TOIMITUS_RAJA } from "../../api/_lib/vakiot.js";
import { PIILOTETUT_KATEGORIAT as PALVELIN } from "../../api/_lib/piilotetut.js";
import { PIILOTETUT_KATEGORIAT as SELAIN } from "@/lib/hiddenCategories";

const paita = {
  id: "p1", slug: "paita", name: "Paita", category: "t-paidat", price: 34.9, stock: 99, is_active: true,
  printify_product_id: "pf1",
  variants: { variant_map: { "Musta|M": 11, "Musta|L": 12, "Valkoinen|M": 13 }, costs: { "11": 1200, "12": 1200, "13": 1200 }, shipping_cents: 450 },
};
const yksikoko = { ...paita, id: "p2", slug: "pipo", name: "Pipo", category: "pipot", price: 32.9, variants: { variant_map: { "Musta|OS": 21 }, costs: { "21": 900 }, shipping_cents: 450 } };
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
  it("laskee hinnan palvelimen tiedoista, toimitus rajan alle", () => {
    const t = laskeTilaus(pyynto([{ id: "p1", quantity: 1, size: "M", color: "Musta", price: 1 }]), tuotteet, null);
    expect(34.9).toBeLessThan(ILMAINEN_TOIMITUS_RAJA);
    expect(t.total).toBe(Math.round((34.9 + TOIMITUS) * 100) / 100);
    expect(t.shipping).toBe(TOIMITUS);
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

describe("Katesääntö 20 %", () => {
  it("laskee nettokatteen: (hinta + toimitus) alv 0 - tuotekulu - toimitus - Stripe", () => {
    // (34,90 + toimitusmaksu) / 1,255 - tuotekulu 12,00 - toimituskulu 4,50 - Stripe (maksettu * 1,5 % + 0,25); maksuna 40,80 (5,90): 15,15
    const k = laskeKate(paita, 11);
    expect(k).toMatchObject({ tunnettu: true, nettokate: 15.15, sallittu: true });
    expect(k.kate).toBeCloseTo(0.466, 3);
  });
  it("alle 20 % estää kassalla ja piilottaa listasta, 20-40 % on myynnissä", () => {
    // Kulu 18,00: kate 28,1 %, aiemmalla 40 %:n rajalla estetty, nyt myynnissä.
    const keski = { ...paita, id: "p6", slug: "keski", variants: { ...paita.variants, costs: { "11": 1800, "12": 1800, "13": 1800 } } };
    expect(laskeKate(keski, 11).kate).toBeCloseTo(0.281, 3);
    expect(laskeKate(keski, 11).sallittu).toBe(true);
    expect(myynnissa(keski)).toBe(true);
    expect(laskeTilaus(pyynto([{ id: "p6", quantity: 1, size: "M", color: "Musta" }]), [keski], null).total).toBe(40.8);
    // Kulu 22,00: kate 15,8 %.
    const halpa = { ...paita, id: "p4", slug: "halpa", variants: { ...paita.variants, costs: { "11": 2200, "12": 2200, "13": 2200 } } };
    expect(laskeKate(halpa, 11).sallittu).toBe(false);
    expect(myynnissa(halpa)).toBe(false);
    expect(() => laskeTilaus(pyynto([{ id: "p4", quantity: 1, size: "M", color: "Musta" }]), [halpa], null)).toThrow(KassaVirhe);
  });
  it("tappiollinen variantti (kulu > myynti alv 0 - Stripe): kassa kieltäytyy ja tuote piilotetaan listasta", () => {
    // 3XL-tyyppinen tapaus: yksi variantti tappiollinen (kulu 40,00 + toimitus 4,50 > (34,90 + 6,90) / 1,255 - Stripe).
    const tappio = { ...paita, id: "p7", slug: "tappio", variants: { ...paita.variants, costs: { "11": 1200, "12": 4000, "13": 1200 } } };
    expect(laskeKate(tappio, 12)).toMatchObject({ tunnettu: true, sallittu: false });
    expect(laskeKate(tappio, 12).nettokate).toBeLessThan(0);
    expect(heikoinKate(tappio).nettokate).toBeLessThan(0);
    expect(myynnissa(tappio)).toBe(false);
    const virhe = (() => {
      try { laskeTilaus(pyynto([{ id: "p7", quantity: 1, size: "L", color: "Musta" }]), [tappio], null); } catch (e) { return e; }
      return null;
    })();
    expect(virhe).toBeInstanceOf(KassaVirhe);
    // Tuotteen heikoin variantti on alle KATE_RAJA:n, joten myynnissa() hylkää jo ennen variantin katetarkistusta
    // (low_margin); kumpikin estää maksun. Myös kannattava variantti samasta tuotteesta estyy.
    expect(["hidden_category", "low_margin"]).toContain((virhe as KassaVirhe).vaihe);
    expect(() => laskeTilaus(pyynto([{ id: "p7", quantity: 1, size: "M", color: "Musta" }]), [tappio], null)).toThrow(KassaVirhe);
  });
  it("tuntematon kulu: näkyy listassa, mutta kassa ei ota maksua", () => {
    const tuntematon = { ...paita, id: "p5", slug: "uusi", variants: { variant_map: paita.variants.variant_map } };
    expect(heikoinKate(tuntematon).tunnettu).toBe(false);
    expect(myynnissa(tuntematon)).toBe(true);
    expect(() => laskeTilaus(pyynto([{ id: "p5", quantity: 1, size: "M", color: "Musta" }]), [tuntematon], null)).toThrow(/hintaa ei voitu vahvistaa/);
  });
  it("ilmainen toimitus rajan ylittävällä hinnalla", () => {
    const kallis = { ...paita, price: 89.9 };
    expect(kallis.price).toBeGreaterThanOrEqual(ILMAINEN_TOIMITUS_RAJA);
    // 89,90 / 1,255 = 71,63; Stripe 1,60; 71,63 - 12 - 4,50 - 1,60 = 53,53
    expect(laskeKate(kallis, 11).nettokate).toBe(53.53);
  });
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
