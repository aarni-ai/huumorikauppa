/**
 * Ilmaisen toimituksen katevahti (2.11.2026): jokaisen tilauksen nettokate on vähintään TILAUKSEN_MIN_KATE_EUROA (7 €)
 * kaikilla kahden tuotteen yhdistelmillä. Kahden tuotteen ilmainen toimitus jätti pahimman tilauksen (24,90 €:n t-paita +
 * keraaminen koriste) 3,73 €:oon; nyt toimitus on pienin porras (api/_lib/kate.js TOIMITUS_PORTAAT), jolla raja täyttyy.
 *
 * Tuotannon kulut: src/test/fixtures/kate-tilannekuva.json (773 myynnissä olevaa tuotetta). Kate on rivien summa, ja
 * Printifyn toimituskulu riippuu tuotteesta eikä variantista, joten tuotteen pahin variantti (pienin kate) on jokaisen
 * yhdistelmän pahin tapaus.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { TILAUKSEN_MIN_KATE_EUROA, LISATUOTE_KATEGORIAT, TOIMITUS } from "../../api/_lib/vakiot.js";
import { laskeTilauksenNettokate, myytavatVariantit, toimitusmaksuKatteella, TOIMITUS_PORTAAT, ALV, STRIPE_PROSENTTI, PRINTIFY_KULUKERROIN } from "../../api/_lib/kate.js";
import { rivinHinta } from "../../api/_lib/kokohinnat.js";
import { laskeTilaus, laskettuNettokate } from "../../api/_lib/kassa.js";
import { helsinkiTimeToUtcMs } from "@/data/campaignSchedule";
import { toimitusTila, ilmaisenToimituksenViesti } from "@/lib/ostoskori";
import type { Product } from "@/types/product";

type Tuote = { id: string; slug: string; name: string; category: string; price: number; variants: { variant_map: Record<string, number>; costs?: Record<string, number> } };
const KAIKKI = (JSON.parse(readFileSync("src/test/fixtures/kate-tilannekuva.json", "utf8")) as { tuotteet: Tuote[] }).tuotteet;

/** Tuotteen pahin variantti: pienin rivikate (myynti ilman ALV:tä - Stripe-osuus - Printify-kulu). */
function pahinVariantti(t: Tuote) {
  let w: { id: number; hinta: number; avain: string; osuus: number } | null = null;
  for (const [avain, id] of myytavatVariantit(t) as [string, number][]) {
    const kulu = t.variants.costs?.[String(id)];
    if (typeof kulu !== "number") continue;
    const hinta = Number(rivinHinta(t, avain.split("|")[1]));
    const osuus = hinta / (1 + ALV) - hinta * STRIPE_PROSENTTI - (kulu / 100) * PRINTIFY_KULUKERROIN;
    if (!w || osuus < w.osuus) w = { id, hinta, avain, osuus };
  }
  return w;
}
const PAHIMMAT = KAIKKI.map((t) => [t, pahinVariantti(t)] as const).filter((x): x is readonly [Tuote, NonNullable<ReturnType<typeof pahinVariantti>>] => x[1] !== null);
const osa = (t: Tuote, v: { id: number; hinta: number }) => ({ tuote: t, varianttiId: v.id, maara: 1, yksikkohinta: v.hinta });
const kpl = (...t: Tuote[]) => t.filter((x) => !LISATUOTE_KATEGORIAT.includes(x.category)).length;

