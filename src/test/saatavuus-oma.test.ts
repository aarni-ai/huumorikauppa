// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  epakelvotAvaimet, katalogiJoukko, karsiVariantit, kaikkiPoissa, varianttiSaatavilla, liitaSaatavuusTiedosto,
  teeKuristin, tarkistaTuote, ajaSaatavuus, liveSaatavuus, muutosRivit, EI_SAATAVILLA_VIESTI, KV_MUUTOKSET, KV_PIILOTETUT,
} from "../../api/_lib/saatavuus.js";
import { haeTuote, haeKatalogiVariantit } from "../../api/_lib/printify.js";
import { laskeTilaus, KassaVirhe } from "../../api/_lib/kassa.js";
import { myynnissa } from "../../api/_lib/tuotteet.js";
import { isVariantAvailable, availableSizes, unavailableKeys } from "@/lib/variantAvailability";

type Rivi = Record<string, unknown> & { id: string; slug: string };

const paita = (yli: Partial<Rivi> = {}): Rivi => ({
  id: "p1", slug: "paita", name: "Paita", category: "t-paidat", price: 34.9, is_active: true, printify_product_id: "pf1",
  variants: {
    colors: ["Musta", "Valkoinen"], sizes: ["S", "M"], default_color: "Musta",
    variant_map: { "Musta|S": 11, "Musta|M": 12, "Valkoinen|S": 13, "Valkoinen|M": 14 },
    costs: { "11": 1200, "12": 1200, "13": 1200, "14": 1200 }, shipping_cents: 450,
  },
  ...yli,
});
const pfTuote = (variantit: Array<{ id: number; is_enabled?: boolean; is_available?: boolean }>) => ({
  blueprint_id: 6, print_provider_id: 99, variants: variantit.map((v) => ({ is_enabled: true, is_available: true, ...v })),
});
const vastaus = (status: number, data: unknown) => ({ ok: status >= 200 && status < 300, status, data, virhe: status >= 300 ? `Printify ${status}` : null });

