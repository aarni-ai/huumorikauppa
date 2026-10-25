import { describe, it, expect, vi } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  lueEuSiirrot, onKaksoisSlug, siirraRivitEuKopioon, paivitaSiirrotKantaan, tuoPrintifysta,
} from "../../scripts/lib/eu-kanta.mjs";
import { tarkistaTilattavuus } from "../../scripts/tarkista-tilattavuus.mjs";
import { createPrintifyClient } from "../../scripts/printify-saatavuus.mjs";
// Polku muuttujassa: tsc (tsconfig.app.json) ei tarkista Deno-moduulia, vitest lataa sen normaalisti.
const syncPolku = "../../supabase/functions/_shared/printify-sync.ts";
/* eslint-disable @typescript-eslint/no-explicit-any -- testin muistitaulu ja Deno-moduulin tyypitön paluuarvo */
const { buildProductRow } = (await import(/* @vite-ignore */ syncPolku)) as { buildProductRow: (p: unknown, s?: string[]) => any };
type Rivi = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Muistissa toimiva products-taulu samalla liittymällä kuin postgresKanta. */
function muistiKanta(alku: Rivi[] = []) {
  const rivit: Rivi[] = alku.map((r) => structuredClone(r));
  return {
    rivit: async () => rivit.map((r) => ({ slug: r.slug, printify_product_id: r.printify_product_id, variants: r.variants })),
    rivitTuotteelle: async (id: string) => rivit.filter((r) => String(r.printify_product_id) === String(id)).map((r) => ({ ...r })),
    paivita: async (slug: string, kentat: Rivi) => { Object.assign(rivit.find((r) => r.slug === slug)!, structuredClone(kentat)); },
    lisaa: async (rivi: Rivi) => {
      if (rivit.some((r) => r.slug === rivi.slug)) return false;
      rivit.push(structuredClone(rivi));
      return true;
    },
    poista: async (slug: string) => { rivit.splice(rivit.findIndex((r) => r.slug === slug), 1); },
    taulu: rivit,
  };
}

const OTSIKKO = "Eläkeläinen – aamuherätys vapaaehtoinen | T-Paita";
const VANHA_ID = "6a40cc47a7caa8b5d009c19e";
const UUSI_ID = "6adac3986396b31e550dd466";

const tuote = (id: string, variantit: [number, string, boolean?][], extra: Rivi = {}) => ({
  id, title: OTSIKKO, description: "Hauska paita", tags: [], blueprint_id: 145, print_provider_id: extra.print_provider_id ?? 30,
  variants: variantit.map(([vid, title, enabled = true]) => ({ id: vid, title, is_enabled: enabled, is_available: true, price: 2995, cost: 1200 })),
  images: [{ src: `https://images.printify.com/mockup/${id}/front.jpg?camera_label=front`, variant_ids: variantit.map(([v]) => v), is_default: true }],
  ...extra,
});
const vanha = tuote(VANHA_ID, [[1, "M / Black"], [2, "L / Black"]], { print_provider_id: 99 });
const uusi = tuote(UUSI_ID, [[101, "M / Black"], [102, "L / Black"]]);
const siirtoKirjaus = { vanhaId: VANHA_ID, uusiId: UUSI_ID, title: OTSIKKO, kategoria: "t-paidat" };
const siirrot = { vanhaan: new Map([[VANHA_ID, siirtoKirjaus]]), uuteen: new Map([[UUSI_ID, siirtoKirjaus]]), tiedostot: ["eu-siirto-2026-10-23.json"] };
const tyhjat = { vanhaan: new Map(), uuteen: new Map(), tiedostot: [] };

const perusSlug = buildProductRow(vanha, [])!.slug;
const perusRivi = () => ({
  slug: perusSlug, name: "Oma nimi", price: 34.9, is_active: true, description: "Oma kuvaus", printify_product_id: VANHA_ID,
  variants: { ...buildProductRow(vanha, [])!.variants, costs: { 1: 900 }, shipping_cents: 999, size_chart: "pidetään" },
  images: ["vanha.jpg"], unavailable_variants: ["Musta|M"],
});
const kulutRivi = vi.fn(async (p: Rivi) => ({ costs: Object.fromEntries(p.variants.map((v: Rivi) => [String(v.id), v.cost])), shipping_cents: 450 }));