describe("Toimituksen katevahti: kaikki kahden tuotteen yhdistelmät", () => {
  it("jokainen pari (myös sama tuote kahdesti) jää vähintään 7 €:n katteelle", () => {
    expect(PAHIMMAT.length).toBeGreaterThan(700);
    let pareja = 0;
    let rajattuja = 0;
    let pahin = Infinity;
    for (let i = 0; i < PAHIMMAT.length; i++) {
      for (let j = i; j < PAHIMMAT.length; j++) {
        const [A, a] = PAHIMMAT[i];
        const [B, b] = PAHIMMAT[j];
        const osat = [osa(A, a), osa(B, b)];
        const t = toimitusmaksuKatteella({ summa: a.hinta + b.hinta, kpl: kpl(A, B), osat });
        const k = laskeTilauksenNettokate(osat, t.maksu);
        if (!k.tunnettu || k.nettokate < TILAUKSEN_MIN_KATE_EUROA || !TOIMITUS_PORTAAT.includes(t.maksu)) {
          throw new Error(`${A.slug} ${a.avain} + ${B.slug} ${b.avain}: ${k.nettokate} € (toimitus ${t.maksu} €)`);
        }
        pareja++;
        if (t.rajattu) rajattuja++;
        pahin = Math.min(pahin, k.nettokate);
      }
    }
    expect(pareja).toBe((PAHIMMAT.length * (PAHIMMAT.length + 1)) / 2);
    expect(pahin).toBeGreaterThanOrEqual(TILAUKSEN_MIN_KATE_EUROA);
    // Rajaus koskee vain harvoja yhdistelmiä (koristeet): tavallinen kahden tuotteen tilaus on yhä ilmainen.
    expect(rajattuja).toBeGreaterThan(0);
    expect(rajattuja / pareja).toBeLessThan(0.05);
  }, 180000);

  it("t-paita + koriste: aiemmin 3,73 €, nyt maksullinen porras ja kate vähintään 7 €", () => {
    const paita = PAHIMMAT.find(([t, v]) => t.category === "t-paidat" && v.hinta === 24.9)!;
    const koriste = PAHIMMAT.find(([t]) => t.category === "koristeet")!;
    const osat = [osa(...paita), osa(...koriste)];
    expect(laskeTilauksenNettokate(osat, 0).nettokate).toBeLessThan(TILAUKSEN_MIN_KATE_EUROA);
    const t = toimitusmaksuKatteella({ summa: paita[1].hinta + koriste[1].hinta, kpl: 2, osat });
    expect(t.rajattu).toBe(true);
    expect(t.maksu).toBeGreaterThan(0);
    expect(t.maksu).toBeLessThanOrEqual(TOIMITUS);
    expect(laskeTilauksenNettokate(osat, t.maksu).nettokate).toBeGreaterThanOrEqual(TILAUKSEN_MIN_KATE_EUROA);
  });

  it("kaksi t-paitaa on aina ilmainen toimitus (kaikki t-paitaparit)", () => {
    const paidat = PAHIMMAT.filter(([t]) => t.category === "t-paidat");
    expect(paidat.length).toBeGreaterThan(400);
    for (let i = 0; i < paidat.length; i++) {
      for (let j = i; j < paidat.length; j++) {
        const [A, a] = paidat[i];
        const [B, b] = paidat[j];
        if (toimitusmaksuKatteella({ summa: a.hinta + b.hinta, kpl: 2, osat: [osa(A, a), osa(B, b)] }).maksu !== 0) throw new Error(`${A.slug} + ${B.slug}`);
      }
    }
  }, 60000);
});

