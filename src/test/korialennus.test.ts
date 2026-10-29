import { describe, it, expect } from "vitest";
import { laskeTilaus } from "../../api/_lib/kassa.js";
import { printifyToimitusSentit, laskeTilauksenNettokate } from "../../api/_lib/kate.js";
import { sovellaKorialennus, kalleinVariantti } from "../../api/_lib/korialennus.js";
import {
  TOIMITUS, ILMAINEN_TOIMITUS_RAJA, KORIALENNUS_PROSENTTI, KORIALENNUS_MIN_KPL, KORIALENNUS_MIN_KATE_EUROA,
} from "../../api/_lib/vakiot.js";
import { korialennusTila } from "@/lib/ostoskori";
import type { Product } from "@/types/product";

// T-paita todellisilla kuluilla 27.10.2026 (KATTEET.md "Keskiostoksen nosto: laskelma"): tuotekulu 8,90 (3XL 9,93),
// Printify-katalogin Suomen toimitus OPT OnDemand (pp 30) ensimmäinen 8,49 / lisäkappale 1,19.
const paita = {
  id: "t1", slug: "testi-t-paita", name: "Testi | T-Paita", category: "t-paidat", price: 24.9, is_active: true,
  printify_product_id: "pf-t", created_at: "2026-01-01",
  variants: {
    variant_map: { "Musta|M": 1, "Musta|3XL": 2 }, costs: { "1": 890, "2": 993 },
    shipping_cents: 849, shipping_additional_cents: 119, print_provider_id: 30,
  },
};
const huppari = {
  id: "h1", slug: "testi-huppari", name: "Testi | Huppari", category: "hupparit", price: 49.9, is_active: true,
  printify_product_id: "pf-h", created_at: "2026-01-02",
  variants: {
    variant_map: { "Musta|M": 11 }, costs: { "11": 2500 },
    shipping_cents: 1000, shipping_additional_cents: 1000, print_provider_id: 26,
  },
};
// Huppari on kuvitteellinen: 49,90 €:n huppari todellisilla kuluilla (Printify Choice 23,77 + 15,59) jää alle 20 %:n
// myyntirajan, joten kassa ei myy sitä. Tämä on myynnissä (kate 20,2 %), mutta kaksi kappaletta -10 %:lla jäisi tappiolle.
const hupparivanha = { ...huppari, id: "h2", slug: "vanha-huppari", variants: { variant_map: { "Musta|M": 12 }, costs: { "12": 2500 }, shipping_cents: 1000 } };
const tuotteet = [paita, huppari];
const osoite = { address: "Katu 1", zip: "00100", city: "Helsinki" };
const pyynto = (items: unknown[]) => ({ items, customerEmail: "a@b.fi", shippingAddress: osoite });
const t = (slug: string, quantity = 1, size = "M") => ({ slug, quantity, size, color: "Musta" });
const r2 = (n: number) => Math.round(n * 100) / 100;

describe("Korialennuksen vakiot", () => {
  it("toimitus 6,90 € alle 79 €, kahden tuotteen alennus 5 %, katevahti 0 €", () => {
    expect(TOIMITUS).toBe(6.9);
    expect(ILMAINEN_TOIMITUS_RAJA).toBe(79);
    expect(KORIALENNUS_PROSENTTI).toBe(5);
    expect(KORIALENNUS_MIN_KPL).toBe(2);
    expect(KORIALENNUS_MIN_KATE_EUROA).toBe(0);
  });
});

describe("Printifyn toimitus painotaloittain", () => {
  it("saman painotalon lisäkappale halvempi, eri painotalot erikseen", () => {
    expect(printifyToimitusSentit([{ tuote: paita, maara: 1 }])).toBe(849);
    expect(printifyToimitusSentit([{ tuote: paita, maara: 2 }])).toBe(849 + 119);
    expect(printifyToimitusSentit([{ tuote: paita, maara: 3 }])).toBe(849 + 2 * 119);
    expect(printifyToimitusSentit([{ tuote: paita, maara: 1 }, { tuote: huppari, maara: 1 }])).toBe(849 + 1000);
    expect(printifyToimitusSentit([{ tuote: paita, maara: 2 }, { tuote: huppari, maara: 1 }])).toBe(849 + 119 + 1000);
  });
  it("puuttuva lisäkappale tai painotalo: varovasti ensimmäisen kappaleen hinnalla", () => {
    expect(printifyToimitusSentit([{ tuote: hupparivanha, maara: 2 }])).toBe(2 * 1000);
    expect(printifyToimitusSentit([{ tuote: { ...paita, variants: { ...paita.variants, print_provider_id: null } }, maara: 2 }])).toBe(2 * 849);
    expect(printifyToimitusSentit([{ tuote: { variants: {} }, maara: 1 }])).toBeNull();
  });
  it("tilauksen nettokate vastaa laskelmaa (2 t-paitaa -5 %, toimitus 6,90)", () => {
    // 2 x 23,66 + 6,90 = 54,22; alv 0 43,20; kulut 2 x 8,90 + 8,49 + 1,19 = 27,48; Stripe 1,06 -> 14,66
    const k = laskeTilauksenNettokate([{ tuote: paita, varianttiId: 1, maara: 2, yksikkohinta: 23.66 }], 6.9);
    expect(k.tunnettu).toBe(true);
    expect(k.nettokate).toBeCloseTo(14.66, 2);
  });
});

