// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ajaEuSiirrot, euReitityksenTila, euSiirtoKansio } from "../../api/_lib/eu-siirrot.js";
import { EU_PIILOTETUT } from "../../api/_lib/eu-reititys-data.js";
import { onEuReititetty } from "../../api/_lib/eu-reititys.js";
import { lueEuSiirrot } from "../../scripts/lib/eu-kanta.mjs";
import { generoi, KOHDE } from "../../scripts/generoi-printify-sync.mjs";
import { buildProductRow as generoituBuild } from "../../api/_lib/printify-sync.generated.js";
// Polku muuttujassa: tsc (tsconfig.app.json) ei tarkista Deno-moduulia, vitest lataa sen normaalisti.
const syncPolku = "../../supabase/functions/_shared/printify-sync.ts";
/* eslint-disable @typescript-eslint/no-explicit-any -- testin muistitaulu ja Deno-moduulin tyypitön paluuarvo */
const { buildProductRow } = (await import(/* @vite-ignore */ syncPolku)) as { buildProductRow: (p: unknown, s?: string[]) => any };
type Rivi = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

function muistiKanta(alku: Rivi[] = []) {
  const rivit: Rivi[] = alku.map((r) => structuredClone(r));
  return {
    rivit: async () => rivit.map((r) => ({ slug: r.slug, printify_product_id: r.printify_product_id, variants: r.variants })),
    rivitTuotteelle: async (id: string) => rivit.filter((r) => String(r.printify_product_id) === String(id)).map((r) => ({ ...r })),
    paivita: async (slug: string, kentat: Rivi) => { Object.assign(rivit.find((r) => r.slug === slug)!, structuredClone(kentat)); },
    lisaa: async () => false,
    poista: async (slug: string) => { rivit.splice(rivit.findIndex((r) => r.slug === slug), 1); },
    taulu: rivit,
  };
}

const VANHA = "69e40e5a9ab6f6d65e0033ff";
const UUSI = "6ae0ab0fc03126692306fb30";
const tuote = (id: string, pp: number, vid: number) => ({
  id, title: "Super äiskä | T-Paita", description: "Paita", tags: [], blueprint_id: 145, print_provider_id: pp,
  variants: [{ id: vid, title: "M / Black", is_enabled: true, is_available: true, price: 2490, cost: pp === 30 ? 900 : 1100 }],
  images: [{ src: `https://images.printify.com/mockup/${id}/front.jpg?camera_label=front`, variant_ids: [vid], is_default: true }],
});

describe("printify-sync.generated.js (Vercel-funktion buildProductRow)", () => {
  it("on ajan tasalla lähteen kanssa (node scripts/generoi-printify-sync.mjs)", () => {
    expect(readFileSync(KOHDE, "utf8")).toBe(generoi());
  });
  it("tuottaa saman rivin kuin TypeScript-lähde", () => {
    const p = tuote(UUSI, 30, 101);
    expect(generoituBuild(p, [])).toEqual(buildProductRow(p, []));
  });
});

describe("ajaEuSiirrot (?tehtava=eu-siirrot)", () => {
  const kansio = mkdtempSync(path.join(tmpdir(), "eu-siirrot-"));
  writeFileSync(path.join(kansio, "eu-siirto-2026-10-27.json"), JSON.stringify({ paiva: "2026-10-27", siirrot: [{ vanhaId: VANHA, uusiId: UUSI, title: "Super äiskä | T-Paita" }] }));
  const vanhaRivi = {
    slug: "super-aiska-t-paita", name: "Super äiskä", price: 24.9, printify_product_id: VANHA,
    variants: { ...buildProductRow(tuote(VANHA, 99, 1), []).variants, costs: { 1: 1100 }, shipping_cents: 1039, shipping_additional_cents: 900, print_provider_id: 99 },
    images: ["vanha.jpg"], unavailable_variants: ["Black|XS"],
  };
  const haut = {
    haeTuote: vi.fn(async (id: string) => (id === UUSI ? tuote(UUSI, 30, 101) : null)),
    toimitus: vi.fn(async () => 849),
    kulutRivi: vi.fn(async (p: Rivi) => ({ costs: { [String(p.variants[0].id)]: p.variants[0].cost }, shipping_cents: 849, shipping_additional_cents: 300, print_provider_id: p.print_provider_id })),
  };

  it("kuiva-ajo ei kirjoita ja kertoo siirrettävät", async () => {
    const kanta = muistiKanta([vanhaRivi]);
    const r = await ajaEuSiirrot({ kanta, dataKansio: kansio, haut, buildProductRow, kuiva: true });
    expect(r).toMatchObject({ ok: true, kuiva: true, kirjattuja: 1, siirrettavia: 1, paivitetty: 0 });
    expect(kanta.taulu[0].printify_product_id).toBe(VANHA);
    expect(r.euReititys.vanhassa).toContainEqual({ slug: "super-aiska-t-paita", printify_product_id: VANHA });
  });

  it("siirtää rivin EU-kopioon kuluineen ja on idempotentti", async () => {
    const kanta = muistiKanta([vanhaRivi]);
    const r = await ajaEuSiirrot({ kanta, dataKansio: kansio, haut, buildProductRow });
    expect(r).toMatchObject({ ok: true, paivitetty: 1, virheet: [] });
    const rivi = kanta.taulu[0];
    expect(rivi).toMatchObject({ slug: "super-aiska-t-paita", name: "Super äiskä", price: 24.9, printify_product_id: UUSI, unavailable_variants: [] });
    expect(rivi.variants).toMatchObject({ costs: { "101": 900 }, shipping_cents: 849, shipping_additional_cents: 300, print_provider_id: 30 });
    expect(Object.values(rivi.variants.variant_map)).toEqual([101]);
    expect(r.euReititys.vanhassa.map((v: Rivi) => v.slug)).not.toContain("super-aiska-t-paita");
    // Siirron jälkeen rivi näkyy kaupassa (ei enää EU-reitityksen piilottama).
    expect(onEuReititetty({ slug: rivi.slug, printify_product_id: rivi.printify_product_id })).toBe(false);
    expect(onEuReititetty({ slug: rivi.slug, printify_product_id: VANHA })).toBe(true);
    haut.haeTuote.mockClear();
    const toinen = await ajaEuSiirrot({ kanta, dataKansio: kansio, haut, buildProductRow });
    expect(toinen).toMatchObject({ siirrettavia: 0, paivitetty: 0, jo: 1 });
    expect(haut.haeTuote).not.toHaveBeenCalled();
  });

  it("jättää loput seuraavaan ajoon, kun aika loppuu", async () => {
    const kanta = muistiKanta([vanhaRivi]);
    const r = await ajaEuSiirrot({ kanta, dataKansio: kansio, haut, buildProductRow, aikaa: () => false });
    expect(r).toMatchObject({ paivitetty: 0, kesken: 1 });
    expect(kanta.taulu[0].printify_product_id).toBe(VANHA);
  });
});

