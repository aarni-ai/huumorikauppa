import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { laskeTilaus, KassaVirhe } from "../../api/_lib/kassa.js";
import { laskePaketinKate, paketinHeikoinKate } from "../../api/_lib/kate.js";
import { muodostaPaketit, sovellaPaketit, teemaRunko, nimiRunko } from "../../api/_lib/paketit.js";
import PAKETIT from "../../api/_lib/paketit-data.js";
import {
  luoKoodi, normalisoiKoodi, onKelvollinenKoodi, tarkistaLahjakortti, kaytettavaSumma, vahennaSaldo, voimassaAsti,
  lahjakorttiTuote, onLahjakortti,
} from "../../api/_lib/lahjakortti.js";
import { printifyRivit, puuttuvatVariantit } from "../../api/_lib/tilaus.js";
import { tilausRunko } from "../../api/_lib/printify.js";

const paita = {
  id: "t1", slug: "oispa-kaljaa-t-paita", name: "Oispa kaljaa | T-Paita", category: "t-paidat", price: 24.9, is_active: true,
  printify_product_id: "pf-t", created_at: "2026-01-01",
  variants: { variant_map: { "Musta|M": 1, "Musta|L": 2 }, costs: { "1": 700, "2": 700 }, shipping_cents: 400 },
};
const huppari = {
  id: "h1", slug: "oispa-kaljaa-huppari", name: "Oispa kaljaa | Huppari", category: "hupparit", price: 49.9, is_active: true,
  printify_product_id: "pf-h", created_at: "2026-01-02",
  variants: { variant_map: { "Musta|M": 11 }, costs: { "11": 1500 }, shipping_cents: 400 },
};
const kallisHuppari = { ...huppari, id: "h2", slug: "kallis-huppari", variants: { variant_map: { "Musta|M": 12 }, costs: { "12": 2000 }, shipping_cents: 600 } };
const kallisPaita = { ...paita, id: "t2", slug: "kallis-t-paita" };
const tuntematon = { ...huppari, id: "h3", slug: "tuntematon-huppari", variants: { variant_map: { "Musta|M": 13 } } };
const tuotteet = [paita, huppari, kallisHuppari, kallisPaita, tuntematon];
const paketit = [
  { slug: "oispa-kaljaa-t-paita-ja-huppari", tuotteet: ["oispa-kaljaa-t-paita", "oispa-kaljaa-huppari"], alennus_prosentti: 10 },
  { slug: "kallis", tuotteet: ["kallis-t-paita", "kallis-huppari"], alennus_prosentti: 10 },
];
const osoite = { address: "Katu 1", zip: "00100", city: "Helsinki" };
const pyynto = (items: unknown[], extra: Record<string, unknown> = {}) => ({ items, customerEmail: "a@b.fi", shippingAddress: osoite, ...extra });
const t = (slug: string, quantity = 1, size = "M") => ({ slug, quantity, size, color: "Musta" });

describe("Paketit: muodostus", () => {
  it("teeman runko ja nimi", () => {
    expect(teemaRunko("oispa-kaljaa-t-paita")).toBe("oispa-kaljaa");
    expect(teemaRunko("oispa-kaljaa-huppari")).toBe("oispa-kaljaa");
    expect(teemaRunko("harjavalta-parempi-kuin-helsinki-hauska-t-paita")).toBe("harjavalta-parempi-kuin-helsinki");
    expect(nimiRunko("30 – nuori, villi | T-Paita")).toBe("30, nuori, villi");
  });
  it("t-paita + huppari samalla teemalla, ei personoitavia eikä piilotettuja", () => {
    const oma = { ...paita, id: "o1", slug: "oma-tekstikuva-t-paita", name: "Oma teksti/kuva | T-Paita" };
    const omaH = { ...huppari, id: "o2", slug: "oma-tekstikuva-huppari", name: "Oma teksti/kuva | Huppari" };
    const muki = { ...paita, id: "m1", slug: "oispa-kaljaa-muki", category: "mukit" };
    const p = muodostaPaketit([paita, huppari, oma, omaH, muki], 20);
    expect(p).toEqual([{
      slug: "oispa-kaljaa-t-paita-ja-huppari", nimi: "Oispa kaljaa: T-paita ja huppari", teema: "oispa-kaljaa",
      tuotteet: ["oispa-kaljaa-t-paita", "oispa-kaljaa-huppari"], alennus_prosentti: 10,
    }]);
  });
  it("generoitu tiedosto vastaa tilannekuvaa (aja node scripts/generoi-paketit.mjs)", () => {
    const d = JSON.parse(readFileSync("data/products-snapshot.json", "utf8"));
    expect(PAKETIT).toHaveLength(20);
    expect(muodostaPaketit(d, 20)).toEqual(PAKETIT);
    const slugit = new Set(d.map((p: { slug: string }) => p.slug));
    for (const pk of PAKETIT) {
      expect(pk.tuotteet.every((s: string) => slugit.has(s))).toBe(true);
      expect(pk.nimi).not.toMatch(/[–—]/);
    }
  });
});