describe("Kahden tuotteen alennus kassalla", () => {
  it("yksi tuote: ei alennusta, toimitusmaksu peritään", () => {
    const r = laskeTilaus(pyynto([t("testi-t-paita")]), tuotteet, null);
    expect(r.basket_discount).toBe(0);
    expect(r.total).toBe(r2(24.9 + 6.9));
  });
  it("kaksi t-paitaa: -5 % palvelimen hinnoista", () => {
    const r = laskeTilaus(pyynto([t("testi-t-paita", 2)]), tuotteet, null);
    expect(r.rivit[0]).toMatchObject({ unit_cents: 2366, korialennus_prosentti: 5 });
    expect(r.basket_discount).toBe(2.48);
    expect(r.discount).toBe(2.48);
    expect(r.shipping).toBe(6.9);
    expect(r.total).toBe(r2(2 * 23.66 + 6.9));
  });
  it("selaimen lähettämä hinta ei vaikuta", () => {
    const r = laskeTilaus(pyynto([{ ...t("testi-t-paita", 2), price: 1, unit_price: 1 }]), tuotteet, null);
    expect(r.rivit[0].unit_cents).toBe(2366);
  });
  it("t-paita + huppari: alennus, toimitusraja lasketaan ennen alennusta", () => {
    const r = laskeTilaus(pyynto([t("testi-t-paita"), t("testi-huppari")]), tuotteet, null);
    // Sentteihin pyöristys kuten Stripe: 5 % 74,80 €:sta, yksi sentti suuntaan tai toiseen.
    expect(r.basket_discount).toBeCloseTo(3.74, 1);
    expect(r.total).toBe(r2(r.rivit.reduce((x: number, y: { unit_cents: number }) => x + y.unit_cents, 0) / 100 + 6.9));
    expect(r.shipping).toBe(6.9);
  });
  it("kaksi hupparia: ilmainen toimitus (99,80 €) ja alennus, kate pysyy positiivisena", () => {
    const r = laskeTilaus(pyynto([t("testi-huppari", 2)]), tuotteet, null);
    expect(r.shipping).toBe(0);
    expect(r.basket_discount).toBeCloseTo(4.99, 1);
    const k = laskeTilauksenNettokate([{ tuote: huppari, varianttiId: 11, maara: 2, yksikkohinta: 47.4 }], 0);
    expect(k.nettokate).toBeCloseTo(3.88, 1);
  });
  it("katevahti: -10 % kahdelle hupparille olisi tappiollinen, joten alennusta ei anneta", () => {
    const r = laskeTilaus(pyynto([t("testi-huppari", 2)]), tuotteet, null, { korialennus: { prosentti: 10 } });
    expect(r.basket_discount).toBe(0);
    expect(r.total).toBe(99.8);
  });
  it("katevahdin raja on asetettava", () => {
    const r = laskeTilaus(pyynto([t("testi-t-paita", 2)]), tuotteet, null, { korialennus: { minKateEuroa: 20 } });
    expect(r.basket_discount).toBe(0);
  });
  it("alennuskoodi korvaa korialennuksen", () => {
    const r = laskeTilaus(pyynto([t("testi-t-paita", 2)]), tuotteet, { type: "percent", value: 10 });
    expect(r.basket_discount).toBe(0);
    expect(r.discount).toBe(4.98);
  });
  it("lahjakortti ei kerrytä kappalemäärää eikä saa alennusta", () => {
    const r = laskeTilaus(pyynto([t("testi-t-paita"), { id: "lahjakortti-50", type: "giftcard", quantity: 1 }]), tuotteet, null);
    expect(r.basket_discount).toBe(0);
  });
  it("pakettiriviä ei alenneta toiseen kertaan", () => {
    const rivit = [
      { slug: "testi-t-paita", quantity: 1, unit_cents: 2366, variant_id: 1, paketti: "testi-paketti" },
      { slug: "testi-huppari", quantity: 1, unit_cents: 4741, variant_id: 11, paketti: "testi-paketti" },
    ];
    const m = new Map(tuotteet.map((p) => [p.slug, p]));
    expect(sovellaKorialennus(rivit, m, 6.9)).toMatchObject({ alennus: 0, syy: "ei_rivia" });
  });
});

