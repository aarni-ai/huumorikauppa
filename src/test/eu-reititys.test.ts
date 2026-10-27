import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  EU_REITITYS_GENERATED_AT,
  EU_OHJAUKSET,
  EU_PIILOTETUT,
  EI_EU_PRINTIFY_TUOTTEET,
} from "../../api/_lib/eu-reititys-data.js";
import { euOhjausKohde, onEuReititetty, onEuReititettySlug } from "../../api/_lib/eu-reititys.js";
import { kaksoiskappaleenPerusslug } from "../../api/_lib/kaksoiskappaleet.js";
import { OHJATUT_TUOTESLUGIT } from "../../api/_lib/ohjatut-tuotteet.js";
import { dropHiddenItems } from "../../api/product-feed.js";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { laskeEuReititys, painotalonTila, siirtoKartta, renderDataModule } from "../../scripts/lib/eu-reititys.mjs";

const PRINTIFY_ID = /^[0-9a-f]{24}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const raportti = JSON.parse(readFileSync("data/eu-reititys.json", "utf8"));

describe("EU-reitityksen generoitu data (api/_lib/eu-reititys-data.js)", () => {
  it("muoto: aikaleima, ohjaukset, piilotetut ja EU:n ulkopuoliset tuotteet", () => {
    expect(typeof EU_REITITYS_GENERATED_AT).toBe("string");
    expect(Number.isNaN(Date.parse(EU_REITITYS_GENERATED_AT as string))).toBe(false);
    for (const [slug, kohde] of Object.entries(EU_OHJAUKSET as Record<string, string>)) {
      expect(slug, slug).toMatch(SLUG);
      expect(kohde, slug).toMatch(SLUG);
      expect(kohde, slug).not.toBe(slug);
    }
    for (const [slug, id] of Object.entries(EU_PIILOTETUT as Record<string, string>)) {
      expect(slug, slug).toMatch(SLUG);
      expect(id, slug).toMatch(PRINTIFY_ID);
    }
    expect(Array.isArray(EI_EU_PRINTIFY_TUOTTEET)).toBe(true);
    for (const id of EI_EU_PRINTIFY_TUOTTEET) expect(id).toMatch(PRINTIFY_ID);
    expect(new Set(EI_EU_PRINTIFY_TUOTTEET).size).toBe(EI_EU_PRINTIFY_TUOTTEET.length);
  });

  it("ohjauksen kohde on näkyvä: ei ketjuja, ei piilotettuja, ei kaksoiskappaleita eikä vercel-ohjattuja", () => {
    const ohjaukset = EU_OHJAUKSET as Record<string, string>;
    for (const [slug, kohde] of Object.entries(ohjaukset)) {
      expect(kohde in ohjaukset, `${slug} -> ${kohde} ketju`).toBe(false);
      expect(kohde in EU_PIILOTETUT, `${slug} -> ${kohde} piilotettu`).toBe(false);
      expect(kaksoiskappaleenPerusslug(kohde), kohde).toBeNull();
      expect(OHJATUT_TUOTESLUGIT.has(kohde), kohde).toBe(false);
      expect(onPiilotettuTuote({ slug: kohde, category: "t-paidat" }), kohde).toBe(false);
    }
  });

  it("slug on joko ohjattu tai piilotettu, ja piilotuksen syy on EU:n ulkopuolinen tuote", () => {
    for (const slug of Object.keys(EU_PIILOTETUT)) expect(slug in EU_OHJAUKSET, slug).toBe(false);
    const eiEu = new Set(EI_EU_PRINTIFY_TUOTTEET);
    for (const [slug, id] of Object.entries(EU_PIILOTETUT as Record<string, string>)) expect(eiEu.has(id), slug).toBe(true);
  });

  it("raportti data/eu-reititys.json vastaa moduulia", () => {
    expect(raportti.generoitu).toBe(EU_REITITYS_GENERATED_AT);
    expect(raportti.ohjaukset).toEqual(EU_OHJAUKSET);
    expect(raportti.piilotetut).toEqual(EU_PIILOTETUT);
    const y = raportti.yhteenveto;
    expect(y.ohjattuja).toBe(Object.keys(EU_OHJAUKSET).length);
    expect(y.piilotettuja).toBe(Object.keys(EU_PIILOTETUT).length);
    expect(y.liputettuja).toBe(y.ohjattuja + y.piilotettuja);
    expect(y.ei_eu_printify_tuotteita).toBe(EI_EU_PRINTIFY_TUOTTEET.length);
    expect(Array.isArray(raportti.tuotteet)).toBe(true);
    expect(raportti.tuotteet.length).toBe(y.nakyvia_riveja);
    for (const t of raportti.tuotteet) {
      expect(["ok", "liputettu", "tuntematon"], t.slug).toContain(t.tila);
      expect(typeof t.variantteja, t.slug).toBe("number");
      if (t.tila === "liputettu") {
        expect(t.eu, t.slug).toBe(false);
        expect(["ohjaus", "piilotus"], t.slug).toContain(t.toimenpide);
        if (t.toimenpide === "ohjaus") expect(EU_OHJAUKSET[t.slug as keyof typeof EU_OHJAUKSET]).toBe(t.kohde);
        else expect(t.slug in EU_PIILOTETUT, t.slug).toBe(true);
      }
      if (t.tila === "ok") expect(t.eu, t.slug).toBe(true);
    }
  });
});

