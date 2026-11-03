/**
 * Maksutavat ja 7 €:n kate (3.11.2026, api/_lib/maksutavat.js): kortti ja Klarna jättävät tilaukselle vähintään 7 €
 * kyseisen maksutavan kululla. MobilePay näytetään aina (Aarnin päätös 3.11.2026), ja sen kate on vähintään 7 € - 0,06 €. Tuotannon kulut src/test/fixtures/kate-tilannekuva.json.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MAKSUTAPAKULUT, MOBILEPAY_POIKKEAMA_EUROA, sallitutMaksutavat, istunnonMaksutavat, RYHMA_MAKSUTAVAT } from "../../api/_lib/maksutavat.js";
import { laskeTilaus, laskettuNettokate } from "../../api/_lib/kassa.js";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { TILAUKSEN_MIN_KATE_EUROA, LISATUOTE_KATEGORIAT } from "../../api/_lib/vakiot.js";
import { korinMaksutavat } from "@/lib/ostoskori";
import { myynnissa } from "../../api/_lib/tuotteet.js";
import type { Product } from "@/types/product";

type T = { id: string; slug: string; category: string; variants: { variant_map: Record<string, number> } };
const KAIKKI = (JSON.parse(readFileSync("src/test/fixtures/kate-tilannekuva.json", "utf8")) as { tuotteet: T[] }).tuotteet;
const tilaus = (items: { id: string; quantity: number; size: string; color: string }[]) =>
  laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: { address: "K 1", zip: "00100", city: "Hki" } }, KAIKKI, null, { korialennus: { nyt: new Date("2026-11-10T10:00:00Z") } });

describe("Maksutavat: kate vähintään 7 € jokaisella tarjotulla maksutavalla", () => {
  it("yhden tuotteen tilaukset, kaikki tuotteet ja variantit", () => {
    const pois: Record<string, number> = { mobilepay: 0, klarna: 0 };
    let n = 0;
    let mobilepayAlle7 = 0;
    let mobilepayPienin = Infinity;
    for (const t of KAIKKI) {
      if (LISATUOTE_KATEGORIAT.includes(t.category) || !myynnissa(t)) continue;
      for (const [avain] of myytavatVariantit(t) as [string, number][]) {
        const [color, size] = avain.split("|");
        const r = tilaus([{ id: t.id, quantity: 1, size, color }]);
        const s = sallitutMaksutavat((kulu) => laskettuNettokate(r, KAIKKI, kulu));
        expect(s.tavat.slice(0, 2)).toEqual(["card", "mobilepay"]);
        for (const tapa of s.tavat) {
          const k = laskettuNettokate(r, KAIKKI, MAKSUTAPAKULUT[tapa as keyof typeof MAKSUTAPAKULUT]);
          const raja = tapa === "mobilepay" ? TILAUKSEN_MIN_KATE_EUROA - MOBILEPAY_POIKKEAMA_EUROA : TILAUKSEN_MIN_KATE_EUROA;
          if (!(k >= raja - 1e-9)) throw new Error(`${t.slug} ${avain} ${tapa}: ${k} €`);
          if (tapa === "mobilepay") {
            mobilepayPienin = Math.min(mobilepayPienin, k);
            if (k < TILAUKSEN_MIN_KATE_EUROA) mobilepayAlle7++;
          }
        }
        for (const p of s.pois) pois[p]++;
        n++;
      }
    }
    expect(n).toBeGreaterThan(5000);
    // MobilePay ei jää koskaan pois; alle 7 € jäävät enintään 24,90 €:n t-paidan yksittäistilaukset (6,94 €). 3.11.2026
    // alkaen ne olivat painolaadun takia piilotettuja vanhoja paitoja (api/_lib/painolaatu.js).
    expect(pois.mobilepay).toBe(0);
    expect(mobilepayAlle7).toBeGreaterThanOrEqual(0);
    expect(mobilepayPienin).toBeGreaterThanOrEqual(6.94 - 1e-9);
    expect(pois.klarna).toBeGreaterThan(0);
  }, 240000);

  it("istunnon parametri: kaikki kelpaavat -> dynaamiset maksutavat, muuten rajattu lista", () => {
    expect(istunnonMaksutavat(sallitutMaksutavat(() => 50))).toEqual({});
    expect(istunnonMaksutavat(sallitutMaksutavat((k) => (k.prosentti > 0.02 ? 6.5 : 9)))).toEqual({ payment_method_types: ["card", "mobilepay"] });
    expect(istunnonMaksutavat(sallitutMaksutavat(() => 6.9))).toEqual({ payment_method_types: ["card", "mobilepay"] });
    expect(RYHMA_MAKSUTAVAT).toEqual(["card", "mobilepay"]);
  });

  it("kaksi t-paitaa: kaikki maksutavat kelpaavat", () => {
    const paita = KAIKKI.find((t) => t.category === "t-paidat")!;
    const [avain] = (myytavatVariantit(paita) as [string, number][])[0];
    const [color, size] = avain.split("|");
    const r = tilaus([{ id: paita.id, quantity: 2, size, color }]);
    expect(sallitutMaksutavat((kulu) => laskettuNettokate(r, KAIKKI, kulu)).kaikki).toBe(true);
  });

  it("yksi 24,90 €:n t-paita: kassa ja kori tarjoavat MobilePayn, Klarna rajataan katteen mukaan", () => {
    const paita = KAIKKI.find((t) => t.category === "t-paidat" && (t as unknown as { price: number }).price === 24.9)!;
    for (const [avain] of myytavatVariantit(paita) as [string, number][]) {
      const [color, size] = avain.split("|");
      const r = tilaus([{ id: paita.id, quantity: 1, size, color }]);
      const s = sallitutMaksutavat((kulu) => laskettuNettokate(r, KAIKKI, kulu));
      expect(s.tavat).toContain("mobilepay");
      const klarnaKate = laskettuNettokate(r, KAIKKI, MAKSUTAPAKULUT.klarna);
      expect(s.tavat.includes("klarna")).toBe(klarnaKate >= TILAUKSEN_MIN_KATE_EUROA);
      const kori = korinMaksutavat([{ product: paita as unknown as Product, quantity: 1, selectedColor: color, selectedSize: size }]);
      expect(kori).toContain("mobilepay");
      expect(kori.includes("klarna")).toBe(s.tavat.includes("klarna"));
    }
  });
});
