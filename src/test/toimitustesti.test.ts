/**
 * Ilmaisen toimituksen hintatesti (4.11.2026, api/_lib/toimitustesti.js): B:n hinnat, kassan sääntö yhden ja usean
 * tuotteen korille, kate B >= A ja >= 7 € kaikissa myynnissä olevissa varianteissa, selaimen kori ja päätössääntö.
 */
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { laskeTilaus, laskettuNettokate } from "../../api/_lib/kassa.js";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { myynnissa } from "../../api/_lib/tuotteet.js";
import { TILAUKSEN_MIN_KATE_EUROA, LISATUOTE_KATEGORIAT, TOIMITUS } from "../../api/_lib/vakiot.js";
import { sisaltavaHinta, koostaToimitustesti, toimitustestiRivit, koskee } from "../../api/_lib/toimitustesti.js";
import { asetaAbVersio } from "@/lib/abTestit";
import { naytettavaHinta } from "@/lib/toimitustesti";
import { toimitusTila } from "@/lib/ostoskori";
import type { Product } from "@/types/product";

type Tuote = { id: string; slug: string; category: string; price: number; original_price?: number; variants: Record<string, unknown> & { variant_map: Record<string, number> } };
const KAIKKI = (JSON.parse(readFileSync("src/test/fixtures/kate-kaikki-2026-11-03.json", "utf8")) as { tuotteet: Tuote[] }).tuotteet;
const MYYNNISSA = KAIKKI.filter((t) => myynnissa(t));
const NYT = new Date("2026-11-10T10:00:00Z");
const osoite = { address: "K 1", zip: "00100", city: "Hki" };
type Item = { id: string; quantity: number; color: string; size: string };
const tilaa = (items: Item[], versio: "a" | "b", alennus: { type: string; value: number } | null = null, tuotteet: Tuote[] = KAIKKI) =>
  laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: osoite }, tuotteet, alennus, { korialennus: { nyt: NYT }, toimitusVersio: versio });
const eka = (kategoria: string, hinta?: number) => {
  const t = MYYNNISSA.find((x) => x.category === kategoria && !(Number(x.original_price) > x.price) && (hinta === undefined || x.price === hinta))!;
  const [avain] = (myytavatVariantit(t) as [string, number][])[0];
  const [color, size] = avain.split("|");
  return { t, item: { id: t.id, quantity: 1, color, size } };
};

afterEach(() => asetaAbVersio("toimitus", "a"));

describe("B:n hinta: hinta + 6,90 € ylöspäin ,90:ään", () => {
  it("käyttäjän esimerkit ja hupparit", () => {
    expect(sisaltavaHinta(24.9)).toBe(31.9);
    expect(sisaltavaHinta(27.9)).toBe(34.9);
    expect(sisaltavaHinta(52.9)).toBe(59.9);
    expect(sisaltavaHinta(29)).toBe(35.9);
    expect(sisaltavaHinta(30.95)).toBe(37.9);
    // Ei koskaan alle A:n summan, enintään 0,99 € yli.
    for (let c = 1000; c < 8000; c += 7) {
      const h = c / 100;
      const b = sisaltavaHinta(h);
      expect(b).toBeGreaterThanOrEqual(Math.round((h + TOIMITUS) * 100) / 100);
      expect(b - (h + TOIMITUS)).toBeLessThan(1);
    }
  });
  it("koskee vain yhden kappaleen täyden toimitusmaksun tilausta ilman alennusta", () => {
    expect(koskee({ versio: "b", toimitusKpl: 1, toimitus: 6.9 })).toBe(true);
    expect(koskee({ versio: "a", toimitusKpl: 1, toimitus: 6.9 })).toBe(false);
    expect(koskee({ versio: "b", toimitusKpl: 2, toimitus: 0 })).toBe(false);
    expect(koskee({ versio: "b", toimitusKpl: 1, toimitus: 0 })).toBe(false);
    expect(koskee({ versio: "b", toimitusKpl: 1, toimitus: 6.9, alennus: true })).toBe(false);
  });
});

