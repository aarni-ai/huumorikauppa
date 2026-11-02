/**
 * Ostoskorin lisämyynti (src/lib/lisamyynti.ts, 2.11.2026): "Lisää toinen paita, niin toimitus on ilmainen" näytetään
 * vain, kun kassa (api/_lib/kassa.js) antaa ilmaisen toimituksen jokaisella ehdotetun paidan koko- ja väriyhdistelmällä,
 * ja tilauksen nettokate on vähintään 7 €. Tuotannon kulut: src/test/fixtures/kate-tilannekuva.json.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Product } from "@/types/product";
import { toinenPaita, korinSuositukset } from "@/lib/lisamyynti";
import { koostaLisamyynti, lisamyyntiRivi } from "../../api/_lib/lisamyynti.js";
import { laskeTilaus, laskettuNettokate } from "../../api/_lib/kassa.js";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { kalleinVariantti } from "../../api/_lib/korialennus.js";
import { TILAUKSEN_MIN_KATE_EUROA, LISATUOTE_KATEGORIAT } from "../../api/_lib/vakiot.js";

// Tilannekuvassa ei ole värejä ja kokoja: ne johdetaan variant_mapista kuten tuotannon tuoterivillä.
const KAIKKI = (JSON.parse(readFileSync("src/test/fixtures/kate-tilannekuva.json", "utf8")) as { tuotteet: Product[] }).tuotteet.map((p) => {
  const avaimet = Object.keys((p.variants?.variant_map || {}) as Record<string, number>);
  const colors = [...new Set(avaimet.map((a) => a.split("|")[0]))];
  const sizes = [...new Set(avaimet.map((a) => a.split("|")[1]))];
  return { ...p, images: [], variants: { ...p.variants, colors, sizes, default_color: colors[0] } } as Product;
});
const avainIdlle = (p: Product, id: number | null) => Object.entries((p.variants?.variant_map || {}) as Record<string, number>).find(([, v]) => v === id)?.[0];
const tilaa = (rivit: { p: Product; avain: string }[]) => laskeTilaus(
  { items: rivit.map(({ p, avain }) => ({ id: p.id, quantity: 1, color: avain.split("|")[0], size: avain.split("|")[1] })), customerEmail: "a@b.fi", shippingAddress: { address: "K 1", zip: "00100", city: "Hki" } },
  KAIKKI, null, { korialennus: { nyt: new Date("2026-11-10T10:00:00Z") } },
);

describe("Lisää toinen paita, niin toimitus on ilmainen", () => {
  // Pohjatuote korissa pahimmalla variantilla (kallein kulu), eri tuotetyypeistä.
  const pohjat = ["t-paidat", "hupparit", "seinataulut", "koristeet"].flatMap((k) => KAIKKI.filter((p) => p.category === k).slice(0, k === "t-paidat" ? 25 : 15));

  it("jokainen luvattu pari: kassa antaa ilmaisen toimituksen ja kate on vähintään 7 € kaikilla paidan valinnoilla", () => {
    let lupauksia = 0;
    for (const pohja of pohjat) {
      const avain = avainIdlle(pohja, kalleinVariantti(pohja));
      if (!avain) continue;
      const [selectedColor, selectedSize] = avain.split("|");
      const t = toinenPaita([{ product: pohja, quantity: 1, selectedColor, selectedSize }], KAIKKI);
      if (!t.ilmainenToimitus) continue;
      expect(t.paidat.length).toBeGreaterThanOrEqual(2);
      expect(t.paidat.length).toBeLessThanOrEqual(3);
      for (const paita of t.paidat) {
        expect(paita.category).toBe("t-paidat");
        for (const [pAvain] of myytavatVariantit(paita) as [string, number][]) {
          const r = tilaa([{ p: pohja, avain }, { p: paita, avain: pAvain }]);
          if (r.shipping !== 0) throw new Error(`${pohja.slug} ${avain} + ${paita.slug} ${pAvain}: toimitus ${r.shipping} €`);
          const k = laskettuNettokate(r, KAIKKI);
          if (!(k >= TILAUKSEN_MIN_KATE_EUROA)) throw new Error(`${pohja.slug} + ${paita.slug} ${pAvain}: kate ${k} €`);
          lupauksia++;
        }
      }
    }
    expect(lupauksia).toBeGreaterThan(100);
  }, 180000);

  it("ei ehdotusta, kun toimitus on jo ilmainen tai korissa on kaksi tuotetta", () => {
    const [a, b] = KAIKKI.filter((p) => p.category === "t-paidat");
    const rivi = (p: Product) => ({ product: p, quantity: 1, selectedColor: avainIdlle(p, kalleinVariantti(p))!.split("|")[0], selectedSize: avainIdlle(p, kalleinVariantti(p))!.split("|")[1] });
    expect(toinenPaita([rivi(a), rivi(b)], KAIKKI).paidat).toEqual([]);
    expect(toinenPaita([{ ...rivi(a), quantity: 2 }], KAIKKI).paidat).toEqual([]);
    const tarra = KAIKKI.find((p) => LISATUOTE_KATEGORIAT.includes(p.category));
    if (tarra) expect(toinenPaita([{ product: tarra, quantity: 1 }], KAIKKI).ilmainenToimitus).toBe(false);
  });

  it("t-paidalle löytyy ilmaisen toimituksen pari", () => {
    const paita = KAIKKI.find((p) => p.category === "t-paidat" && p.price === 24.9)!;
    const avain = avainIdlle(paita, kalleinVariantti(paita))!;
    const t = toinenPaita([{ product: paita, quantity: 1, selectedColor: avain.split("|")[0], selectedSize: avain.split("|")[1] }], KAIKKI);
    expect(t.ilmainenToimitus).toBe(true);
  }, 60000);
});

describe("Korin suositukset", () => {
  it("kolme suositusta, ei korin tuotetta eikä toisen paidan ehdotuksia, sama aihe tai lahjasivu ensin", () => {
    const isa = KAIKKI.find((p) => p.category === "t-paidat" && /isalle|isa-/.test(p.slug))!;
    const s = korinSuositukset([{ product: isa, quantity: 1 }], KAIKKI);
    expect(s).toHaveLength(3);
    expect(s.map((p) => p.id)).not.toContain(isa.id);
    const pois = korinSuositukset([{ product: isa, quantity: 1 }], KAIKKI, s.slice(0, 1));
    expect(pois.map((p) => p.id)).not.toContain(s[0].id);
  });
});

describe("Lisämyynnin koosteluvut", () => {
  it("osuudet ja mittarin rivi", () => {
    const k = koostaLisamyynti([
      { tapahtuma: "suositukset_naytetty", n: 40 }, { tapahtuma: "suositus_lisatty", n: 2 },
      { tapahtuma: "toinen_paita_naytetty", n: 10 }, { tapahtuma: "toinen_paita_lisatty", n: 1 }, { tapahtuma: "tuntematon", n: 5 },
    ]);
    expect(k).toMatchObject({ suositukset_naytetty: 40, suositus_lisatty: 2, suositusOsuus: 5, toinen_paita_naytetty: 10, toinen_paita_lisatty: 1, toinenPaitaOsuus: 10 });
    const rivi = lisamyyntiRivi({ alku: "2026-11-03", loppu: "2026-11-03", ...k });
    expect(rivi).toBe("Korin lisämyynti 2026-11-03–2026-11-03: suositukset näytetty 40, lisätty 2 (5 %); toinen paita näytetty 10, lisätty 1 (10 %).");
  });
});