describe("lueEuSiirrot", () => {
  it("lukee kaikki eu-siirto-tiedostot ja ohittaa rikkinäisen", () => {
    const kansio = mkdtempSync(path.join(tmpdir(), "eu-kanta-"));
    writeFileSync(path.join(kansio, "eu-siirto-2026-10-23.json"), JSON.stringify({ siirrot: [siirtoKirjaus] }));
    writeFileSync(path.join(kansio, "eu-siirto-2026-10-25.json"), '{"siirrot": [{"vanhaId": "a"'); // kesken kirjoituksen
    writeFileSync(path.join(kansio, "products-snapshot.json"), "[]");
    const varoita = vi.fn();
    const s = lueEuSiirrot(kansio, { varoita });
    expect(s.vanhaan.get(VANHA_ID)?.uusiId).toBe(UUSI_ID);
    expect(s.uuteen.get(UUSI_ID)?.vanhaId).toBe(VANHA_ID);
    expect(s.tiedostot).toEqual(["eu-siirto-2026-10-23.json"]);
    expect(varoita).toHaveBeenCalledOnce();
  });
});

describe("onKaksoisSlug", () => {
  it("tunnistaa Printify-tunnuksen jälkiliitteen", () => {
    expect(onKaksoisSlug("paita-0dd466", "paita")).toBe(true);
    expect(onKaksoisSlug("paita-abcdef", "paita")).toBe(false); // ei numeroa
    expect(onKaksoisSlug("paita-0dd466", "toinen")).toBe(false);
    expect(onKaksoisSlug("paita", "paita")).toBe(false);
  });
});

describe("tuoPrintifysta ja EU-siirrot", () => {
  it("tyhjä kanta: vanha ohitetaan, EU-kopio tuodaan perus-slugilla (ei jälkiliitettä)", async () => {
    const kanta = muistiKanta();
    const t = await tuoPrintifysta({ tuotteet: [uusi, vanha], kanta, siirrot, buildProductRow, kulutRivi });
    expect(t).toMatchObject({ uusia: 1, ohitettuSiirretty: 1, korvattu: 0 });
    expect(kanta.taulu).toHaveLength(1);
    expect(kanta.taulu[0]).toMatchObject({ slug: perusSlug, printify_product_id: UUSI_ID, is_active: false });
  });

  it("ilman kirjausta sama nimi tuottaisi kaksoisrivin (vertailu)", async () => {
    const kanta = muistiKanta();
    await tuoPrintifysta({ tuotteet: [vanha, uusi], kanta, siirrot: tyhjat, buildProductRow, kulutRivi });
    expect(kanta.taulu.map((r) => r.slug)).toEqual([perusSlug, `${perusSlug}-0dd466`]);
  });

  it("vanhan tuotteen rivi päivitetään EU-kopioon: slug, nimi, hinta, näkyvyys ja kuvaus säilyvät", async () => {
    const kanta = muistiKanta([perusRivi()]);
    const t = await tuoPrintifysta({ tuotteet: [vanha, uusi], kanta, siirrot, buildProductRow, kulutRivi, hinnat: false });
    expect(t).toMatchObject({ uusia: 0, korvattu: 1, ohitettuSiirretty: 1 });
    expect(kanta.taulu).toHaveLength(1);
    const r = kanta.taulu[0];
    expect(r).toMatchObject({ slug: perusSlug, name: "Oma nimi", price: 34.9, is_active: true, description: "Oma kuvaus", printify_product_id: UUSI_ID });
    expect(Object.values(r.variants.variant_map).sort()).toEqual([101, 102]);
    expect(r.variants.costs).toEqual({ 101: 1200, 102: 1200 });
    expect(r.variants.shipping_cents).toBe(450);
    expect(r.variants.size_chart).toBe("pidetään");
    expect(r.images[0]).toContain(UUSI_ID);
    expect(r.unavailable_variants).toEqual([]);
  });

  it("toinen ajo on idempotentti eikä luo rivejä", async () => {
    const kanta = muistiKanta([perusRivi()]);
    await tuoPrintifysta({ tuotteet: [vanha, uusi], kanta, siirrot, buildProductRow, kulutRivi });
    const t2 = await tuoPrintifysta({ tuotteet: [vanha, uusi], kanta, siirrot, buildProductRow, kulutRivi });
    expect(t2).toMatchObject({ uusia: 0, korvattu: 0, paivitetty: 1, ohitettuSiirretty: 1 });
    expect(kanta.taulu.map((r) => [r.slug, r.printify_product_id])).toEqual([[perusSlug, UUSI_ID]]);
  });

  it("aiemmin syntynyt jälkiliitteellinen EU-kopiorivi poistetaan", async () => {
    const kanta = muistiKanta([perusRivi(), { slug: `${perusSlug}-0dd466`, printify_product_id: UUSI_ID, variants: {}, is_active: false }]);
    const t = await tuoPrintifysta({ tuotteet: [uusi, vanha], kanta, siirrot, buildProductRow, kulutRivi });
    expect(t.poistetut).toEqual([`${perusSlug}-0dd466`]);
    expect(kanta.taulu.map((r) => [r.slug, r.printify_product_id])).toEqual([[perusSlug, UUSI_ID]]);
  });

  it("kuiva-ajo ei kirjoita", async () => {
    const kanta = muistiKanta([perusRivi()]);
    const t = await tuoPrintifysta({ tuotteet: [vanha, uusi], kanta, siirrot, buildProductRow, kulutRivi, kuiva: true });
    expect(t.korvattu).toBe(1);
    expect(kanta.taulu[0].printify_product_id).toBe(VANHA_ID);
  });
});

