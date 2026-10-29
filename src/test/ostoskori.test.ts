import { describe, it, expect } from "vitest";
import { toimitusTila, valitseSuositukset, suoraLisays, fyysinenSumma, arvioiPakettialennus, paketinTiedot, PAKETTIMAARITYKSET } from "@/lib/ostoskori";
import { TOIMITUSMAKSU, ILMAINEN_TOIMITUS_RAJA } from "@/config/toimitus";
import { lahjakorttiTuote } from "../../api/_lib/lahjakortti.js";
import type { Product } from "@/types/product";

const tuote = (slug: string, price: number, category = "t-paidat", extra: Partial<Product> = {}): Product => ({
  id: slug, slug, name: slug, category, humor_type: "yleinen", price, stock: 99, description: "", images: [],
  variants: { variant_map: { "Musta|M": 1, "Musta|L": 2 } }, is_featured: false, is_new: false, is_gift_idea: false, ...extra,
});
const rivi = (product: Product, quantity = 1) => ({ product, quantity });

const paita = tuote("oispa-kaljaa-t-paita", 24.9);
const huppari = tuote("oispa-kaljaa-huppari", 49.9, "hupparit");
const muutPaita = tuote("saunassa-t-paita", 24.9);
const muuHuppari = tuote("saunassa-huppari", 49.9, "hupparit");
const pipo = tuote("talvi-pipo", 32.9, "pipot", { variants: { variant_map: { "Musta|OS": 5 } } });
const tarra = tuote("tarra-x", 4.99, "tarrat", { variants: { variant_map: { "|OS": 9 } } });
const muki = tuote("oispa-kaljaa-muki", 19.9, "mukit");
const oma = tuote("oma-tekstikuva-t-paita", 24.9, "t-paidat", { name: "Oma teksti/kuva | T-Paita" });
const halpaKate = tuote("halpa-huppari", 49.9, "hupparit", {
  variants: { variant_map: { "Musta|M": 7 }, costs: { "7": 3500 }, shipping_cents: 900 },
});
const r2 = (n: number) => Math.round(n * 100) / 100;
const kaikki = [paita, huppari, muutPaita, muuHuppari, pipo, tarra, muki, oma, halpaKate];

describe("Ilmainen toimitus", () => {
  it("puuttuva summa ja edistyminen", () => {
    const t = toimitusTila([rivi(paita)]);
    expect(t).toMatchObject({ summa: 24.9, puuttuu: r2(ILMAINEN_TOIMITUS_RAJA - 24.9), ilmainen: false, toimitus: TOIMITUSMAKSU });
    expect(t.edistyminen).toBeCloseTo((24.9 / ILMAINEN_TOIMITUS_RAJA) * 100, 1);
    expect(toimitusTila([rivi(paita), rivi(huppari, 2)])).toMatchObject({ ilmainen: true, puuttuu: 0, toimitus: 0 });
  });
  it("tasan rajan suuruinen summa on ilmainen", () => {
    expect(toimitusTila([rivi(tuote("x", ILMAINEN_TOIMITUS_RAJA))]).ilmainen).toBe(true);
    expect(toimitusTila([rivi(tuote("x", ILMAINEN_TOIMITUS_RAJA - 0.01))]).puuttuu).toBe(0.01);
  });
  it("lahjakortit eivät kerrytä rajaa, pelkät lahjakortit ilman toimitusta", () => {
    const kortti = lahjakorttiTuote(75) as Product;
    expect(fyysinenSumma([rivi(kortti), rivi(paita)])).toBe(24.9);
    expect(toimitusTila([rivi(kortti), rivi(paita)]).puuttuu).toBe(r2(ILMAINEN_TOIMITUS_RAJA - 24.9));
    expect(toimitusTila([rivi(kortti)])).toMatchObject({ vainLahjakortteja: true, toimitus: 0, puuttuu: 0 });
  });
});