describe("EU-reitityksen piilottamat 35 riviä ja kirjatut EU-kopiot", () => {
  const siirrot = lueEuSiirrot(euSiirtoKansio()!);
  // Printifyn katalogissa ei ole EU-painotaloa keraamisille koristeille eikä lippiksille (27.10.2026), KATTEET.md.
  const EI_EU_VAIHTOEHTOA = ["maailman-paras-ystava-ornament-ceramic-ornament", "oma-tekstikuva-koriste", "oma-tekstikuva-lippis"];

  it("jokaisella piilotetulla on EU-kopio paitsi kolmella, joille EU-painotaloa ei ole", () => {
    const ilman = Object.entries(EU_PIILOTETUT).filter(([, id]) => !siirrot.vanhaan.has(String(id))).map(([slug]) => slug);
    expect(Object.keys(EU_PIILOTETUT)).toHaveLength(35);
    expect(ilman.sort()).toEqual([...EI_EU_VAIHTOEHTOA].sort());
  });

  it("kun rivit osoittavat EU-kopioihin, 32 näkyy ja tila kertoo 3 jäävän", () => {
    const rivit = Object.entries(EU_PIILOTETUT).map(([slug, id]) => ({ slug, printify_product_id: siirrot.vanhaan.get(String(id))?.uusiId ?? id }));
    const tila = euReitityksenTila(rivit, siirrot);
    expect(tila).toMatchObject({ yhteensa: 35, euKopiossa: 32, eiRivia: [] });
    expect(tila.vanhassa.map((v: Rivi) => v.slug).sort()).toEqual([...EI_EU_VAIHTOEHTOA].sort());
    expect(rivit.filter((r) => !onEuReititetty(r))).toHaveLength(32);
  });

  it("syöte (oma tausta): EU-kopioon siirretty rivi pysyy, vanhaan osoittava putoaa", async () => {
    const { dropHiddenItems } = await import("../../api/product-feed.js");
    const { validateItem } = await import("../../scripts/syote-validointi.mjs");
    const slug = "super-aiska-t-paita";
    const xml = `<channel><item><g:link>https://huumorikauppa.fi/tuote/${slug}</g:link></item></channel>`;
    expect(dropHiddenItems(xml)).not.toContain(slug);
    expect(dropHiddenItems(xml, new Map([[slug, { slug, printify_product_id: VANHA }]]))).not.toContain(slug);
    expect(dropHiddenItems(xml, new Map([[slug, { slug, printify_product_id: UUSI }]]))).toContain(slug);
    const item = { fields: { link: [`https://huumorikauppa.fi/tuote/${slug}`] }, shipping: [] };
    const tyypit = (o: Rivi = {}) => validateItem(item, o).map((x: Rivi) => x.tyyppi);
    expect(tyypit()).toContain("valmistetaan_eu_ulkopuolella");
    expect(tyypit({ euReititetty: () => false })).not.toContain("valmistetaan_eu_ulkopuolella");
  });

  it("vercel.json tuo siirtokirjaukset cron-funktioon", () => {
    const v = JSON.parse(readFileSync("vercel.json", "utf8"));
    expect(v.functions["api/cron/tilaukset.js"].includeFiles).toMatch(/eu-siirto-\*\.json/);
  });
});