describe("Kassa: toimitus, alennuskoodi, korialennus ja Black Friday samalla katevahdilla", () => {
  // Tuoteluokat: kassan kannalta samanlaiset tuotteet (kategoria, pahimman variantin hinta ja kulu, Printifyn toimitus).
  const luokat = new Map<string, readonly [Tuote, NonNullable<ReturnType<typeof pahinVariantti>>]>();
  for (const x of PAHIMMAT) {
    const [t, v] = x;
    const raw = t as unknown as { variants: { shipping_cents?: number; shipping_additional_cents?: number; print_provider_id?: number } };
    const avain = [t.category, v.hinta, t.variants.costs?.[String(v.id)], raw.variants.shipping_cents, raw.variants.shipping_additional_cents, raw.variants.print_provider_id].join("|");
    if (!luokat.has(avain)) luokat.set(avain, x);
  }
  const edustajat = [...luokat.values()];
  const fi = (y: number, m: number, d: number) => new Date(helsinkiTimeToUtcMs(y, m, d, 12));
  const tilaus = (A: Tuote, a: { avain: string }, B: Tuote, b: { avain: string }, alennus: { type: string; value: number } | null, nyt: Date) => {
    const [ca, sa] = a.avain.split("|");
    const [cb, sb] = b.avain.split("|");
    const items = A.id === B.id && a.avain === b.avain
      ? [{ id: A.id, quantity: 2, size: sa, color: ca }]
      : [{ id: A.id, quantity: 1, size: sa, color: ca }, { id: B.id, quantity: 1, size: sb, color: cb }];
    return laskeTilaus({ items, customerEmail: "a@b.fi", shippingAddress: { address: "K 1", zip: "00100", city: "Hki" } }, KAIKKI, alennus, { korialennus: { nyt } });
  };

  it("kaikki tuoteluokkaparit: ilman koodia, 5 %:n koodilla ja Black Friday -viikolla kate vähintään 7 €", () => {
    expect(edustajat.length).toBeGreaterThan(3);
    let tarkistettu = 0;
    for (let i = 0; i < edustajat.length; i++) {
      for (let j = i; j < edustajat.length; j++) {
        const [A, a] = edustajat[i];
        const [B, b] = edustajat[j];
        if (LISATUOTE_KATEGORIAT.includes(A.category) && LISATUOTE_KATEGORIAT.includes(B.category)) continue;
        for (const [alennus, nyt] of [[null, fi(2026, 11, 10)], [{ type: "percent", value: 5 }, fi(2026, 11, 10)], [null, fi(2026, 11, 25)]] as const) {
          let r;
          try {
            r = tilaus(A, a, B, b, alennus, nyt);
          } catch (e) {
            // Alennuskoodi hylätään, jos kate jäisi alle 7 €: tilausta ei synny.
            if ((e as { vaihe?: string }).vaihe !== "discount_low_margin") throw new Error(`${A.slug} + ${B.slug}: ${(e as Error).message}`);
            continue;
          }
          const k = laskettuNettokate(r, KAIKKI);
          if (!(k >= TILAUKSEN_MIN_KATE_EUROA)) throw new Error(`${A.slug} ${a.avain} + ${B.slug} ${b.avain} (${alennus ? "koodi" : "ei koodia"}, ${nyt.toISOString().slice(0, 10)}): ${k} €, toimitus ${r.shipping} €`);
          tarkistettu++;
        }
      }
    }
    expect(tarkistettu).toBeGreaterThan(10);
  }, 120000);

  it("kassa kertoo rajatusta toimituksesta, ja kori näyttää saman maksun ja viestin", () => {
    const [paita, pv] = PAHIMMAT.find(([t, v]) => t.category === "t-paidat" && v.hinta === 24.9)!;
    const [koriste, kv] = PAHIMMAT.find(([t]) => t.category === "koristeet")!;
    const r = tilaus(paita, pv, koriste, kv, null, fi(2026, 11, 10));
    expect(r.shipping_reduced).toBe(true);
    expect(r.shipping).toBeGreaterThan(0);
    expect(r.shipping).toBeLessThanOrEqual(TOIMITUS);
    const [ca, sa] = pv.avain.split("|");
    const [cb, sb] = kv.avain.split("|");
    const kori = [
      { product: paita as unknown as Product, quantity: 1, selectedColor: ca, selectedSize: sa },
      { product: koriste as unknown as Product, quantity: 1, selectedColor: cb, selectedSize: sb },
    ];
    const tila = toimitusTila(kori);
    expect(tila.toimitus).toBe(r.shipping);
    expect(tila.rajattu).toBe(true);
    expect(tila.ilmainen).toBe(false);
    expect(ilmaisenToimituksenViesti(tila)).toMatch(/^Tälle tuoteyhdistelmälle toimitus on \d,\d0 € \(tavallisesti 6,90 €\)\.$|^Ilmainen toimitus ei koske tätä tuoteyhdistelmää\. Toimitus 6,90 €\.$/);
  });
});