describe("Suositukset", () => {
  it("lähin hinta, joka täyttää puuttuvan summan, ja sama teema ensin", () => {
    // Korissa paita 24,90 -> puuttuu raja - 24,90 (huppari 49,90 täyttää sen). Saman teeman huppari (49,90) ensin, sitten muut.
    const s = valitseSuositukset([rivi(paita)], kaikki, 4);
    expect(s[0].product.slug).toBe("oispa-kaljaa-huppari");
    expect(s[0].samaTeema).toBe(true);
    expect(s.length).toBeGreaterThanOrEqual(3);
    expect(s.length).toBeLessThanOrEqual(4);
  });
  it("puuttuvan summan ylittävä hinta ennen vajaaksi jäävää", () => {
    // Korissa tuote, jonka hinta jättää puuttumaan 29,10 (raja - 29,10): pipo 32,90 (ylittää 3,80) ennen paitaa 24,90 (vajaa 4,20 * 3)
    const s = valitseSuositukset([rivi(tuote("saunassa-huppari", r2(ILMAINEN_TOIMITUS_RAJA - 29.1), "hupparit"))], [pipo, paita, tarra], 4);
    expect(s.map((x) => x.product.slug)).toEqual(["talvi-pipo", "oispa-kaljaa-t-paita", "tarra-x"]);
  });
  it("ei piilotettuja kategorioita, personoitavia, alle 40 %:n katetta eikä korissa olevia", () => {
    const s = valitseSuositukset([rivi(paita)], kaikki, 10).map((x) => x.product.slug);
    expect(s).not.toContain("oispa-kaljaa-muki");
    expect(s).not.toContain("oma-tekstikuva-t-paita");
    expect(s).not.toContain("halpa-huppari");
    expect(s).not.toContain("oispa-kaljaa-t-paita");
  });
  it("koko tai väri pitää valita: linkki tuotesivulle, yksi variantti: suoraan koriin", () => {
    expect(suoraLisays(paita)).toBeNull();
    expect(suoraLisays(pipo)).toEqual({ color: "Musta", size: "OS" });
    expect(suoraLisays(tarra)).toEqual({ color: undefined, size: "OS" });
    expect(suoraLisays(oma)).toBeNull();
  });
});

describe("Pakettialennuksen arvio", () => {
  // Generoidut paketit ovat nyt pois käytöstä (kate alle 30 %); arvio testataan käytössä olevalla määrityksellä.
  const pk = { ...PAKETTIMAARITYKSET[0], alennus_prosentti: 10, kaytossa: undefined };
  const [a, b] = pk.tuotteet;
  const kulut = { variant_map: { "Musta|M": 1 }, costs: { "1": 700 }, shipping_cents: 400 };
  const ta = tuote(a, 24.9, "t-paidat", { variants: kulut });
  const tb = tuote(b, 49.9, "hupparit", { variants: { ...kulut, costs: { "1": 1500 } } });
  it("tuntemattomat kulut: ei alennusta", () => {
    expect(paketinTiedot(pk, [tuote(a, 24.9), tuote(b, 49.9, "hupparit")])?.alennusVoimassa).toBe(false);
    expect(arvioiPakettialennus([rivi(tuote(a, 24.9)), rivi(tuote(b, 49.9, "hupparit"))], [tuote(a, 24.9), tuote(b, 49.9, "hupparit")])).toBe(0);
  });
  it("tunnetut kulut ja kate >= 30 %: alennus, ei alennuskoodin kanssa", () => {
    expect(paketinTiedot(pk, [ta, tb])).toMatchObject({ alennusVoimassa: true, yhteensa: 74.8, pakettihinta: 67.32 });
    expect(paketinTiedot({ ...pk, kaytossa: false }, [ta, tb])).toMatchObject({ alennusVoimassa: false, pakettihinta: 74.8 });
    expect(arvioiPakettialennus([rivi(ta), rivi(tb)], [ta, tb], false, [pk])).toBe(7.48);
    // Generoitu määritys on pois käytöstä: ei arviota.
    expect(arvioiPakettialennus([rivi(ta), rivi(tb)], [ta, tb])).toBe(0);
    expect(arvioiPakettialennus([rivi(ta)], [ta, tb])).toBe(0);
    expect(arvioiPakettialennus([rivi(ta), rivi(tb)], [ta, tb], true)).toBe(0);
  });
});
