/**
 * Ensimmäisen tilauksen -5 % A/B-testi (5.11.2026, api/_lib/ensitilaus.js) ja 7 €:n katesääntö kappaletta kohden
 * (api/_lib/katesaanto.js): kassan säännöt hintatestin (toimitustesti) kaikissa yhdistelmissä A/A, A/B, B/A ja B/B,
 * TERVE-koodin kanssa ei kahta alennusta, meemipaidan määräalennus, selaimen merkki, evästeet ja päätössääntö.
 */
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { laskeTilaus, laskettuNettokate, KassaVirhe } from "../../api/_lib/kassa.js";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { myynnissa } from "../../api/_lib/tuotteet.js";
import { LISATUOTE_KATEGORIAT } from "../../api/_lib/vakiot.js";
import { suurinSallittuAlennus, riittaaPerKpl, katePerKpl, MIN_KATE_PER_KPL } from "../../api/_lib/katesaanto.js";
import { ensitilausAlennus, alennusSentit, koostaEnsitilaustesti, ensitilaustestiRivit, ENSITILAUS_PROSENTTI, ENSITILAUSTESTI_ALKAEN, ENSITILAUSTESTI_MIN_KATSELUT } from "../../api/_lib/ensitilaus.js";
import { esimerkkiHinnat } from "../../api/_lib/yritysmyynti.js";
import { asetaAbVersio, abVersio, ENSITILAUS_EVASTE, TOIMITUS_EVASTE } from "@/lib/abTestit";
import { tuotteenEnsitilaus, ensitilausKorissa, ENSITILAUS_MERKKI } from "@/lib/ensitilaus";
import { MEEMI_PORRAS_TEKSTI } from "@/data/yrityksetPage";
import type { Product } from "@/types/product";

type Tuote = { id: string; slug: string; category: string; price: number; original_price?: number; variants: Record<string, unknown> & { variant_map: Record<string, number> } };
const KAIKKI = (JSON.parse(readFileSync("src/test/fixtures/kate-kaikki-2026-11-03.json", "utf8")) as { tuotteet: Tuote[] }).tuotteet;
const MYYNNISSA = KAIKKI.filter((t) => myynnissa(t));
const NYT = new Date("2026-11-10T10:00:00Z");
const osoite = { address: "K 1", zip: "00100", city: "Hki" };
type Item = { id: string; quantity: number; color: string; size: string };
type V = "a" | "b";
const tilaa = (items: Item[], toimitus: V, ensitilaus: V, { ensimmainen = true, alennus = null as { type: string; value: number; ensitilaus?: boolean } | null } = {}) =>
  laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: osoite }, KAIKKI, alennus, { korialennus: { nyt: NYT }, toimitusVersio: toimitus, ensitilausVersio: ensitilaus, ensimmainenTilaus: ensimmainen });
const eka = (kategoria: string, hinta?: number, koko = "M") => {
  const t = MYYNNISSA.find((x) => x.category === kategoria && !(Number(x.original_price) > x.price) && (hinta === undefined || x.price === hinta))!;
  const v = (myytavatVariantit(t) as [string, number][]).find(([a]) => a.endsWith(`|${koko}`)) ?? (myytavatVariantit(t) as [string, number][])[0];
  const [color, size] = v[0].split("|");
  return { t, item: { id: t.id, quantity: 1, color, size } };
};
const kpl = (l: { rivit: { quantity: number; type?: string }[] }) => l.rivit.filter((r) => r.type !== "giftcard").reduce((s, r) => s + r.quantity, 0);

afterEach(() => {
  asetaAbVersio("ensitilaus", "a");
  asetaAbVersio("toimitus", "a");
});