/** Muistivarasto pgVaraston rajapinnalla. */
function muistiVarasto(rivit: Rivi[]) {
  const kv = new Map<string, string>();
  const tapahtumat: Array<[string, unknown]> = [];
  const tarkistettu = new Set<string>();
  const valittavat = (idt: string[]) => rivit.filter((p) => p.printify_product_id && (p.is_active !== false || idt.includes(p.id)) && !tarkistettu.has(p.id));
  return {
    rivit, kv, tapahtumat, tarkistettu,
    tarkistettavat: async (idt: string[], raja: number) => valittavat(idt).slice(0, raja).map((p) => ({ ...p })),
    jaljella: async (idt: string[]) => valittavat(idt).length,
    tallenna: async (id: string, { unavailable, is_active }: { unavailable: string[]; is_active: boolean }) => {
      const p = rivit.find((r) => r.id === id)!;
      p.unavailable_variants = unavailable;
      p.is_active = is_active;
      tarkistettu.add(id);
    },
    merkitseTarkistetuksi: async (id: string) => void tarkistettu.add(id),
    tapahtuma: async (laji: string, tiedot: unknown) => void tapahtumat.push([laji, tiedot]),
    lueKv: async (k: string) => kv.get(k) ?? null,
    kirjoitaKv: async (k: string, v: string) => void kv.set(k, v),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("saatavuuden tunnistus", () => {
  it("pois käytöstä, loppu, puuttuu tuotteesta tai katalogista", () => {
    const pf = pfTuote([{ id: 11 }, { id: 12, is_enabled: false }, { id: 13, is_available: false }]);
    expect(epakelvotAvaimet(paita(), pf)).toEqual(["Musta|M", "Valkoinen|M", "Valkoinen|S"]);
    const kaikkiOk = pfTuote([{ id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }]);
    expect(epakelvotAvaimet(paita(), kaikkiOk, new Set([11, 12, 13]))).toEqual(["Valkoinen|M"]);
    expect(epakelvotAvaimet(paita(), kaikkiOk, null)).toEqual([]);
  });
  it("katalogi: tyhjä vastaus ei piilota mitään", () => {
    expect(katalogiJoukko({ variants: [] })).toBeNull();
    expect(katalogiJoukko({ variants: [{ id: 11 }, { id: 12 }] })).toEqual(new Set([11, 12]));
    expect(katalogiJoukko([{ id: 5 }])).toEqual(new Set([5]));
  });
  it("kaikki poissa ja yksittäinen variantti", () => {
    const p = paita({ unavailable_variants: ["Musta|S"] });
    expect(kaikkiPoissa(p)).toBe(false);
    expect(varianttiSaatavilla(p, 11)).toBe(false);
    expect(varianttiSaatavilla(p, 12)).toBe(true);
    const kaikki = paita({ unavailable_variants: ["Musta|S", "Musta|M", "Valkoinen|S", "Valkoinen|M"] });
    expect(kaikkiPoissa(kaikki)).toBe(true);
    expect(myynnissa(kaikki)).toBe(false);
    expect(myynnissa(p)).toBe(true);
  });
});

describe("/api/products: karsinta", () => {
  it("poistaa yhdistelmät sekä värit ja koot, joilla ei ole saatavaa yhdistelmää", () => {
    const k = karsiVariantit(paita({ unavailable_variants: ["Musta|S", "Musta|M", "Valkoinen|S"] }));
    expect(k.variants.variant_map).toEqual({ "Valkoinen|M": 14 });
    expect(k.variants.colors).toEqual(["Valkoinen"]);
    expect(k.variants.sizes).toEqual(["M"]);
    expect(k.variants.default_color).toBe("Valkoinen");
    expect(k.unavailable_variants).toEqual(["Musta|S", "Musta|M", "Valkoinen|S"]);
  });
  it("osittain loppunut koko jää valittavaksi, ilman listaa rivi ennallaan", () => {
    const k = karsiVariantit(paita({ unavailable_variants: ["Musta|S"] }));
    expect(k.variants.sizes).toEqual(["S", "M"]);
    expect(k.variants.colors).toEqual(["Musta", "Valkoinen"]);
    const ennallaan = karsiVariantit(paita());
    expect(ennallaan.variants).toEqual(paita().variants);
    expect(ennallaan.unavailable_variants).toEqual([]);
  });
  it("tilannekuva: mainin printify-saatavuus.json liitetään", () => {
    const [a, b] = liitaSaatavuusTiedosto([paita(), paita({ id: "p2", slug: "toinen" })], {
      products: { paita: { unavailable: ["Musta|S"] } }, kokonaan_ei_saatavilla: ["toinen"],
    });
    expect(a.unavailable_variants).toEqual(["Musta|S"]);
    expect(kaikkiPoissa(b)).toBe(true);
  });
  it("selaimen apuri", () => {
    const p = { unavailable_variants: ["Musta|S"] };
    expect(isVariantAvailable(p, "Musta", "S")).toBe(false);
    expect(isVariantAvailable(p, "Valkoinen", "S")).toBe(true);
    expect(availableSizes(p, "Musta", ["S", "M"])).toEqual(["M"]);
    expect(unavailableKeys({}).size).toBe(0);
  });
});

describe("Printify-haut (mockattu fetch)", () => {
  it("tuote ja katalogi oikeista osoitteista, kuristus ja 429-uusinta", async () => {
    vi.stubEnv("PRINTIFY_API_KEY", "testi");
    vi.stubEnv("PRINTIFY_SHOP_ID", "777");
    const osoitteet: string[] = [];
    let kerta = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      osoitteet.push(url);
      if (url.includes("/products/") && kerta++ === 0) return new Response("hidas", { status: 429 });
      if (url.includes("/catalog/")) return new Response(JSON.stringify({ variants: [{ id: 11 }, { id: 12 }, { id: 13 }] }), { status: 200 });
      return new Response(JSON.stringify(pfTuote([{ id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }])), { status: 200 });
    }));
    const odotukset: number[] = [];
    const kurista = teeKuristin({ odota: async (ms: number) => void odotukset.push(ms), kello: () => 0 });
    const katalogit = new Map();
    const hae = kurista((id: string) => haeTuote(id));
    const kat = kurista(haeKatalogiVariantit);
    const t1 = await tarkistaTuote(paita(), { haeTuote: hae, haeKatalogi: kat, katalogit });
    const t2 = await tarkistaTuote(paita({ id: "p2", printify_product_id: "pf2" }), { haeTuote: hae, haeKatalogi: kat, katalogit });
    expect(t1).toEqual({ unavailable: ["Valkoinen|M"] });
    expect(t2.unavailable).toEqual(["Valkoinen|M"]);
    expect(osoitteet[0]).toBe("https://api.printify.com/v1/shops/777/products/pf1.json");
    expect(osoitteet.filter((u) => u.includes("/catalog/"))).toEqual([
      "https://api.printify.com/v1/catalog/blueprints/6/print_providers/99/variants.json?show-out-of-stock=1",
    ]);
    expect(osoitteet.length).toBe(4); // 429 + uusinta + katalogi kerran + toinen tuote
    expect(odotukset).toContain(1000); // 429-tauko
    expect(odotukset.filter((ms) => ms !== 1000).every((ms) => ms % 200 === 0)).toBe(true);
  });
  it("404: tuote poistettu Printifystä, kaikki poissa; muu virhe ei muuta mitään", async () => {
    const t = await tarkistaTuote(paita(), { haeTuote: async () => vastaus(404, null) });
    expect(t).toMatchObject({ poistettu: true, unavailable: ["Musta|M", "Musta|S", "Valkoinen|M", "Valkoinen|S"] });
    expect(await tarkistaTuote(paita(), { haeTuote: async () => vastaus(500, null) })).toHaveProperty("virhe");
  });
});

