// @vitest-environment node
/** Tilausvahdin puhtaat osat, päivän yhteenvedon toteutunut kate ja Premium-laskelma sekä tilauskatteet-skriptin laskenta. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { rivinPainotalo, printifyKulut, tilauksenMyynti, tarkistaEnnenTuotantoa, tyhjennaPainotalot } from "../../api/_lib/tilausvahti.js";
import { maaKoodi, onEU } from "../../api/_lib/eu.js";
import { premiumSaasto, premiumRivit } from "../../api/_lib/premium.js";
import { yhteenveto, toteutunutKate, pysaytetynSeuranta, taydennaKulut, premiumTilauksista } from "../../api/_lib/valvonta.js";
import { asiakas, teeHinnasto, siirtoKartta, laskeTilaus, yhteensa, korvaaOsio, markdown, KASIN_ALKU, KASIN_LOPPU } from "../../scripts/lib/tilauskatteet.mjs";

type Rivi = Record<string, unknown>;
const katalogi: Record<number, Rivi> = {
  1: { title: "SPOKE Custom Products", location: { country: "US" } },
  30: { title: "OPT OnDemand", location: { country: "CZ" } },
  99: { title: "Printify Choice", location: { country: "US" } },
};
const hae = vi.fn(async (id: number) => (katalogi[id] ? { ok: true, data: katalogi[id] } : { ok: false, data: null }));
beforeEach(() => { tyhjennaPainotalot(); hae.mockClear(); });

describe("Tilausvahti: painotalon maa", () => {
  it("maat nimellä ja koodilla", () => {
    expect(maaKoodi("Czech Republic")).toBe("CZ");
    expect(maaKoodi("United States")).toBe("US");
    expect(maaKoodi("lv")).toBe("LV");
    expect(maaKoodi("Atlantis")).toBeNull();
    expect(onEU(maaKoodi("Latvia"))).toBe(true);
  });
  it("EU, ei-EU, Choice ja välimuisti", async () => {
    expect(await rivinPainotalo({ print_provider_id: 30, metadata: { country: "Czech Republic" } }, hae)).toMatchObject({ eu: true, maa: "CZ", nimi: "OPT OnDemand" });
    expect(await rivinPainotalo({ print_provider_id: 1, metadata: { country: "United States" } }, hae)).toMatchObject({ eu: false, maa: "US" });
    // Katalogi EU, rivi ei-EU: tiukka (ei-EU).
    expect(await rivinPainotalo({ print_provider_id: 30, metadata: { country: "United States" } }, hae)).toMatchObject({ eu: false });
    expect(await rivinPainotalo({ print_provider_id: 99, metadata: { country: "United States" } }, hae)).toMatchObject({ eu: false, choice: true });
    expect(await rivinPainotalo({ print_provider_id: 99, metadata: {} }, hae)).toMatchObject({ eu: false, choice: true });
    expect(await rivinPainotalo({ print_provider_id: 99, metadata: { country: "Germany" } }, hae)).toMatchObject({ eu: true, choice: true });
    expect(await rivinPainotalo({ print_provider_id: 417, metadata: { country: "Latvia" } }, hae)).toMatchObject({ eu: true, maa: "LV", nimi: "#417" });
    expect(await rivinPainotalo({ print_provider_id: 417, metadata: {} }, hae)).toMatchObject({ eu: null });
    expect(hae.mock.calls.filter(([id]) => id === 30)).toHaveLength(1);
  });
  it("kulut, myynti ja tulos", async () => {
    const o = { total_price: 644, total_shipping: 2469, total_tax: 793, line_items: [{ print_provider_id: 1, metadata: { title: "Muki", country: "United States" } }] };
    expect(printifyKulut(o)).toEqual({ kulu: 39.06, kuluIlmanAlv: 31.13, tuotteet: 6.44, toimitus: 24.69, vero: 7.93 });
    expect(printifyKulut({ total_price: null })).toBeNull();
    expect(tilauksenMyynti({ total: 76.8, items: [{ type: "giftcard", unit_price: 50, quantity: 1 }] })).toEqual({ myynti: 26.8, myyntiAlv0: 21.35 });
    const t = await tarkistaEnnenTuotantoa(o, { total: 26.8, items: [] }, { haePainotalo: hae });
    expect(t.tulos).toBe("pysayta");
    expect(t.syyt).toHaveLength(2);
    const ok = await tarkistaEnnenTuotantoa({ ...o, total_price: 993, total_shipping: 849, total_tax: 0, line_items: [{ print_provider_id: 30, metadata: { country: "CZ" } }] }, { total: 30.8, items: [] }, { haePainotalo: hae });
    expect(ok.tulos).toBe("ok");
    expect((await tarkistaEnnenTuotantoa({ line_items: [{ print_provider_id: 30, metadata: {} }] }, { total: 30.8 }, { haePainotalo: hae })).tulos).toBe("tuntematon");
  });
  it("pysäytetty valvonnassa: tuotantoon vain omistajan lähettämänä", () => {
    expect(pysaytetynSeuranta("on-hold")).toBeNull();
    expect(pysaytetynSeuranta("canceled")).toBeNull();
    expect(pysaytetynSeuranta("in-production")).toBe("tuotannossa");
    expect(pysaytetynSeuranta("on-hold", true)).toBe("tuotannossa");
  });
});

describe("Printify Premium", () => {
  it("20 % vain tuotekulusta, suositus kun bruttoalennus yli 35 €", () => {
    expect(premiumSaasto(175)).toEqual({ tuotekulut: 175, alennus: 35, netto: 0.01, suositus: false });
    expect(premiumSaasto(175.05).suositus).toBe(true);
    expect(premiumSaasto(106.5)).toMatchObject({ alennus: 21.3, netto: -13.69, suositus: false });
    const r = premiumRivit(premiumSaasto(300), { tunnettu: 3, kaikki: 4 });
    expect(r[0]).toBe("Printify Premium (34,99 €/kk, -20 % tuotekulusta), edelliset 30 pv: tuotekulut 300,00 €, tuotekulu tiedossa 3/4 tilauksesta, alennus brutto 60,00 €, nettosäästö 25,01 €");
    expect(r[1]).toBe("Suositus: ota Printify Premium käyttöön (säästö 25,01 € / 30 pv)");
    expect(premiumRivit(premiumSaasto(100))).toHaveLength(1);
    expect(premiumTilauksista([{ printify_product_cost: "100.00" }, { printify_product_cost: 80 }, { printify_product_cost: null }])).toMatchObject({ tunnettu: 2, kaikki: 3, saasto: { alennus: 36, suositus: true } });
  });
});

describe("Päivän yhteenveto: toteutunut kate ja pysäytetyt", () => {
  const t = (id: string, extra: Rivi = {}) => ({
    id: `${id}0000000-0000`, status: "maksettu", total: 30.8, amount_paid: 30.8, printify_status: "tuotannossa",
    items: [{ slug: "paita", quantity: 1, unit_price: 24.9, variant_id: 1, kulu_sentit: 890, toimitus_sentit: 849 }], ...extra,
  });
  it("toteutunut kate: myynti alv 0 - Printify - Stripe", () => {
    expect(toteutunutKate(t("a"))).toBeNull();
    // 30,80 / 1,255 = 24,54; Stripe 0,71; Printify 18,42 -> 5,41
    expect(toteutunutKate(t("a", { printify_cost: "18.42", printify_cost_ex_tax: "14.68" }))).toEqual({ myyntiAlv0: 24.54, kulu: 18.42, kuluIlmanAlv: 14.68, kate: 5.41 });
  });
  it("eilisen toteutunut, kuukauden toteutunut, pysäytetyt ja Premium", () => {
    const nyt = new Date("2026-10-26T05:05:00Z");
    const pys = t("c", { printify_status: "pysaytetty", printify_error: "tilausvahti: Muki: painotalo SPOKE Custom Products EU:n ulkopuolella (US)", printify_cost: 39.06 });
    const s = yhteenveto({
      nyt, eilen: [t("a", { printify_cost: 18.42 }), t("b"), pys], kk: [t("a", { printify_cost: 18.42 }), t("b"), pys], jumissa: [], pysaytetyt: [pys],
      paivat30: [{ printify_product_cost: 200 }], tavoite: 3000,
    });
    const teksti = s.rivit.join("\n");
    expect(teksti).toMatch(/#A0000000 30,80 €, kate 6,44 € \| toteutunut: Printify 18,42 €, myynti alv 0 24,54 €, kate 5,41 €/);
    expect(teksti).toMatch(/#B0000000 30,80 €, kate 6,44 € \| Printify-kulu ei tiedossa/);
    expect(teksti).toMatch(/#C0000000 .* \| PYSÄYTETTY/);
    expect(teksti).toMatch(/Eilen toteutunut \(Printifyn todellinen kulu 2\/3 tilauksesta\): myynti alv 0 49,08 €, Printify 57,48 € \(sis. Printifyn alv\), kate -9,82 €; kaikki tilaukset \(muilta arvio\) -3,38 €/);
    expect(teksti).toMatch(/Pysäytetty ennen tuotantoa \(tilausvahti, odottaa päätöstäsi\): 1\n {2}#C0000000 30,80 €: tilausvahti: Muki/);
    expect(teksti).toMatch(/Kuukauden toteutunut \(Printifyn todellinen kulu 2\/3/);
    expect(teksti).toMatch(/Suositus: ota Printify Premium käyttöön \(säästö 5,01 € \/ 30 pv\)/);
    expect(s.rivit.at(-1)).toMatch(/^Tavoitteeseen puuttuu/);
    expect(teksti).not.toMatch(/[–—]/);
  });
  it("kulujen täydennys Printifystä: puuttuvat haetaan ja tallennetaan, enintään max", async () => {
    const haeTilaus = vi.fn(async () => ({ ok: true, data: { total_price: 644, total_shipping: 2469, total_tax: 793 } }));
    const tallenna = vi.fn(async () => {});
    const lista: Rivi[] = [t("a", { printify_order_id: "p1" }), t("b", { printify_order_id: "p2", printify_cost: 1, printify_product_cost: 1 }), t("c"), t("d", { printify_order_id: "p4" })];
    expect(await taydennaKulut(lista, { haeTilaus, tallenna, max: 1 })).toBe(1);
    expect(lista[0]).toMatchObject({ printify_cost: 39.06, printify_cost_ex_tax: 31.13, printify_product_cost: 6.44 });
    expect(lista[3].printify_cost).toBeUndefined();
    expect(tallenna).toHaveBeenCalledTimes(1);
  });
});

describe("Tilauskatteet-skripti: laskenta", () => {
  it("asiakkaasta vain etunimi ja sukunimen alkukirjain", () => {
    expect(asiakas({ first_name: "Liisa", last_name: "Korhonen", email: "x@y.fi", address1: "Katu 1" })).toBe("Liisa K.");
    expect(asiakas({ first_name: "PII_DELETED", last_name: "PII_DELETED" })).toBe("(poistettu)");
    expect(asiakas({ first_name: "anna" })).toBe("Anna");
  });
  it("kaupan hinta: tuote, EU-siirto molempiin suuntiin, nimi, Printify-varahinta", () => {
    const tuotteet = [
      { slug: "muki", name: "40 vuotta | Muki", price: 19.9, printify_product_id: "vanha" },
      { slug: "paita", name: "Tonnin Seteli | T-Paita", price: 24.9, printify_product_id: "eu-paita" },
    ];
    const siirrot = siirtoKartta([{ siirrot: [{ vanhaId: "vanha", uusiId: "eu-muki" }, { vanhaId: "us-paita", uusiId: "eu-paita" }] }]);
    const h = teeHinnasto(tuotteet, siirrot);
    expect(h({ product_id: "vanha" })).toMatchObject({ hinta: 19.9, lahde: "tuote" });
    expect(h({ product_id: "eu-muki" })).toMatchObject({ hinta: 19.9, lahde: "eu-siirto" });
    expect(h({ product_id: "us-paita" })).toMatchObject({ hinta: 24.9, lahde: "eu-siirto" });
    expect(h({ product_id: "poistettu", metadata: { title: "Tonnin Seteli｜T-Paita" } })).toMatchObject({ hinta: 24.9, lahde: "nimi" });
    expect(h({ product_id: "x", metadata: { title: "Muu", price: 1490 } })).toEqual({ hinta: 14.9, lahde: "printify", slug: null });
  });
  it("tilauksen kate: toimitusmaksu alle 79 €, alv, Stripe, Printifyn alv mukana ja ilman", () => {
    const l = laskeTilaus([{ hinta: 19.9, quantity: 1 }], { kulu: 39.06, kuluIlmanAlv: 31.13 });
    expect(l).toMatchObject({ tuotteet: 19.9, toimitus: 6.9, maksettu: 26.8, myyntiAlv0: 21.35, stripe: 0.65, kulu: 39.06, kate: -18.36, kateIlmanAlv: -10.43 });
    expect(l.kateProsentti).toBeCloseTo(-0.86, 2);
    expect(laskeTilaus([{ hinta: 49.9, quantity: 2 }], { kulu: 50, kuluIlmanAlv: 40 }).toimitus).toBe(0);
    expect(laskeTilaus([{ hinta: 19.9, quantity: 1 }], { kulu: 39.06, kuluIlmanAlv: 31.13 }, { kurssi: 0.87 }).kulu).toBe(33.98);
    const y = yhteensa([{ luvut: l }, { luvut: l }]);
    expect(y).toMatchObject({ tilauksia: 2, maksettu: 53.6, kulu: 78.12, kate: -36.72 });
  });
  it("osion korvaus säilyttää käsin kirjoitetun lohkon, ensimmäinen ajo ennen ensimmäistä ##-otsikkoa", () => {
    const alku = "# Katteet\n\nJohdanto\n\n## Muu\n\nx\n";
    const eka = korvaaOsio(alku, "Osio", "taulu 1");
    expect(eka).toBe("# Katteet\n\nJohdanto\n\n## Osio\n\ntaulu 1\n\n## Muu\n\nx\n");
    const kasin = eka.replace("taulu 1", `taulu 1\n\n${KASIN_ALKU}\nselitys\n${KASIN_LOPPU}`);
    const toka = korvaaOsio(kasin, "Osio", "taulu 2");
    expect(toka).toContain(`## Osio\n\ntaulu 2\n\n${KASIN_ALKU}\nselitys\n${KASIN_LOPPU}\n\n## Muu`);
    expect(toka).not.toContain("taulu 1");
  });
  it("Markdown: ei henkilötietoja, EI EU -merkintä, putkimerkki suojattu", () => {
    const l = laskeTilaus([{ hinta: 19.9, quantity: 1 }], { kulu: 39.06, kuluIlmanAlv: 31.13 });
    const md = markdown([{ pvm: "9.10.2026", tyyppi: "api", asiakas: "Liisa K.", luvut: l, rivit: [{ title: "Muki | X", variant: "11oz", quantity: 1, hinta: 19.9, lahde: "tuote", painotalo: { nimi: "SPOKE Custom Products", maa: "US", eu: false } }] }], { paiva: "2026-10-26", alkaen: "1.6.2026" });
    expect(md).toContain("| 9.10.2026 | Liisa K. | 1 x Muki \\| X (11oz), 19,90 € | SPOKE Custom Products US **EI EU** | 26,80 € | 21,35 € | 39,06 € | 31,13 € | -18,36 € | -86,0 % |");
    expect(md).not.toMatch(/[–—]/);
  });
});