describe("Paketit: kate ja alennus", () => {
  it("paketin kate alennuksen jälkeen", () => {
    // 74,80 * 0,9 + 6,90 = 74,22; alv 0 59,14; kulut 7 + 4 + 15 + 4 = 30; Stripe 1,36 -> 27,78 (47 %)
    const k = laskePaketinKate([{ tuote: paita, varianttiId: 1 }, { tuote: huppari, varianttiId: 11 }], 10);
    expect(k.tunnettu).toBe(true);
    expect(k.nettokate).toBe(27.78);
    expect(k.sallittu).toBe(true);
    expect(laskePaketinKate([{ tuote: kallisPaita, varianttiId: 1 }, { tuote: kallisHuppari, varianttiId: 12 }], 10).sallittu).toBe(false);
    expect(laskePaketinKate([{ tuote: paita, varianttiId: 1 }, { tuote: tuntematon, varianttiId: 13 }], 10).tunnettu).toBe(false);
    expect(paketinHeikoinKate([paita, huppari], 10).sallittu).toBe(true);
    expect(paketinHeikoinKate([paita, tuntematon], 10).tunnettu).toBe(false);
  });
  it("alennus vain, kun molemmat tuotteet ovat korissa", () => {
    const yksi = laskeTilaus(pyynto([t("oispa-kaljaa-t-paita")]), tuotteet, null, { paketit });
    expect(yksi.bundle_discount).toBe(0);
    const molemmat = laskeTilaus(pyynto([t("oispa-kaljaa-t-paita"), t("oispa-kaljaa-huppari")]), tuotteet, null, { paketit });
    expect(molemmat.bundle_discount).toBe(7.48);
    expect(molemmat.rivit.map((r: { unit_cents: number }) => r.unit_cents)).toEqual([2241, 4491]);
    expect(molemmat.rivit.every((r: { paketti?: string }) => r.paketti === "oispa-kaljaa-t-paita-ja-huppari")).toBe(true);
    expect(molemmat.shipping).toBe(6.9); // raja lasketaan ennen alennusta, 74,80 < 79
    expect(molemmat.total).toBe(74.22);
  });
  it("vain parit saavat alennuksen, ylimääräinen kappale täyteen hintaan", () => {
    const r = laskeTilaus(pyynto([t("oispa-kaljaa-t-paita", 2), t("oispa-kaljaa-huppari")]), tuotteet, null, { paketit });
    const rivit = r.rivit.map((x: { slug: string; quantity: number; unit_cents: number }) => [x.slug, x.quantity, x.unit_cents]);
    expect(rivit).toEqual([["oispa-kaljaa-t-paita", 1, 2241], ["oispa-kaljaa-t-paita", 1, 2490], ["oispa-kaljaa-huppari", 1, 4491]]);
    expect(r.shipping).toBe(0);
    expect(r.total).toBe(92.22);
  });
  it("katevahti: alle 40 % tai tuntematon kulu, ei alennusta", () => {
    const r = laskeTilaus(pyynto([t("kallis-t-paita"), t("kallis-huppari")]), tuotteet, null, { paketit });
    expect(r.bundle_discount).toBe(0);
    expect(r.total).toBe(74.8 + 6.9);
    const m = new Map([[paita.slug, paita], [tuntematon.slug, tuntematon]]);
    const s = sovellaPaketit(
      [{ slug: paita.slug, quantity: 1, unit_cents: 2490, variant_id: 1 }, { slug: tuntematon.slug, quantity: 1, unit_cents: 4990, variant_id: 13 }],
      m, [{ slug: "x", tuotteet: [paita.slug, tuntematon.slug], alennus_prosentti: 10 }],
    );
    expect(s.alennus).toBe(0);
  });
  it("ei yhdistetä alennuskoodiin", () => {
    const r = laskeTilaus(pyynto([t("oispa-kaljaa-t-paita"), t("oispa-kaljaa-huppari")]), tuotteet, { type: "percent", value: 5 }, { paketit });
    expect(r.bundle_discount).toBe(0);
    expect(r.discount).toBe(3.73); // rivikohtainen pyöristys sentteinä
  });
});