describe("päivittäinen ajo", () => {
  it("tallentaa, piilottaa kokonaan loppuneen, lähettää yhden yhteenvedon ja palauttaa myöhemmin", async () => {
    const v = muistiVarasto([paita(), paita({ id: "p2", slug: "loppu", name: "Loppu", printify_product_id: "pf2" }), paita({ id: "p3", slug: "virhe", printify_product_id: "pf3" })]);
    const pf: Record<string, ReturnType<typeof vastaus>> = {
      pf1: vastaus(200, pfTuote([{ id: 11 }, { id: 12 }, { id: 13 }, { id: 14, is_available: false }])),
      pf2: vastaus(200, pfTuote([{ id: 11, is_enabled: false }])),
      pf3: vastaus(502, null),
    };
    const ilmoita = vi.fn(async (_m: Array<Record<string, unknown>>, _v?: string[]) => ({ ok: true }));
    const r = await ajaSaatavuus(v, { haeTuote: async (id: string) => pf[id], ilmoita });
    expect(r).toMatchObject({ tarkistettu: 3, muutoksia: 2, virheita: 1, jaljella: 0, ilmoitettu: true });
    expect(v.rivit[0]).toMatchObject({ unavailable_variants: ["Valkoinen|M"], is_active: true });
    expect(v.rivit[1]).toMatchObject({ is_active: false });
    expect(v.rivit[2].unavailable_variants).toBeUndefined();
    expect(v.tapahtumat).toEqual([["saatavuus_piilotettu", { product_id: "p2", slug: "loppu", poistettu: false }]]);
    expect(ilmoita).toHaveBeenCalledTimes(1);
    const rivit = muutosRivit(ilmoita.mock.calls[0][0]);
    expect(rivit).toContain("PIILOTETTU: Loppu (loppu), yksikään variantti ei ole saatavilla");
    expect(rivit).toContain("Ei saatavilla: Paita (paita): Valkoinen|M");
    expect(JSON.parse(v.kv.get(KV_PIILOTETUT)!)).toEqual(["p2"]);
    expect(JSON.parse(v.kv.get(KV_MUUTOKSET)!)).toEqual([]);

    // Seuraava päivä: ei muutoksia -> ei sähköpostia.
    v.tarkistettu.clear();
    pf.pf3 = vastaus(200, pfTuote([{ id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }]));
    const ilmoita2 = vi.fn(async (_m: Array<Record<string, unknown>>, _v?: string[]) => ({ ok: true }));
    const r2 = await ajaSaatavuus(v, { haeTuote: async (id: string) => pf[id], ilmoita: ilmoita2 });
    expect(r2.muutoksia).toBe(0);
    expect(ilmoita2).not.toHaveBeenCalled();

    // Variantti palaa: tarkistuksen piilottama tuote palautetaan myyntiin.
    v.tarkistettu.clear();
    pf.pf2 = vastaus(200, pfTuote([{ id: 11 }]));
    const ilmoita3 = vi.fn(async (_m: Array<Record<string, unknown>>, _v?: string[]) => ({ ok: true }));
    await ajaSaatavuus(v, { haeTuote: async (id: string) => pf[id], ilmoita: ilmoita3 });
    expect(v.rivit[1]).toMatchObject({ is_active: true, unavailable_variants: ["Musta|M", "Valkoinen|M", "Valkoinen|S"] });
    expect(muutosRivit(ilmoita3.mock.calls[0][0])).toContain("PALAUTETTU MYYNTIIN: Loppu (loppu)");
    expect(JSON.parse(v.kv.get(KV_PIILOTETUT)!)).toEqual([]);
  });
  it("käsin piilotettua ei palauteta; erissä yhteenveto vasta lopuksi", async () => {
    const v = muistiVarasto([paita({ is_active: false }), paita({ id: "p2", slug: "b", printify_product_id: "pf2" }), paita({ id: "p3", slug: "c", printify_product_id: "pf3" })]);
    const haeTuote = vi.fn(async () => vastaus(200, pfTuote([{ id: 11, is_available: false }, { id: 12 }, { id: 13 }, { id: 14 }])));
    const ilmoita = vi.fn(async (_m: Array<Record<string, unknown>>, _v?: string[]) => ({ ok: true }));
    let aika = 0;
    const kello = () => (aika += 20);
    const r1 = await ajaSaatavuus(v, { haeTuote, ilmoita, budjettiMs: 30, kello });
    expect(r1.tarkistettu).toBe(1);
    expect(r1.jaljella).toBe(1);
    expect(ilmoita).not.toHaveBeenCalled();
    const r2 = await ajaSaatavuus(v, { haeTuote, ilmoita, budjettiMs: 1e9 });
    expect(r2.jaljella).toBe(0);
    expect(ilmoita).toHaveBeenCalledTimes(1);
    expect(ilmoita.mock.calls[0][0]).toHaveLength(2);
    expect(haeTuote).toHaveBeenCalledTimes(2); // p1 käsin piilotettu: ei tarkisteta
    expect(v.rivit[0].is_active).toBe(false);
  });
  it("kuivaharjoitus ei kirjoita", async () => {
    const v = muistiVarasto([paita()]);
    const r = await ajaSaatavuus(v, { haeTuote: async () => vastaus(404, null), kuiva: true });
    expect(r.muutoksia).toBe(1);
    expect(v.rivit[0].is_active).toBe(true);
    expect(v.kv.size).toBe(0);
  });
});

