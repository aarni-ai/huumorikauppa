import { describe, it, expect, vi } from "vitest";
import { laskeTilaus } from "../../api/_lib/kassa.js";
import {
  korinNettokate, valitseMittarinLisatuote, onLisatuoteEhdokas, lisatuoteTeema, LISATUOTE_MIN_KATE_EUROA,
} from "../../api/_lib/lisatuote.js";
import { ILMAINEN_TOIMITUS_RAJA } from "../../api/_lib/vakiot.js";
import PAKETIT from "../../api/_lib/paketit-data.js";
import { valitseMittarinLisa, valitseLisatarra } from "@/lib/lisatarra";
import type { CartItem, Product } from "@/types/product";

// Selaimen pikalisäys ilman Lovablen kassan tappiopiilotusta (sama kuin lisatarra.test.ts).
vi.mock("../../api/_lib/lovable-kassa-tappio.js", () => ({ LOVABLE_KASSA_TAPPIO: {} }));

/**
 * Kulut kuten tuoterivillä 28.10.2026 (GET /api/products): t-paidalla ja hupparilla ei painotaloa eikä lisäkappaleen
 * toimitusta (lasketaan varovaisesti erillisinä lähetyksinä), tarralla ja julisteella OPT (pp 30).
 */
const rivi = (o: Record<string, unknown>) =>
  ({ is_active: true, printify_product_id: `pf-${o.slug}`, description: "", images: [], stock: 99, humor_type: "", ...o }) as unknown as Product;
const paita = rivi({
  id: "t1", slug: "tonnin-seteli-t-paita", name: "Tonnin Seteli | T-Paita", category: "t-paidat", price: 24.9,
  variants: { colors: ["Valkoinen"], sizes: ["M", "L"], variant_map: { "Valkoinen|M": 1, "Valkoinen|L": 2 }, costs: { "1": 890, "2": 890 }, shipping_cents: 849 },
});
const paita2 = rivi({
  id: "t2", slug: "kalamies-t-paita", name: "Kalamies | T-Paita", category: "t-paidat", price: 24.9,
  variants: { colors: ["Musta"], sizes: ["M"], variant_map: { "Musta|M": 3 }, costs: { "3": 890 }, shipping_cents: 849 },
});
const huppari = rivi({
  id: "h1", slug: "tonnin-seteli-huppari", name: "Tonnin Seteli | Huppari", category: "hupparit", price: 49.99,
  variants: { colors: ["Musta"], sizes: ["M"], variant_map: { "Musta|M": 11 }, costs: { "11": 2548 }, shipping_cents: 1089 },
});
const TARRAKOKO = '3.5" × 3.5"';
const tarra = rivi({
  id: "s1", slug: "se-oli-tonnin-seteli-tarra", name: "Se oli tonnin seteli | Tarra", category: "tarrat", price: 11.9,
  variants: { sizes: [TARRAKOKO], colors: [], variant_map: { [`|${TARRAKOKO}`]: 21 }, costs: { "21": 389 }, shipping_cents: 559, shipping_additional_cents: 10, print_provider_id: 30 },
});
const julisteVariantit = (id: number) => ({
  sizes: ["A3"], colors: [], variant_map: { "|A3": id }, costs: { [String(id)]: 709 }, shipping_cents: 929, shipping_additional_cents: 199, print_provider_id: 30,
});
const juliste = rivi({ id: "p1", slug: "tonnin-seteli-juliste-poster", name: "Tonnin seteli | Juliste", category: "seinataulut", price: 22.9, variants: julisteVariantit(31) });
const juliste2 = rivi({ id: "p2", slug: "olen-elakkeella-juliste-poster", name: "Olen eläkkeellä | Juliste", category: "seinataulut", price: 22.9, variants: julisteVariantit(32) });
// Muki on halpa ja sulkisi aukon parhaiten, mutta mukeja ei myydä: ei koskaan ehdoteta.
const muki = rivi({
  id: "m1", slug: "tonnin-seteli-muki", name: "Tonnin seteli | Muki", category: "mukit", price: 5,
  variants: { sizes: ["11oz"], colors: [], variant_map: { "|11oz": 41 }, costs: { "41": 100 }, shipping_cents: 100, print_provider_id: 30, shipping_additional_cents: 10 },
});
const mukiTarroissa = rivi({ ...muki, id: "m2", slug: "kahvimuki-tarra", name: "Kahvimuki", category: "tarrat" });
const omaTarra = rivi({ ...tarra, id: "s2", slug: "oma-teksti-tarra", name: "Oma teksti | Tarra", price: 4.99 });

