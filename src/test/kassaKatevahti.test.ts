/**
 * Kassan lopullinen katevahti (3.11.2026, api/_lib/kassa.js ja api/_lib/tuotteet.js). Tiinan korvausmuki 21.10.2026 jäi
 * -10,07 €:oon: myynti 16,70 € (alv 0 13,31 €), Printifyn kulu 5,88 € + toimitus 17,00 € (22,88 €) ja Stripe 0,50 €.
 * Kassalla jokainen tilaus jättää vähintään 7 € nettokatetta kortin kululla, tai sitä ei voi maksaa.
 *
 * Kulut: src/test/fixtures/kate-kaikki-2026-11-03.json (kaikki 1 173 myynnissä olevaa tuotetta, tuotannon /api/products
 * 3.11.2026, variant_map ilman saatavuudettomia). Kahden tuotteen yhdistelmät lasketaan tuoteluokittain: tilauksen kate
 * riippuu vain kategoriasta, koon hinnasta, Printifyn kulusta, toimituskuluista ja painotalosta.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { laskeTilaus, laskettuNettokate } from "../../api/_lib/kassa.js";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { valmisteleRivi, myynnissa } from "../../api/_lib/tuotteet.js";
import { onPainolaatuPiilotettu } from "../../api/_lib/painolaatu.js";
import { TILAUKSEN_MIN_KATE_EUROA, LISATUOTE_KATEGORIAT } from "../../api/_lib/vakiot.js";

type Tuote = { id: string; slug: string; name?: string; printify_product_id?: string; category: string; price: number; variants: Record<string, unknown> & { variant_map: Record<string, number>; costs?: Record<string, number>; size_prices?: Record<string, number> } };
const KAIKKI = (JSON.parse(readFileSync("src/test/fixtures/kate-kaikki-2026-11-03.json", "utf8")) as { tuotteet: Tuote[] }).tuotteet;
/** Kassan myymät: EU:n ulkopuolella painettava koriste (api/_lib/eu-reititys.js) ja alle 90 DPI:n painotiedostot
 * (api/_lib/painolaatu.js) eivät ole myynnissä. */
const MYYNNISSA = KAIKKI.filter((t) => myynnissa(t));
const NYT = new Date("2026-11-10T10:00:00Z");
const osoite = { address: "K 1", zip: "00100", city: "Hki" };
const tilaa = (tuotteet: Tuote[], items: { id: string; quantity: number; color: string; size: string }[]) =>
  laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: osoite }, tuotteet, null, { korialennus: { nyt: NYT } });
const SALLITUT_ESTOT = new Set(["low_margin", "order_low_margin", "addon_only", "variant_unavailable"]);

/** Tilaus menee läpi vähintään 7 €:n katteella, tai kassa estää sen tunnetulla syyllä. Palauttaa "ok" tai eston syyn. */
function tarkista(tuotteet: Tuote[], items: { id: string; quantity: number; color: string; size: string }[], kuvaus: string): string {
  let r;
  try {
    r = tilaa(tuotteet, items);
  } catch (e) {
    const vaihe = (e as { vaihe?: string }).vaihe;
    if (!vaihe || !SALLITUT_ESTOT.has(vaihe)) throw new Error(`${kuvaus}: ${(e as Error).message}`);
    return vaihe;
  }
  const k = laskettuNettokate(r, tuotteet);
  if (!(k >= TILAUKSEN_MIN_KATE_EUROA)) throw new Error(`${kuvaus}: kate ${k} € (toimitus ${r.shipping} €)`);
  return "ok";
}