describe("Katesääntö 7 € kappaleelta (api/_lib/katesaanto.js)", () => {
  it("suurin sallittu porras tai ei mitään", () => {
    const kate = (p: number) => ({ 14: 6.5, 12: 6.89, 10: 7.28 } as Record<number, number>)[p];
    expect(suurinSallittuAlennus([10, 12, 14], kate)).toBe(10);
    expect(suurinSallittuAlennus([10, 12, 14], kate, 6.8)).toBe(12);
    expect(suurinSallittuAlennus([10], () => 6.68)).toBeNull();
    expect(suurinSallittuAlennus([10], () => null)).toBeNull();
    expect(suurinSallittuAlennus([10], () => NaN)).toBeNull();
    expect(MIN_KATE_PER_KPL).toBe(7);
    expect(riittaaPerKpl(14, 2)).toBe(true);
    expect(riittaaPerKpl(13.99, 2)).toBe(false);
    expect(katePerKpl(null, 1)).toBe(-Infinity);
    expect(katePerKpl(10, 0)).toBe(-Infinity);
  });
  it("tarjousarvio ja kassa käyttävät samaa sääntöä meemipaidalle: 10 kpl ei porrasta, 25 ja 50 kpl -10 %", () => {
    expect(esimerkkiHinnat("meemipaita").map((e) => e.alennusProsentti)).toEqual([0, 10, 10]);
    const { item } = eka("t-paidat", 24.9);
    for (const [n, odotus] of [[10, undefined], [25, 10], [50, 10]] as const) {
      const k = Math.ceil(n / 3);
      const items = [{ ...item, size: "M", quantity: k }, { ...item, size: "L", quantity: k }, { ...item, size: "XL", quantity: n - 2 * k }];
      const l = tilaa(items, "a", "a");
      expect(l.rivit[0].maaraalennus_prosentti).toBe(odotus);
      expect(laskettuNettokate(l, KAIKKI) / n).toBeGreaterThanOrEqual(7);
    }
    expect(MEEMI_PORRAS_TEKSTI).toBe("24,90 €:n meemipaidoissa määräalennus on 25 paidasta -10 % ja 50 paidasta -10 %.");
  });
  it("27,90 €:n t-paidat saavat kaikki portaat", () => {
    const { item } = eka("t-paidat", 27.9);
    for (const [n, odotus] of [[10, 10], [25, 12], [50, 14]] as const) {
      const k = Math.ceil(n / 3);
      const l = tilaa([{ ...item, size: "M", quantity: k }, { ...item, size: "L", quantity: k }, { ...item, size: "XL", quantity: n - 2 * k }], "a", "a");
      expect(l.rivit[0].maaraalennus_prosentti).toBe(odotus);
      expect(laskettuNettokate(l, KAIKKI) / n).toBeGreaterThanOrEqual(7);
    }
  });
});

