import { describe, expect, it } from "vitest";
import { kumppaniKoodi, kumppaniKoodinMuoto, provisio, provisioJaTila, PROVISIOSAANTO } from "../../api/_lib/kumppani.js";
import { KUMPPANUUS } from "../../api/_lib/vakiot.js";

describe("kumppanuusohjelma (hyväksytty 29.10.2026: kauppaan jää vähintään 7 € 29.10.2026 alkaen)", () => {
  it("käytössä, 10 %, vähintään 7,00 € katetta kaupalle", () => {
    expect(KUMPPANUUS).toMatchObject({ kaytossa: true, provisioProsentti: 10, minKateEuroa: 7 });
    expect(PROVISIOSAANTO).toContain("10 %");
    expect(PROVISIOSAANTO).toContain("7,00 €");
  });
  it("koodin muoto ja varalista", () => {
    expect(kumppaniKoodinMuoto("Anna-K")).toBe("anna-k");
    expect(kumppaniKoodinMuoto("<script>")).toBeNull();
    expect(kumppaniKoodi("anna-k", { asetukset: KUMPPANUUS, kumppanit: { "anna-k": "Anna" } })).toBe("anna-k");
    expect(kumppaniKoodi("tuntematon", { asetukset: KUMPPANUUS, kumppanit: {} })).toBeNull();
  });
  it("provisio enintään 10 % ja enintään summa, joka jättää kauppaan 7 €; muuten 0", () => {
    expect(provisioJaTila(27.9, 9.5)).toEqual({ provisio: 2.22, tila: "taysi" });
    expect(provisioJaTila(24.9, 7.22)).toEqual({ provisio: 0.22, tila: "rajattu" });
    expect(provisioJaTila(52.9, 10.18)).toEqual({ provisio: 3.18, tila: "rajattu" });
    expect(provisioJaTila(47.49, 4.94)).toEqual({ provisio: 0, tila: "ei" });
    expect(provisioJaTila(24.9, 7)).toEqual({ provisio: 0, tila: "ei" });
    expect(provisioJaTila(24.9, NaN)).toEqual({ provisio: 0, tila: "kate-tuntematon" });
    for (const [t, k] of [[24.9, 7.22], [52.9, 10.18], [71.15, 7.01], [547.8, 158.89]]) {
      const p = provisio(t, k);
      expect(k - p).toBeGreaterThanOrEqual(7);
      expect(p).toBeLessThanOrEqual((t / 1.255) * 0.1 + 0.005);
    }
  });
});

import { valitseKumppaniAlennus, ALENNUSMALLI_SAANTO, provisioAsetukset } from "../../api/_lib/kumppani.js";
import { laskeTilaus, laskettuNettokate, KassaVirhe } from "../../api/_lib/kassa.js";

describe("kumppanimalli 2: ostaja -5 %, kumppani 5 %, kauppaan vähintään 7 €", () => {
  const paita = (id: string, nimi: string, price: number) => ({
    id, slug: id, name: nimi, category: "t-paidat", price, is_active: true, printify_product_id: "pf" + id,
    variants: { sizes: ["M"], colors: ["Musta"], variant_map: { "Musta|M": 1 }, costs: { "1": 890 }, shipping_cents: 849 },
  });
  const tuotteet = [paita("a", "Kala oli tätäkin isompi | T-paita", 27.9), paita("b", "Saatanan Tunarit | T-Paita", 24.9)];
  const pyynto = (id: string, n = 1) => ({ items: [{ id, quantity: n, size: "M", color: "Musta" }], customerEmail: "a@b.fi", shippingAddress: { address: "K 1", zip: "00100", city: "Hki" } });
  const valitse = (p: ReturnType<typeof pyynto>) => valitseKumppaniAlennus({
    laske: (pr: number) => { try { return laskeTilaus(p, tuotteet, { type: "percent", value: pr }, {}); } catch (e) { if (e instanceof KassaVirhe) return null; throw e; } },
    nettokate: (l: never) => laskettuNettokate(l, tuotteet),
    perus: laskeTilaus(p, tuotteet, null, {}),
  });
  it("27,90 €:n paita: -5 % ja provisio 5 %, kate jää yli 7 €", () => {
    const v = valitse(pyynto("a"));
    expect(v.prosentti).toBe(5);
    expect(v.provisioProsentti).toBe(5);
    expect(v.laskettu.discount).toBeCloseTo(1.4, 1);
  });
  it("24,90 €:n paita: kate ei riitä, alennus ja provisio jäävät pois", () => {
    expect(valitse(pyynto("b")).prosentti).toBe(0);
  });
  it("kaksi paitaa: kahden tuotteen -5 % on yhtä suuri, joten kumppanialennusta ei lisätä", () => {
    expect(valitse(pyynto("a", 2)).prosentti).toBe(0);
  });
  it("sääntöteksti ja provision asetukset tapahtumasta", () => {
    expect(ALENNUSMALLI_SAANTO).toContain("5 %:n alennuksen");
    expect(ALENNUSMALLI_SAANTO).toContain("7,00 €");
    expect(provisioAsetukset({ malli: "alennus", provisio: 3 }).provisioProsentti).toBe(3);
    expect(provisioAsetukset({ koodi: "x" }).provisioProsentti).toBe(10);
  });
});