// Osittain sama teema ("se-oli-tonnin-seteli"): tarkka teema voittaa, vaikka slug on aakkosissa ensin.
const juliste3 = rivi({ id: "p3", slug: "se-oli-tonnin-seteli-juliste-poster", name: "Se oli tonnin seteli | Juliste", category: "seinataulut", price: 22.9, variants: julisteVariantit(33) });
const kaikki = [paita, paita2, huppari, tarra, juliste, juliste2, juliste3, muki, mukiTarroissa, omaTarra];
const kori = (...rivit: [Product, number?, string?][]): CartItem[] =>
  rivit.map(([product, quantity = 1, size]) => {
    const [color, koko] = Object.keys(product.variants.variant_map)[0].split("|");
    return { product, quantity, selectedColor: color || undefined, selectedSize: size ?? (koko || undefined) };
  });
const bySlug = new Map(kaikki.map((p) => [p.slug, p]));
const valitse = (k: CartItem[], tuotteet: Product[] = kaikki) => valitseMittarinLisatuote(k, tuotteet, { paketit: PAKETIT });

describe("korinNettokate: sama laskenta kuin kassa", () => {
  it("yksi t-paita: 7,22 € (KATTEET.md), toimitusmaksu peritään", () => {
    const k = korinNettokate(kori([paita]), bySlug, PAKETIT);
    expect(k).toMatchObject({ tunnettu: true, nettokate: 7.22, summa: 24.9, toimitus: 6.9, alennus: 0 });
  });

  it("kahden tuotteen alennus ja ilmainen toimitus otetaan mukaan kuten kassalla", () => {
    const k = korinNettokate(kori([paita], [huppari], [juliste]), bySlug, PAKETIT);
    const kassa = laskeTilaus(
      {
        items: [
          { slug: paita.slug, quantity: 1, size: "M", color: "Valkoinen" },
          { slug: huppari.slug, quantity: 1, size: "M", color: "Musta" },
          { slug: juliste.slug, quantity: 1, size: "A3" },
        ],
        customerEmail: "a@b.fi",
        shippingAddress: { address: "Katu 1", zip: "00100", city: "Helsinki" },
      },
      kaikki,
      null,
      { paketit: PAKETIT },
    );
    expect(k.toimitus).toBe(kassa.shipping);
    expect(k.toimitus).toBe(0);
    expect(k.summa).toBe(kassa.subtotal);
    expect(k.summa).toBeGreaterThanOrEqual(ILMAINEN_TOIMITUS_RAJA);
    expect(k.alennus).toBe(kassa.discount);
    expect(k.nettokate).toBeGreaterThan(0);
  });

  it("tuntematon kulu: ei tunnettu", () => {
    const tuntematon = rivi({ ...paita, id: "x", slug: "x-t-paita", variants: { ...paita.variants, costs: {} } });
    expect(korinNettokate(kori([tuntematon]), bySlug, PAKETIT).tunnettu).toBe(false);
  });
});

describe("onLisatuoteEhdokas", () => {
  it("tarrat ja -juliste-poster-julisteet kelpaavat", () => {
    expect(onLisatuoteEhdokas(tarra)).toBe(true);
    expect(onLisatuoteEhdokas(juliste)).toBe(true);
  });
  it("mukit, personoitavat ja muut kategoriat eivät kelpaa", () => {
    expect(onLisatuoteEhdokas(muki)).toBe(false);
    expect(onLisatuoteEhdokas(mukiTarroissa)).toBe(false);
    expect(onLisatuoteEhdokas(omaTarra)).toBe(false);
    expect(onLisatuoteEhdokas(paita)).toBe(false);
    expect(onLisatuoteEhdokas(rivi({ ...juliste, slug: "tonnin-seteli-taulu", category: "seinataulut" }))).toBe(false);
  });
  it("teema julisteelle ja tarralle", () => {
    expect(lisatuoteTeema("tonnin-seteli-juliste-poster")).toBe("tonnin-seteli");
    expect(lisatuoteTeema("se-oli-tonnin-seteli-tarra")).toBe("se-oli-tonnin-seteli");
  });
});