describe("paivitaSiirrotKantaan (tuo-tuotteet ja --paivita-kanta)", () => {
  it("päivittää tilannekuvan rivin, ja uusinta ei hae Printifystä", async () => {
    const kanta = muistiKanta([perusRivi(), { slug: "muu", printify_product_id: "muu-id", variants: {} }]);
    const haeTuote = vi.fn(async () => structuredClone(uusi));
    const toimitus = vi.fn(async () => 450);
    const t1 = await paivitaSiirrotKantaan({ kanta, siirrot, buildProductRow, haeTuote, toimitus });
    expect(t1).toMatchObject({ paivitetty: 1, jo: 0, eiRivia: 0, virheet: [] });
    expect(kanta.taulu[0]).toMatchObject({ slug: perusSlug, printify_product_id: UUSI_ID, price: 34.9 });
    const t2 = await paivitaSiirrotKantaan({ kanta, siirrot, buildProductRow, haeTuote, toimitus });
    expect(t2).toMatchObject({ paivitetty: 0, jo: 1 });
    expect(haeTuote).toHaveBeenCalledTimes(1);
  });

  it("puuttuva EU-kopio jättää rivin vanhaan tuotteeseen ja kirjaa virheen", async () => {
    const kanta = muistiKanta([perusRivi()]);
    const t = await paivitaSiirrotKantaan({ kanta, siirrot, buildProductRow, haeTuote: async () => null, toimitus: async () => null });
    expect(t.virheet).toHaveLength(1);
    expect(kanta.taulu[0].printify_product_id).toBe(VANHA_ID);
  });

  it("siirraRivitEuKopioon ilman riviä ei tee mitään", async () => {
    const kanta = muistiKanta();
    expect((await siirraRivitEuKopioon(kanta, VANHA_ID, uusi, { buildProductRow })).tila).toBe("ei-rivia");
  });
});

describe("tarkistaTilattavuus", () => {
  const vastaus = (status: number, data: unknown) => ({ status, ok: status < 400, headers: { get: () => null }, json: async () => data });
  const fetchImpl = vi.fn(async (url: string) => {
    if (url.includes(`/products/${UUSI_ID}.json`)) {
      return vastaus(200, { id: UUSI_ID, variants: [
        { id: 101, is_enabled: true, is_available: true }, { id: 102, is_enabled: false, is_available: true },
        { id: 103, is_enabled: true, is_available: false },
      ] });
    }
    return vastaus(404, null);
  });
  const printifyGet = createPrintifyClient({ apiKey: "testi", fetchImpl: fetchImpl as never, minIntervalMs: 0, sleep: async () => {} });

  it("raportoi tilaamattomat avaimet syineen ja vanhaan tuotteeseen osoittavat rivit", async () => {
    const rivit = [
      { slug: "ok-ja-huonot", is_active: true, printify_product_id: UUSI_ID, variants: { variant_map: { "Musta|M": 101, "Musta|L": 102, "Musta|XL": 103, "Musta|S": 104 } } },
      { slug: "vanha", is_active: true, printify_product_id: VANHA_ID, variants: { variant_map: { "Musta|M": 1 } } },
      { slug: "piilotettu", is_active: false, printify_product_id: "x", variants: { variant_map: { "|": 1 } } },
      { slug: "ilman-id", is_active: true, printify_product_id: null, variants: { variant_map: { "|": 1 } } },
    ];
    const t = await tarkistaTilattavuus({ rivit, printifyGet, shopId: "1", siirrot });
    expect(t.tuotteita).toBe(3);
    expect(t.ongelmat.map((o) => [o.slug, o.avain, o.syy])).toEqual([
      ["ok-ja-huonot", "Musta|L", "ei_kaytossa"],
      ["ok-ja-huonot", "Musta|XL", "ei_saatavilla"],
      ["ok-ja-huonot", "Musta|S", "variantti_puuttuu"],
      ["vanha", "Musta|M", "printify_tuote_puuttuu"],
      ["ilman-id", null, "ei_printify_id"],
    ]);
    expect(t.vanhaan).toEqual([{ slug: "vanha", vanhaId: VANHA_ID, uusiId: UUSI_ID }]);
  });

  it("kaikki tilattavissa: ei ongelmia", async () => {
    const rivit = [{ slug: "ok", is_active: true, printify_product_id: UUSI_ID, variants: { variant_map: { "Musta|M": 101 } } }];
    const t = await tarkistaTilattavuus({ rivit, printifyGet, shopId: "1" });
    expect(t.ongelmat).toEqual([]);
  });
});