describe("Kassa: versio B", () => {
  it("t-paita 24,90 €: B veloittaa 31,90 € ilman toimitusmaksua, A 31,80 €", () => {
    const { item, t } = eka("t-paidat", 24.9);
    expect(t.price).toBe(24.9);
    const a = tilaa([item], "a");
    const b = tilaa([item], "b");
    expect(a).toMatchObject({ shipping: TOIMITUS, total: 31.8, shipping_included: false });
    expect(b).toMatchObject({ shipping: 0, total: 31.9, shipping_included: true, toimitus_versio: "b", discount: 0, subtotal: 31.9 });
    expect(b.rivit[0]).toMatchObject({ unit_cents: 3190, unit_price: 31.9, perushinta: 24.9, toimitus_sisaltyy: true });
  });
  it("kaksi tuotetta, alennuskoodi tai alennusmyynti: B = A", () => {
    const p = eka("t-paidat", 24.9).item;
    const h = eka("hupparit").item;
    for (const items of [[p, h], [{ ...p, quantity: 2 }]]) expect(tilaa(items, "b").total).toBe(tilaa(items, "a").total);
    const koodi = { type: "percent", value: 5 };
    expect(tilaa([h], "b", koodi).total).toBe(tilaa([h], "a", koodi).total);
    const ale = KAIKKI.map((t) => (t.id === eka("t-paidat", 24.9).t.id ? { ...t, original_price: 29.9 } : t));
    expect(tilaa([p], "b", null, ale).total).toBe(tilaa([p], "a", null, ale).total);
  });
  it("kate B >= A ja >= 7 € jokaisessa yhden tuotteen tilauksessa (kaikki myynnissä olevat variantit)", () => {
    let b = 0;
    for (const t of MYYNNISSA) {
      if (LISATUOTE_KATEGORIAT.includes(t.category)) continue;
      for (const [avain] of myytavatVariantit(t) as [string, number][]) {
        const [color, size] = avain.split("|");
        const item = { id: t.id, quantity: 1, color, size };
        let ra, rb;
        try { ra = tilaa([item], "a"); } catch { expect(() => tilaa([item], "b")).toThrow(); continue; }
        rb = tilaa([item], "b");
        const ka = laskettuNettokate(ra, KAIKKI), kb = laskettuNettokate(rb, KAIKKI);
        expect(kb).toBeGreaterThanOrEqual(ka);
        expect(kb).toBeGreaterThanOrEqual(TILAUKSEN_MIN_KATE_EUROA);
        expect(rb.total - ra.total).toBeGreaterThanOrEqual(0);
        expect(rb.total - ra.total).toBeLessThan(1);
        if (rb.shipping_included) b++;
      }
    }
    expect(b).toBeGreaterThan(10000);
  }, 300_000);
});

describe("Selain: näytettävä hinta ja kori", () => {
  const paita = { ...eka("t-paidat", 24.9).t, images: [], type: undefined } as unknown as Product;
  it("A: perushinta, B: hinta sisältää toimituksen", () => {
    expect(naytettavaHinta(paita, null, "a")).toBe(24.9);
    expect(naytettavaHinta(paita, null, "b")).toBe(31.9);
    expect(naytettavaHinta({ ...paita, original_price: 29.9 }, null, "b")).toBe(24.9);
  });
  it("B:n kori: yksi paita ilmaisella toimituksella 31,90 €, kaksi paitaa kuten A", () => {
    asetaAbVersio("toimitus", "b");
    const yksi = toimitusTila([{ product: paita, quantity: 1 }]);
    expect(yksi).toMatchObject({ ilmainen: true, toimitus: 0, sisaltyy: 7, sisaltyvaTuote: paita.id });
    expect(toimitusTila([{ product: paita, quantity: 2 }])).toMatchObject({ ilmainen: true, toimitus: 0, sisaltyy: 0 });
    expect(toimitusTila([{ product: paita, quantity: 1 }], { alennus: true })).toMatchObject({ toimitus: TOIMITUS, sisaltyy: 0 });
    asetaAbVersio("toimitus", "a");
    expect(toimitusTila([{ product: paita, quantity: 1 }])).toMatchObject({ toimitus: TOIMITUS, sisaltyy: 0 });
  });
});

describe("Päätössääntö: 300 aitoa tuotesivun katselua kummassakin, voittaja kate per käynti", () => {
  const rivit = (a: number, b: number) => [
    { versio: "a", tapahtuma: "kaynti", n: 500 }, { versio: "a", tapahtuma: "tuotesivu", n: a }, { versio: "a", tapahtuma: "kori", n: 20 },
    { versio: "b", tapahtuma: "kaynti", n: 480 }, { versio: "b", tapahtuma: "tuotesivu", n: b }, { versio: "b", tapahtuma: "kori", n: 25 },
  ];
  const ostot = [{ versio: "a", n: 3, kate: 30 }, { versio: "b", n: 4, kate: 36 }];
  it("kesken alle rajan", () => {
    const s = koostaToimitustesti(rivit(299, 400), ostot);
    expect(s.voittaja).toBeNull();
    expect(s.paatos).toMatch(/kesken/);
  });
  it("voittaja suuremmalla katteella per käynti", () => {
    const s = koostaToimitustesti(rivit(300, 310), ostot);
    expect(s.a.katePerKaynti).toBe(0.06);
    expect(s.b.katePerKaynti).toBe(0.075);
    expect(s.voittaja).toBe("b");
    expect(toimitustestiRivit({ ...s, alku: "2026-11-04", loppu: "2026-11-20" })[0]).toMatch(/voittaja B/);
  });
});