describe("valitseMittarinLisatuote", () => {
  it("yksi t-paita: juliste vie lähimmäs rajaa, saman teeman juliste ensin, kate pysyy positiivisena", () => {
    const s = valitse(kori([paita]));
    expect(s?.product.slug).toBe("tonnin-seteli-juliste-poster");
    expect(s?.puuttuu).toBe(54.1);
    expect(s?.puuttuuJalkeen).toBe(31.2);
    expect(s?.ilmainenJalkeen).toBe(false);
    expect(s?.nettokateEnnen).toBe(7.22);
    expect(s!.nettokateJalkeen).toBeGreaterThan(LISATUOTE_MIN_KATE_EUROA);
  });

  it("muu teema: juliste valitaan slugin mukaan; osittainen teemaosuma ennen muita", () => {
    expect(valitse(kori([paita2]))?.product.slug).toBe("olen-elakkeella-juliste-poster");
    expect(valitse(kori([paita]), kaikki.filter((p) => p !== juliste))?.product.slug).toBe("se-oli-tonnin-seteli-juliste-poster");
  });

  it("pieni puuttuva summa: tarra sulkee aukon pienimmällä ylityksellä (mukia ei koskaan)", () => {
    // 2 t-paitaa + juliste = 72,70 €, puuttuu 6,30 €: tarra 11,90 ylittää rajan 5,60 €:lla, juliste 16,60 €:lla.
    const s = valitse(kori([paita], [paita2], [juliste]));
    expect(s?.product.slug).toBe("se-oli-tonnin-seteli-tarra");
    expect(s?.ilmainenJalkeen).toBe(true);
    expect(s?.puuttuuJalkeen).toBe(0);
    expect(s!.nettokateJalkeen).toBeGreaterThan(0);
  });

  it("hupparikoriin ei ehdoteta tarraa, juliste käy jos kate pysyy positiivisena", () => {
    // t-paita + huppari = 74,89 €, puuttuu 4,11 €: tarra sulkisi aukon parhaiten, mutta hupparisääntö estää sen.
    const s = valitse(kori([paita], [huppari]));
    expect(s?.product.category).toBe("seinataulut");
    expect(s!.nettokateJalkeen).toBeGreaterThan(0);
    expect(valitse(kori([huppari]))?.product.category).toBe("seinataulut");
  });

  it("ei ehdotusta, jos korin kate menisi tappiolle", () => {
    const kallis = (p: Product) =>
      rivi({ ...p, variants: { ...p.variants, costs: Object.fromEntries(Object.keys(p.variants.costs).map((k) => [k, 5000])) } });
    const tappiolliset = [paita, paita2, huppari, kallis(tarra), kallis(juliste), kallis(juliste2)];
    expect(valitse(kori([paita]), tappiolliset)).toBeNull();
    // Vain julisteet tappiollisia: kalliimpi sulkija pois, tarra jää.
    const s = valitse(kori([paita]), [paita, tarra, kallis(juliste), kallis(juliste2)]);
    expect(s?.product.slug).toBe("se-oli-tonnin-seteli-tarra");
  });

  it("kate-raja on konfiguroitava: korkeampi raja karsii ehdokkaat", () => {
    expect(valitseMittarinLisatuote(kori([paita]), kaikki, { paketit: PAKETIT, minKateEuroa: 1000 })).toBeNull();
  });

  it("ei ehdotusta rajan yli menevään koriin, tyhjään koriin eikä korissa jo olevaa tuotetta", () => {
    expect(valitse(kori([paita], [huppari], [juliste]))).toBeNull();
    expect(valitse([])).toBeNull();
    const s = valitse(kori([paita], [juliste]));
    expect(s?.product.slug).toBe("se-oli-tonnin-seteli-juliste-poster");
  });

  it("korissa jo tarra: tarraa ei ehdoteta uudelleen", () => {
    const s = valitse(kori([paita], [tarra]));
    expect(s?.product.category).toBe("seinataulut");
  });
});

describe("valitseMittarinLisa (selain, pikalisäys)", () => {
  it("palauttaa koon ja värin yhden painalluksen lisäykseen", () => {
    const s = valitseMittarinLisa(kori([paita]), kaikki);
    expect(s?.product.slug).toBe("tonnin-seteli-juliste-poster");
    expect(s?.size).toBe("A3");
    expect(s?.puuttuuJalkeen).toBe(31.2);
  });

  it("ei mukia, vaikka muki olisi ainoa ehdokas", () => {
    expect(valitseMittarinLisa(kori([paita]), [paita, muki, mukiTarroissa])).toBeNull();
  });
});

describe("valitseLisatarra korin riveillä: katevahti", () => {
  it("ehdottaa tarraa, kun kate pysyy positiivisena", () => {
    expect(valitseLisatarra(kori([paita], [paita2], [juliste]), kaikki)?.slug).toBe("se-oli-tonnin-seteli-tarra");
  });
  it("ei ehdota, jos tarran kanssa kate menisi tappiolle", () => {
    const kallisTarra = rivi({ ...tarra, variants: { ...tarra.variants, costs: { "21": 9000 } } });
    expect(valitseLisatarra(kori([paita]), [paita, kallisTarra])).toBeNull();
  });
});
