/**
 * Lahjapaketit (2.11.2026, api/_lib/paketit-data.js): kuusi valmista pakettia, hinta yhteissumma -5 %, ilmainen toimitus
 * ja nettokate vähintään 12 € jokaisella koko- ja väriyhdistelmällä tuotannon kuluilla.
 *
 * Kulut: src/test/fixtures/kate-tilannekuva.json (tuotannon /api/products 2.11.2026: variant_map ilman saatavuudettomia
 * variantteja, Printifyn kulut, toimitus, painotalo ja kokohinnat).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import PAKETIT from "../../api/_lib/paketit-data.js";
import { laskeTilaus } from "../../api/_lib/kassa.js";
import { laskePaketinNettokate, paketinHeikoinNettokate, myytavatVariantit } from "../../api/_lib/kate.js";
import { LAHJAPAKETTI_ALENNUS_PROSENTTI, PAKETTI_MIN_KATE_EUROA } from "../../api/_lib/vakiot.js";
import { paketinTiedot, arvioiPakettialennus, toimitusTila } from "@/lib/ostoskori";
import type { Product } from "@/types/product";

type Tuote = { id: string; slug: string; name: string; category: string; price: number; variants: { variant_map: Record<string, number> } };
const KULUT = JSON.parse(readFileSync("src/test/fixtures/kate-tilannekuva.json", "utf8")) as { tuotteet: Tuote[] };
const bySlug = new Map(KULUT.tuotteet.map((t) => [t.slug, t]));
const osoite = { address: "Katu 1", zip: "00100", city: "Helsinki" };
const eiKorialennusta = { prosentti: 0 };

describe("Lahjapaketit: määritykset", () => {
  it("kuusi pakettia, kaksi eri myynnissä olevaa tuotetta, -5 %", () => {
    expect(PAKETIT).toHaveLength(6);
    expect(PAKETIT.map((p) => p.nimi)).toEqual([
      "Isän paketti", "Saunojan paketti", "Pikkujoulupari kahdelle", "Mökkipaketti", "Kalastajan paketti", "Eläkeläisen paketti",
    ]);
    expect(new Set(PAKETIT.map((p) => p.slug)).size).toBe(6);
    for (const p of PAKETIT) {
      expect(p.alennus_prosentti).toBe(LAHJAPAKETTI_ALENNUS_PROSENTTI);
      expect(p.alennus_prosentti).toBe(5);
      expect(p.tuotteet).toHaveLength(2);
      expect(p.tuotteet[0]).not.toBe(p.tuotteet[1]);
      for (const s of p.tuotteet) {
        const t = bySlug.get(s);
        expect(t, s).toBeDefined();
        expect(t!.category).toBe("t-paidat");
        expect(myytavatVariantit(t).length).toBeGreaterThan(0);
      }
    }
  });

  it("tekstit ilman ajatusviivoja", () => {
    for (const p of PAKETIT) {
      expect(`${p.nimi} ${p.kuvaus}`).not.toMatch(/[–—]/);
      expect(p.kuvaus.length).toBeLessThanOrEqual(90);
    }
  });
});

describe("Lahjapaketit: kate pahimmalla koko- ja väriyhdistelmällä", () => {
  it(`jokainen yhdistelmä vähintään ${PAKETTI_MIN_KATE_EUROA} € ilmaisella toimituksella`, () => {
    expect(PAKETTI_MIN_KATE_EUROA).toBe(12);
    for (const p of PAKETIT) {
      const [a, b] = p.tuotteet.map((s) => bySlug.get(s)!);
      let pienin = Infinity;
      let yhdistelmia = 0;
      for (const [, ia] of myytavatVariantit(a)) {
        for (const [, ib] of myytavatVariantit(b)) {
          const k = laskePaketinNettokate([{ tuote: a, varianttiId: ia }, { tuote: b, varianttiId: ib }], p.alennus_prosentti);
          expect(k.tunnettu).toBe(true);
          pienin = Math.min(pienin, k.nettokate as number);
          yhdistelmia++;
        }
      }
      expect(yhdistelmia).toBeGreaterThanOrEqual(100);
      expect(pienin, p.slug).toBeGreaterThanOrEqual(12);
      expect(paketinHeikoinNettokate([a, b], p.alennus_prosentti)).toMatchObject({ tunnettu: true, nettokate: pienin, sallittu: true });
    }
  });

  it("t-paita + huppari ei täyttäisi rajaa (siksi paketit ovat t-paitapareja)", () => {
    const paita = bySlug.get("isa-joka-grillaa-sateellakin-t-paita-isalle")!;
    const huppari = KULUT.tuotteet.find((t) => t.category === "hupparit")!;
    expect(paketinHeikoinNettokate([paita, huppari], 5).sallittu).toBe(false);
  });
});

describe("Lahjapaketit: kassa laskee saman hinnan palvelimella", () => {
  for (const p of PAKETIT) {
    it(p.nimi, () => {
      const tuotteet = p.tuotteet.map((s) => bySlug.get(s)!);
      // Pahin yhdistelmä kassan riveinä.
      const pahin = paketinHeikoinNettokate(tuotteet, p.alennus_prosentti) as { variantit: string[] };
      const items = tuotteet.map((t, i) => {
        const [color, size] = pahin.variantit[i].split("|");
        return { id: t.id, quantity: 1, size, color };
      });
      const r = laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: osoite }, KULUT.tuotteet, null, { paketit: PAKETIT, korialennus: eiKorialennusta });
      const tiedot = paketinTiedot(p as never, tuotteet as unknown as Product[])!;
      expect(tiedot.alennusVoimassa).toBe(true);
      expect(tiedot.ilmainenToimitus).toBe(true);
      // Hinta = yhteissumma -5 % (rivikohtainen pyöristys sentteinä).
      expect(tiedot.yhteensa).toBe(55.8);
      expect(tiedot.pakettihinta).toBe(53.02);
      expect(Math.abs(tiedot.pakettihinta - tiedot.yhteensa * 0.95)).toBeLessThanOrEqual(0.0101);
      expect(r.shipping).toBe(0);
      expect(r.bundle_discount).toBe(r2(tiedot.yhteensa - tiedot.pakettihinta));
      expect(r.total).toBe(tiedot.pakettihinta);
      expect(r.rivit.every((x: { paketti?: string }) => x.paketti === p.slug)).toBe(true);
      // Selaimen arvio vastaa kassaa.
      const kori = tuotteet.map((t) => ({ product: t as unknown as Product, quantity: 1 }));
      expect(arvioiPakettialennus(kori, tuotteet as unknown as Product[])).toBe(r.bundle_discount);
      expect(toimitusTila(kori).toimitus).toBe(0);
    });
  }

  it("alennuskoodilla ei pakettialennusta eikä kahden tuotteen ilmaista toimitusta", () => {
    const p = PAKETIT[0];
    const items = p.tuotteet.map((s) => ({ id: bySlug.get(s)!.id, quantity: 1, size: "M", color: Object.keys(bySlug.get(s)!.variants.variant_map)[0].split("|")[0] }));
    const r = laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: osoite }, KULUT.tuotteet, { type: "percent", value: 5 }, { paketit: PAKETIT });
    expect(r.bundle_discount).toBe(0);
    expect(r.shipping).toBe(6.9);
  });
});

const r2 = (n: number) => Math.round(n * 100) / 100;