describe("Kassa: ensimmäisen tilauksen -5 %", () => {
  it("esimerkit: 24,90 € ei koskaan, 27,90 € ja huppari A/B ja B/B, B/A ja A/A ei alennusta", () => {
    const odotus: [string, number | undefined, Record<string, number>][] = [
      // [kategoria, hinta, { "toimitus/ensitilaus": ensitilauksen alennus }]
      ["t-paidat", 24.9, { "a/a": 0, "a/b": 0, "b/a": 0, "b/b": 0 }],
      ["t-paidat", 27.9, { "a/a": 0, "a/b": 1.39, "b/a": 0, "b/b": 1.39 }],
      ["hupparit", undefined, { "a/a": 0, "a/b": 2.64, "b/a": 0, "b/b": 2.64 }],
    ];
    for (const [kat, hinta, rivit] of odotus) {
      const { item } = eka(kat, hinta);
      for (const [k, alennus] of Object.entries(rivit)) {
        const [tv, ev] = k.split("/") as [V, V];
        const l = tilaa([item], tv, ev);
        expect(l.first_order_discount, `${kat} ${hinta} ${k}`).toBe(alennus);
        expect(laskettuNettokate(l, KAIKKI)).toBeGreaterThanOrEqual(7);
        if (alennus) expect(l.rivit[0]).toMatchObject({ ensitilaus_prosentti: 5 });
      }
    }
    // B/B: alennus perushinnasta (toimitus ei saa alennusta): 27,90 € -> 34,90 € - 1,39 € = 33,51 €, toimitus 0 €.
    const b = tilaa([eka("t-paidat", 27.9).item], "b", "b");
    expect(b).toMatchObject({ shipping: 0, total: 33.51, shipping_included: true, ensitilaus_versio: "b" });
  });
  it("ei alennusta, kun tilaus ei ole ensimmäinen tai versio on A", () => {
    const { item } = eka("t-paidat", 27.9);
    expect(tilaa([item], "a", "b", { ensimmainen: false }).first_order_discount).toBe(0);
    expect(tilaa([item], "a", "a").first_order_discount).toBe(0);
    expect(tilaa([item], "a", "a").ensitilaus_versio).toBe("a");
  });
  it("enintään yksi 5 %: TERVE-koodi tai muu koodi korvaa ensitilauksen alennuksen", () => {
    const { item } = eka("t-paidat", 27.9);
    const terve = { type: "percent", value: 5, ensitilaus: true };
    const l = tilaa([item], "a", "b", { alennus: terve });
    expect(l.first_order_discount).toBe(0);
    expect(l.discount).toBe(1.39);
    expect(l.rivit[0].ensitilaus_prosentti).toBeUndefined();
  });
  it("ei kahden tuotteen alennuksen kanssa", () => {
    const { item } = eka("t-paidat", 27.9);
    const l = tilaa([{ ...item, quantity: 2 }], "a", "b");
    expect(l.basket_discount).toBeGreaterThan(0);
    expect(l.first_order_discount).toBe(0);
  });
  it("TERVE-koodi: 7 € kappaleelta, myös kahden paidan tilauksessa", () => {
    const terve = { type: "percent", value: 5, ensitilaus: true };
    expect(() => tilaa([eka("t-paidat", 24.9).item], "a", "a", { alennus: terve })).toThrow(KassaVirhe);
    const kaksi = tilaa([{ ...eka("t-paidat", 27.9).item, quantity: 2 }], "a", "a", { alennus: terve });
    expect(laskettuNettokate(kaksi, KAIKKI) / 2).toBeGreaterThanOrEqual(7);
  });
  it("jokainen myynnissä oleva variantti, A/B ja B/B: alennus vain, kun kate jää vähintään 7 € kappaleelta", () => {
    let annettu = 0;
    for (const t of MYYNNISSA) {
      if (LISATUOTE_KATEGORIAT.includes(t.category)) continue;
      for (const [avain] of myytavatVariantit(t) as [string, number][]) {
        const [color, size] = avain.split("|");
        const item = { id: t.id, quantity: 1, color, size };
        for (const tv of ["a", "b"] as V[]) {
          let l;
          try { l = tilaa([item], tv, "b"); } catch { continue; }
          if (l.first_order_discount > 0) {
            annettu++;
            expect(laskettuNettokate(l, KAIKKI) / kpl(l)).toBeGreaterThanOrEqual(7);
          }
        }
      }
    }
    expect(annettu).toBeGreaterThan(1000);
  }, 300_000);
});