describe("Lahjakortti: koodi", () => {
  it("muoto HK-XXXX-XXXX-XXXX ilman sekoittuvia merkkejä", () => {
    const k = luoKoodi();
    expect(onKelvollinenKoodi(k)).toBe(true);
    expect(k).not.toMatch(/[01IO]/);
    const kiintea = luoKoodi((n: number) => Uint8Array.from({ length: n }, (_, i) => i));
    expect(kiintea).toBe("HK-ABCD-EFGH-JKLM");
    expect(luoKoodi((n: number) => new Uint8Array(n).fill(255))).toBe("HK-9999-9999-9999");
  });
  it("koodit ovat uniikkeja", () => {
    const s = new Set(Array.from({ length: 2000 }, () => luoKoodi()));
    expect(s.size).toBe(2000);
  });
  it("asiakkaan syöte normalisoidaan", () => {
    expect(normalisoiKoodi(" hk-abcd efgh-jkmn ")).toBe("HK-ABCD-EFGH-JKMN");
    expect(normalisoiKoodi("ABCDEFGHJKMN")).toBe("HK-ABCD-EFGH-JKMN");
    expect(normalisoiKoodi("HK-ABCD-EFGH")).toBeNull();
    expect(normalisoiKoodi("HK-ABCD-EFGH-JK0N")).toBeNull();
    expect(normalisoiKoodi(undefined)).toBeNull();
  });
  it("voimassa 24 kuukautta", () => {
    expect(voimassaAsti(new Date("2026-10-21T10:00:00Z")).toISOString()).toBe("2028-10-21T10:00:00.000Z");
    expect(voimassaAsti(new Date("2024-02-29T12:00:00Z")).toISOString()).toBe("2026-02-28T12:00:00.000Z");
  });
});

describe("Lahjakortti: saldo", () => {
  const nyt = new Date("2026-10-21T10:00:00Z");
  it("tarkistus", () => {
    expect(tarkistaLahjakortti(null, nyt).ok).toBe(false);
    expect(tarkistaLahjakortti({ balance: "25.00", expires_at: "2028-10-21T00:00:00Z" }, nyt)).toEqual({ ok: true, saldo: 25, virhe: null });
    expect(tarkistaLahjakortti({ balance: "0.00", expires_at: "2028-10-21T00:00:00Z" }, nyt).virhe).toMatch(/käytetty/);
    expect(tarkistaLahjakortti({ balance: "25.00", expires_at: "2026-10-20T00:00:00Z" }, nyt).virhe).toMatch(/vanhentunut/);
  });
  it("käytettävä summa ja saldon vähennys sentin tarkkuudella", () => {
    expect(kaytettavaSumma(50, 31.8)).toBe(31.8);
    expect(kaytettavaSumma(30, 31.8)).toBe(30);
    expect(kaytettavaSumma(0.1 + 0.2, 1)).toBe(0.3);
    expect(vahennaSaldo(50, 31.8)).toBe(18.2);
    expect(vahennaSaldo(100, 99.99)).toBe(0.01);
    expect(vahennaSaldo(25, 25)).toBe(0);
    expect(() => vahennaSaldo(25, 25.01)).toThrow();
    expect(() => vahennaSaldo(25, -1)).toThrow();
  });
});