describe("EU-reititys ajossa", () => {
  const [slug, id] = Object.entries(EU_PIILOTETUT as Record<string, string>)[0] ?? [];

  it("piilotettu slug: piilossa kaupasta ja syötteestä, ei ohjausta", () => {
    if (!slug) return;
    expect(onEuReititettySlug(slug)).toBe(true);
    expect(onEuReititetty({ slug })).toBe(true);
    expect(onEuReititetty({ slug, printify_product_id: id })).toBe(true);
    expect(onPiilotettuTuote({ slug, category: "t-paidat" })).toBe(true);
    expect(euOhjausKohde(slug)).toBeNull();
    const xml = `<channel><item><g:link>https://huumorikauppa.fi/tuote/${slug}</g:link></item><item><g:link>https://huumorikauppa.fi/tuote/x-t-paita</g:link></item></channel>`;
    expect(dropHiddenItems(xml)).not.toContain(slug);
  });

  it("yöllinen synkronointi osoittaa rivin EU-kopioon: piilotus raukeaa; EU:n ulkopuoliseen: piilotetaan", () => {
    if (!slug) return;
    expect(onEuReititetty({ slug, printify_product_id: "0".repeat(24) })).toBe(false);
    expect(onEuReititetty({ slug: "uusi-rivi-t-paita", printify_product_id: EI_EU_PRINTIFY_TUOTTEET[0] })).toBe(true);
    expect(onEuReititetty({ slug: "uusi-rivi-t-paita", printify_product_id: "0".repeat(24) })).toBe(false);
  });
});

describe("EU-reitityksen logiikka (scripts/lib/eu-reititys.mjs)", () => {
  const painotalot = new Map([
    [30, { title: "OPT OnDemand", location: { country: "CZ" } }],
    [99, { title: "Printify Choice", location: { country: "US" } }],
    [1, { title: "SPOKE Custom Products", location: { country: "US" } }],
    [94, { title: "Harrier", location: { country: "GB" } }],
  ]);
  const t = (id: string, title: string, pp: number) => ({ id, title, print_provider_id: pp, blueprint_id: 145, variants: [{ id: 1 }] });
  const r = (slug: string, pid: string, category = "t-paidat") => ({ slug, category, is_active: true, printify_product_id: pid, variants: { variant_map: { "Black|M": 1 } } });

  it("painotalon tila: EU-maa ok, Choice aina reititys, GB ja US ei EU", () => {
    expect(painotalonTila(30, painotalot.get(30)).eu).toBe(true);
    expect(painotalonTila(99, { location: { country: "CZ" } })).toMatchObject({ eu: false, syy: "reititys" });
    expect(painotalonTila(94, painotalot.get(94))).toMatchObject({ eu: false, maa: "GB" });
    expect(painotalonTila(5, null)).toMatchObject({ eu: false, syy: "sijainti_tuntematon" });
  });

  it("ohjaus EU-kopion näkyvään riviin, muuten piilotus", () => {
    const tuotteet = [
      t("a1", "A | T-Paita", 99), t("a2", "A | T-Paita", 30), // samanniminen EU-kopio, näkyvä rivi
      t("b1", "B | T-Paita", 99), t("b2", "B uusi", 30), // siirtotiedoston kopio ilman kaupparivia
      t("c1", "C | Huppari", 1), // ei kopiota
      t("d1", "D | T-Paita", 30), // EU ok
      t("e1", "E", 99), t("e2", "E", 30), // kopion rivi eri kategoriassa
    ];
    const rivit = [r("a", "a1"), r("a-eu", "a2"), r("b", "b1"), r("c", "c1", "hupparit"), r("d", "d1"), r("e", "e1"), r("e-muki", "e2", "mukit")];
    const siirrot = siirtoKartta([{ siirrot: [{ vanhaId: "b1", uusiId: "b2" }] }]);
    const tulos = laskeEuReititys({ rivit, tuotteet, painotalot, siirrot, onNakyva: () => true });
    expect(tulos.ohjaukset).toEqual({ a: "a-eu" });
    expect(tulos.piilotetut).toEqual({ b: "b1", c: "c1", e: "e1" });
    const syy = Object.fromEntries(tulos.tuotteet.map((x: { slug: string; piilotuksen_syy?: string }) => [x.slug, x.piilotuksen_syy]));
    expect(syy).toMatchObject({ b: "eu_kopiolla_ei_nakyvaa_kaupparivia", c: "ei_eu_kopiota", e: "eu_kopiolla_ei_nakyvaa_kaupparivia" });
    expect(tulos.eiEuTuotteet).toEqual(["a1", "b1", "c1", "e1"]);
    expect(tulos.yhteenveto).toMatchObject({ nakyvia_riveja: 7, liputettuja: 4, ohjattuja: 1, piilotettuja: 3 });
    const moduuli = renderDataModule({ generoitu: "2026-10-27T00:00:00.000Z", ...tulos });
    expect(moduuli).toContain('export const EU_OHJAUKSET = {\n  "a": "a-eu"\n};');
    expect(moduuli).toContain("export const EI_EU_PRINTIFY_TUOTTEET = [");
  });

  it("puuttuva Printify-tuote on tuntematon (ei piiloteta, printify-saatavuus hoitaa)", () => {
    const tulos = laskeEuReititys({ rivit: [r("x", "puuttuu")], tuotteet: [], painotalot, onNakyva: () => true });
    expect(tulos.tuotteet[0]).toMatchObject({ tila: "tuntematon" });
    expect(tulos.piilotetut).toEqual({});
  });
});