describe("Selain: merkki tuotesivulla ja korissa", () => {
  const tuote = (kat: string, hinta?: number) => ({ ...eka(kat, hinta).t, images: [], type: undefined }) as unknown as Product;
  it("versio A ei näytä merkkiä; B näyttää vain, kun alennus koskee", () => {
    const p27 = tuote("t-paidat", 27.9);
    const p24 = tuote("t-paidat", 24.9);
    expect(tuotteenEnsitilaus(p27, { versio: "a", toimitus: "a" })).toBe(false);
    expect(tuotteenEnsitilaus(p27, { koko: "M", versio: "b", toimitus: "a" })).toBe(true);
    expect(tuotteenEnsitilaus(p27, { koko: "M", versio: "b", toimitus: "b" })).toBe(true);
    expect(tuotteenEnsitilaus(p24, { versio: "b", toimitus: "a" })).toBe(false);
    expect(tuotteenEnsitilaus(p24, { versio: "b", toimitus: "b" })).toBe(false);
    expect(ENSITILAUS_MERKKI).toBe("Ensimmäinen tilaus: −5 %");
  });
  it("kori: sama tulos kuin kassalla, ei muun alennuksen kanssa", () => {
    const p27 = tuote("t-paidat", 27.9);
    const { item } = eka("t-paidat", 27.9);
    const rivi = { product: p27, quantity: 1, selectedSize: item.size, selectedColor: item.color };
    expect(ensitilausKorissa([rivi], false, "b")).toEqual({ kaytossa: true, alennus: tilaa([item], "a", "b").first_order_discount });
    expect(ensitilausKorissa([rivi], true, "b").kaytossa).toBe(false);
    expect(ensitilausKorissa([rivi], false, "a").kaytossa).toBe(false);
    expect(ensitilausKorissa([{ ...rivi, product: tuote("t-paidat", 24.9) }], false, "b").kaytossa).toBe(false);
  });
});

describe("Versio: eväste hk_ab_ensitilaus, pakotus ?ab=ensitilaus-b, riippumaton hintatestistä", () => {
  it("pakotus kirjoittaa vain oman evästeen", () => {
    window.history.replaceState(null, "", "/?ab=ensitilaus-b");
    asetaAbVersio("ensitilaus", null);
    asetaAbVersio("toimitus", "a");
    expect(abVersio("ensitilaus")).toBe("b");
    expect(document.cookie).toContain(`${ENSITILAUS_EVASTE}=b`);
    expect(document.cookie).not.toContain(`${TOIMITUS_EVASTE}=`);
    expect(abVersio("toimitus")).toBe("a");
    window.history.replaceState(null, "", "/?ab=ensitilaus-a");
    asetaAbVersio("ensitilaus", null);
    expect(abVersio("ensitilaus")).toBe("a");
    expect(document.cookie).toContain(`${ENSITILAUS_EVASTE}=a`);
    window.history.replaceState(null, "", "/");
    document.cookie = `${ENSITILAUS_EVASTE}=; path=/; max-age=0`;
  });
  it("alkupäivä 5.11.2026", () => {
    expect(ENSITILAUSTESTI_ALKAEN).toBe("2026-11-05");
  });
});

describe("Päätössääntö: 300 aitoa tuotesivun katselua kummassakin, voittaja kate per käynti", () => {
  const rivit = (a: number, b: number) => [
    { versio: "a", tapahtuma: "kaynti", n: 500 }, { versio: "a", tapahtuma: "tuotesivu", n: a },
    { versio: "b", tapahtuma: "kaynti", n: 500 }, { versio: "b", tapahtuma: "tuotesivu", n: b },
  ];
  const ostot = [{ versio: "a", n: 3, kate: 30 }, { versio: "b", n: 5, kate: 40 }];
  it("kesken alle rajan, voittaja rajan jälkeen", () => {
    expect(ENSITILAUSTESTI_MIN_KATSELUT).toBe(300);
    expect(koostaEnsitilaustesti(rivit(299, 400), ostot).voittaja).toBeNull();
    const s = koostaEnsitilaustesti(rivit(300, 300), ostot);
    expect(s.voittaja).toBe("b");
    const r = ensitilaustestiRivit({ ...s, alku: "2026-11-05", loppu: "2026-11-20", b: { ...s.b, alennettu: 2, alennus: 3.5 } });
    expect(r[0]).toMatch(/Ensimmäisen tilauksen −5 % -testi 2026-11-05–2026-11-20: voittaja B/);
    expect(r[2]).toMatch(/alennus 2 tilauksessa yhteensä 3,50 €/);
  });
  it("alennuksen pyöristys sentteinä", () => {
    expect(alennusSentit(2790)).toBe(139);
    expect(alennusSentit(2490)).toBe(124);
    expect(ENSITILAUS_PROSENTTI).toBe(5);
    expect(ensitilausAlennus([], 0).kaytossa).toBe(false);
  });
});