describe("Lahjakortti: kassa", () => {
  const kortti = (arvo = 50, giftCard?: object) => ({ id: `lahjakortti-${arvo}`, type: "giftcard", quantity: 1, giftCard });
  it("tuotteet 25/50/75/100 €", () => {
    expect(lahjakorttiTuote(50)).toMatchObject({ id: "lahjakortti-50", price: 50, name: "Lahjakortti 50 €" });
    expect(lahjakorttiTuote(30)).toBeNull();
    expect(onLahjakortti({ product: lahjakorttiTuote(25) })).toBe(true);
    expect(onLahjakortti({ product: paita })).toBe(false);
  });
  it("pelkkä lahjakortti: ei osoitetta, ei toimitusmaksua, ei Printifyä", () => {
    const r = laskeTilaus({ items: [kortti(50, { recipientEmail: "saaja@x.fi", recipientName: "Saaja", message: "Onnea!" })], customerEmail: "a@b.fi" }, tuotteet, null);
    expect(r).toMatchObject({ shipping: 0, total: 50, only_gift_cards: true, amount_due: 50 });
    expect(r.rivit[0]).toMatchObject({ type: "giftcard", printify_product_id: null, recipient_email: "saaja@x.fi", message: "Onnea!" });
    expect(printifyRivit(r.rivit)).toEqual([]);
    expect(puuttuvatVariantit(r.rivit)).toEqual([]);
  });
  it("lahjakortti ei kerrytä ilmaisen toimituksen rajaa eikä saa alennuskoodia", () => {
    const r = laskeTilaus(pyynto([kortti(100), t("oispa-kaljaa-t-paita")]), tuotteet, { type: "percent", value: 10 });
    expect(r.shipping).toBe(6.9);
    expect(r.discount).toBe(2.49);
    expect(r.total).toBe(100 + 22.41 + 6.9);
    const runko = tilausRunko({ id: "abcdef12-0000", customer_email: "a@b.fi", shipping_address: osoite, items: r.rivit });
    expect(runko.line_items).toEqual([{ product_id: "pf-t", variant_id: 1, quantity: 1 }]);
  });
  it("virheellinen saajan osoite hylätään", () => {
    expect(() => laskeTilaus({ items: [kortti(25, { recipientEmail: "ei-osoite" })], customerEmail: "a@b.fi" }, tuotteet, null)).toThrow(KassaVirhe);
  });
  it("lahjakortilla maksu: osittain ja kokonaan", () => {
    const osittain = laskeTilaus(pyynto([t("oispa-kaljaa-t-paita")]), tuotteet, null, { lahjakortti: { koodi: "HK-AAAA-BBBB-CCCC", saldo: 30 } });
    expect(osittain).toMatchObject({ total: 31.8, gift_card_amount: 30, amount_due: 1.8, gift_card_code: "HK-AAAA-BBBB-CCCC" });
    const kokonaan = laskeTilaus(pyynto([t("oispa-kaljaa-t-paita")]), tuotteet, null, { lahjakortti: { koodi: "HK-AAAA-BBBB-CCCC", saldo: 100 } });
    expect(kokonaan).toMatchObject({ gift_card_amount: 31.8, amount_due: 0 });
  });
  it("lahjakortilla ei voi ostaa lahjakortteja", () => {
    expect(() => laskeTilaus(pyynto([kortti(50)]), tuotteet, null, { lahjakortti: { koodi: "HK-AAAA-BBBB-CCCC", saldo: 100 } })).toThrow(/ei voi ostaa lahjakortteja/);
  });
});