describe("kassa", () => {
  const pyynto = (items: unknown[]) => ({ items, customerEmail: "a@b.fi", shippingAddress: { address: "Katu 1", zip: "00100", city: "Helsinki" } });
  it("hylkää saatavuudettoman variantin selkeällä viestillä, muut käyvät", () => {
    const p = paita({ unavailable_variants: ["Musta|S"] });
    expect(() => laskeTilaus(pyynto([{ id: "p1", quantity: 1, color: "Musta", size: "S" }]), [p], null)).toThrow(KassaVirhe);
    try {
      laskeTilaus(pyynto([{ id: "p1", quantity: 1, color: "Musta", size: "S" }]), [p], null);
    } catch (e) {
      expect((e as KassaVirhe).message).toContain(EI_SAATAVILLA_VIESTI);
      expect((e as KassaVirhe).vaihe).toBe("variant_unavailable");
      expect((e as KassaVirhe).message).not.toMatch(/[–—]/);
    }
    expect(laskeTilaus(pyynto([{ id: "p1", quantity: 1, color: "Musta", size: "M" }]), [p], null).rivit[0].variant_id).toBe(12);
  });
  it("reaaliaikainen tarkistus: yksi haku per tuote, yhdiste tallennettuun, virheessä tallennettu tieto", async () => {
    const tuotteet = [paita({ unavailable_variants: ["Valkoinen|M"] }), paita({ id: "p2", slug: "b", printify_product_id: "pf2" })];
    const haeTuote = vi.fn(async (id: string) => (id === "pf1" ? vastaus(200, pfTuote([{ id: 11, is_available: false }, { id: 12 }, { id: 13 }, { id: 14 }])) : Promise.reject(new Error("aikaraja"))));
    const items = [{ id: "p1", quantity: 1 }, { slug: "paita", quantity: 2 }, { id: "p2", quantity: 1 }, { type: "giftcard", id: "lahjakortti-50", quantity: 1 }];
    const tuoreet = await liveSaatavuus(tuotteet, items, { haeTuote });
    expect(haeTuote).toHaveBeenCalledTimes(2);
    expect(tuoreet[0].unavailable_variants).toEqual(["Musta|S", "Valkoinen|M"]);
    expect(tuoreet[1]).toBe(tuotteet[1]);
    expect(() => laskeTilaus(pyynto([{ id: "p1", quantity: 1, color: "Musta", size: "S" }]), tuoreet, null)).toThrow(EI_SAATAVILLA_VIESTI);
  });
});