describe("Ostoskorin vihje (selain)", () => {
  const p = (x: object) => x as unknown as Product;
  it("yksi tuote: puuttuu yksi, ei alennusta", () => {
    const tila = korialennusTila([{ product: p(paita), quantity: 1, selectedSize: "M", selectedColor: "Musta" }], [p(paita)]);
    expect(tila).toMatchObject({ kpl: 1, puuttuu: 1, voimassa: false, syy: "kpl", prosentti: 5 });
  });
  it("kaksi tuotetta: sama alennus kuin kassalla", () => {
    const tila = korialennusTila([{ product: p(paita), quantity: 2, selectedSize: "M", selectedColor: "Musta" }], [p(paita)], false, []);
    expect(tila).toMatchObject({ kpl: 2, puuttuu: 0, voimassa: true, alennus: 2.48 });
  });
  it("alennuskoodi: ei vihjettä", () => {
    expect(korialennusTila([{ product: p(paita), quantity: 2 }], [p(paita)], true).syy).toBe("koodi");
  });
  it("tuntematon variantti: kallein variantti arvioon", () => {
    expect(kalleinVariantti(paita)).toBe(2);
  });
});

describe("Black Friday: kaksi t-paitaa 44,90 € (TPAITAPARI_KAMPANJA)", async () => {
  const { TPAITAPARI_KAMPANJA } = await import("../../api/_lib/vakiot.js");
  const { tpaitapariVoimassa } = await import("../../api/_lib/korialennus.js");
  const bySlug = new Map<string, unknown>(tuotteet.map((p) => [p.slug, p]));
  const kampanja = { ...TPAITAPARI_KAMPANJA, kaytossa: true };
  const nyt = new Date("2026-11-28T10:00:00Z");
  const rivi = (slug: string, quantity: number, variant_id: number, unit_cents: number) => ({ slug, quantity, variant_id, unit_cents });

  it("pois päältä oletuksena, voimassa vain 27.11.-1.12. Suomen aikaa", () => {
    expect(TPAITAPARI_KAMPANJA.kaytossa).toBe(false);
    expect(tpaitapariVoimassa(TPAITAPARI_KAMPANJA, nyt)).toBe(false);
    expect(tpaitapariVoimassa(kampanja, nyt)).toBe(true);
    expect(tpaitapariVoimassa(kampanja, new Date("2026-11-26T21:59:00Z"))).toBe(false);
    expect(tpaitapariVoimassa(kampanja, new Date("2026-11-26T22:01:00Z"))).toBe(true);
    expect(tpaitapariVoimassa(kampanja, new Date("2026-12-01T21:59:00Z"))).toBe(true);
    expect(tpaitapariVoimassa(kampanja, new Date("2026-12-01T22:01:00Z"))).toBe(false);
  });
  it("kaksi t-paitaa maksaa 44,90 €, korvaa -5 %:n, kate positiivinen", () => {
    const k = sovellaKorialennus([rivi("testi-t-paita", 2, 1, 2490)], bySlug, 6.9, { kampanja, nyt });
    expect(k.tyyppi).toBe("tpaitapari");
    expect(k.alennus).toBe(4.9);
    expect(k.nettokate).toBeGreaterThan(10);
  });
  it("pariton paita jakaa parin alennuksen, t-paita + huppari saa -5 %", () => {
    const k3 = sovellaKorialennus([rivi("testi-t-paita", 3, 1, 2490)], bySlug, 6.9, { kampanja, nyt });
    expect(k3.tyyppi).toBe("tpaitapari");
    expect(r2(k3.alennus)).toBeGreaterThanOrEqual(4.9);
    const th = sovellaKorialennus([rivi("testi-t-paita", 1, 1, 2490), rivi("testi-huppari", 1, 11, 4990)], bySlug, 6.9, { kampanja, nyt });
    expect(th.tyyppi).toBe("prosentti");
  });
  it("kampanjan ulkopuolella ennallaan", () => {
    const k = sovellaKorialennus([rivi("testi-t-paita", 2, 1, 2490)], bySlug, 6.9, { nyt });
    expect(k.tyyppi).toBe("prosentti");
    expect(k.alennus).toBe(2.48);
  });
});