describe("Kassan katevahti: kaikki myynnissä olevat tuotteet", () => {
  it("jokainen yhden tuotteen tilaus (kaikki variantit) jättää vähintään 7 € tai estetään", () => {
    expect(KAIKKI.length).toBeGreaterThan(1100);
    const tulos: Record<string, number> = {};
    // Pois myynnistä: EU:n ulkopuolella painettava koriste ja painolaadun takia piilotetut (api/_lib/painolaatu.js).
    expect(MYYNNISSA.some((t) => t.category === "koristeet")).toBe(false);
    expect(MYYNNISSA.some((t) => onPainolaatuPiilotettu(t.slug))).toBe(false);
    for (const t of MYYNNISSA) {
      for (const [avain] of myytavatVariantit(t) as [string, number][]) {
        const [color, size] = avain.split("|");
        const s = tarkista(KAIKKI, [{ id: t.id, quantity: 1, color, size }], `${t.slug} ${avain}`);
        tulos[s] = (tulos[s] || 0) + 1;
      }
    }
    expect(tulos.ok).toBeGreaterThan(15000);
    // Tarra myydään vain toisen tuotteen lisänä.
    expect(Object.keys(tulos).filter((k) => k !== "ok" && k !== "addon_only")).toEqual([]);
  }, 240000);

  it("jokainen kahden tuotteen yhdistelmä tuoteluokittain (myös sama tuote kahdesti) jättää vähintään 7 € tai estetään", () => {
    // Tuoteluokka: kategoria, painotalo, toimituskulut ja variantin (koon hinta, kulu). Jokaisesta luokasta yksi edustaja.
    const luokat = new Map<string, { t: Tuote; avain: string }>();
    for (const t of MYYNNISSA) {
      const v = t.variants as { shipping_cents?: number; shipping_additional_cents?: number; print_provider_id?: number; costs?: Record<string, number>; size_prices?: Record<string, number> };
      for (const [avain, id] of myytavatVariantit(t) as [string, number][]) {
        const koko = avain.split("|")[1];
        const k = [t.category, t.price, v.size_prices?.[koko] ?? "", v.costs?.[String(id)], v.shipping_cents, v.shipping_additional_cents, v.print_provider_id].join("|");
        if (!luokat.has(k)) luokat.set(k, { t, avain });
      }
    }
    const edustajat = [...luokat.values()];
    expect(edustajat.length).toBeGreaterThan(20);
    let pareja = 0;
    for (let i = 0; i < edustajat.length; i++) {
      for (let j = i; j < edustajat.length; j++) {
        const a = edustajat[i], b = edustajat[j];
        const [ca, sa] = a.avain.split("|");
        const [cb, sb] = b.avain.split("|");
        const items = a.t.id === b.t.id && a.avain === b.avain
          ? [{ id: a.t.id, quantity: 2, color: ca, size: sa }]
          : [{ id: a.t.id, quantity: 1, color: ca, size: sa }, { id: b.t.id, quantity: 1, color: cb, size: sb }];
        const s = tarkista(KAIKKI, items, `${a.t.slug} ${a.avain} + ${b.t.slug} ${b.avain}`);
        if (s !== "ok" && !(LISATUOTE_KATEGORIAT.includes(a.t.category) && LISATUOTE_KATEGORIAT.includes(b.t.category))) {
          throw new Error(`${a.t.slug} + ${b.t.slug}: estetty (${s}), vaikka kumpikin myydään yksin`);
        }
        pareja++;
      }
    }
    expect(pareja).toBe((edustajat.length * (edustajat.length + 1)) / 2);
  }, 240000);
});

describe("Tiinan korvausmuki ja muut tappiolliset yhdistelmät", () => {
  // EU-muki (OPT OnDemand, CZ) 21.10.2026: kulu 5,88 € + toimitus 17,00 €.
  const muki = (hinta: number): Tuote => ({
    id: "muki", slug: "muki-testi", name: "Muki", printify_product_id: "m1", category: "seinataulut", price: hinta,
    variants: { variant_map: { "Valkoinen|11oz": 1 }, costs: { 1: 588 }, shipping_cents: 1700, shipping_additional_cents: 1700, print_provider_id: 30 },
  });

  it("Tiinan muki 9,80 € + toimitus 6,90 €: -10,07 € ennen, kassa estää nyt", () => {
    // Laskelma: 16,70 / 1,255 = 13,31; Stripe 16,70 x 1,5 % + 0,25 = 0,50; 13,31 - 22,88 - 0,50 = -10,07.
    expect(Math.round((16.7 / 1.255 - 22.88 - (16.7 * 0.015 + 0.25)) * 100) / 100).toBe(-10.07);
    // Rivin kate on negatiivinen: tuote ei ole myynnissä (hidden_category) eikä sitä voi maksaa (low_margin).
    for (const hinta of [9.8, 19.9]) {
      let vaihe = "";
      try { tilaa([muki(hinta)], [{ id: "muki", quantity: 1, color: "Valkoinen", size: "11oz" }]); } catch (e) { vaihe = (e as { vaihe: string }).vaihe; }
      expect(["hidden_category", "low_margin"]).toContain(vaihe);
    }
  });

  it("tuote, joka läpäisee rivin prosenttirajan mutta jää tilauksena alle 7 €:n, estetään ja piilotetaan", () => {
    // 29,90 € + 6,90 € = 36,80 € (alv 0 29,32 €), kulut 15,00 € + toimitus 7,00 €, Stripe 0,80 €: kate 6,52 € (22 %).
    // Rivin 20 %:n raja täyttyy, mutta tilaus jää alle 7 €:n.
    const t: Tuote = { id: "x", slug: "x", name: "X", printify_product_id: "x1", category: "seinataulut", price: 29.9, variants: { variant_map: { "Musta|A3": 1 }, costs: { 1: 1500 }, shipping_cents: 700, shipping_additional_cents: 700, print_provider_id: 30 } };
    expect(() => tilaa([t], [{ id: "x", quantity: 1, color: "Musta", size: "A3" }])).toThrow(expect.objectContaining({ vaihe: "order_low_margin" }));
    expect(valmisteleRivi(t).unavailable_variants).toEqual(["Musta|A3"]);
    // Lisätuotetta ei piiloteta yksin tilaamisen katteen takia.
    expect(valmisteleRivi({ ...t, category: LISATUOTE_KATEGORIAT[0] }).unavailable_variants ?? []).toEqual([]);
  });

  it("nykyiset tuotteet eivät piiloudu uudella säännöllä", () => {
    const piilotettu = KAIKKI.filter((t) => !LISATUOTE_KATEGORIAT.includes(t.category))
      .filter((t) => ((valmisteleRivi(t).unavailable_variants as string[] | undefined) ?? []).length > 0);
    expect(piilotettu.map((t) => t.slug)).toEqual([]);
  });
});
