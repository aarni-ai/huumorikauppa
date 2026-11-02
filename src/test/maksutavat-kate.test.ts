/**
 * Maksutavat ja 7 €:n kate (3.11.2026, api/_lib/maksutavat.js): jokainen kassan tarjoama maksutapa jättää tilaukselle
 * vähintään 7 € kyseisen maksutavan kululla. Tuotannon kulut src/test/fixtures/kate-tilannekuva.json.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MAKSUTAPAKULUT, sallitutMaksutavat, istunnonMaksutavat, RYHMA_MAKSUTAVAT } from "../../api/_lib/maksutavat.js";
import { laskeTilaus, laskettuNettokate } from "../../api/_lib/kassa.js";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { TILAUKSEN_MIN_KATE_EUROA, LISATUOTE_KATEGORIAT } from "../../api/_lib/vakiot.js";

type T = { id: string; slug: string; category: string; variants: { variant_map: Record<string, number> } };
const KAIKKI = (JSON.parse(readFileSync("src/test/fixtures/kate-tilannekuva.json", "utf8")) as { tuotteet: T[] }).tuotteet;
const tilaus = (items: { id: string; quantity: number; size: string; color: string }[]) =>
  laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: { address: "K 1", zip: "00100", city: "Hki" } }, KAIKKI, null, { korialennus: { nyt: new Date("2026-11-10T10:00:00Z") } });

describe("Maksutavat: kate vähintään 7 € jokaisella tarjotulla maksutavalla", () => {
  it("yhden tuotteen tilaukset, kaikki tuotteet ja variantit", () => {
    const pois: Record<string, number> = { mobilepay: 0, klarna: 0 };
    let n = 0;
    for (const t of KAIKKI) {
      if (LISATUOTE_KATEGORIAT.includes(t.category)) continue;
      for (const [avain] of myytavatVariantit(t) as [string, number][]) {
        const [color, size] = avain.split("|");
        const r = tilaus([{ id: t.id, quantity: 1, size, color }]);
        const s = sallitutMaksutavat((kulu) => laskettuNettokate(r, KAIKKI, kulu));
        expect(s.tavat[0]).toBe("card");
        for (const tapa of s.tavat) {
          const k = laskettuNettokate(r, KAIKKI, MAKSUTAPAKULUT[tapa as keyof typeof MAKSUTAPAKULUT]);
          if (!(k >= TILAUKSEN_MIN_KATE_EUROA)) throw new Error(`${t.slug} ${avain} ${tapa}: ${k} €`);
        }
        for (const p of s.pois) pois[p]++;
        n++;
      }
    }
    expect(n).toBeGreaterThan(5000);
    // MobilePay jää pois vain 24,90 €:n t-paidan yksittäistilauksista (6,94 €); Klarna useammin.
    expect(pois.mobilepay).toBeLessThan(pois.klarna);
    expect(pois.klarna).toBeGreaterThan(0);
  }, 240000);

  it("istunnon parametri: kaikki kelpaavat -> dynaamiset maksutavat, muuten rajattu lista", () => {
    expect(istunnonMaksutavat(sallitutMaksutavat(() => 50))).toEqual({});
    expect(istunnonMaksutavat(sallitutMaksutavat((k) => (k.prosentti > 0.02 ? 6.5 : 9)))).toEqual({ payment_method_types: ["card", "mobilepay"] });
    expect(istunnonMaksutavat(sallitutMaksutavat(() => 6.9))).toEqual({ payment_method_types: ["card"] });
    expect(RYHMA_MAKSUTAVAT).toEqual(["card", "mobilepay"]);
  });

  it("kaksi t-paitaa: kaikki maksutavat kelpaavat", () => {
    const paita = KAIKKI.find((t) => t.category === "t-paidat")!;
    const [avain] = (myytavatVariantit(paita) as [string, number][])[0];
    const [color, size] = avain.split("|");
    const r = tilaus([{ id: paita.id, quantity: 2, size, color }]);
    expect(sallitutMaksutavat((kulu) => laskettuNettokate(r, KAIKKI, kulu)).kaikki).toBe(true);
  });
});
