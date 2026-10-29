import { describe, expect, it, beforeAll } from "vitest";
import { laskeTilaus, KassaVirhe } from "../../api/_lib/kassa.js";
import { tilausRunko } from "../../api/_lib/printify.js";
import { laskeKate } from "../../api/_lib/kate.js";
import { PERSONOITU_TUOTE, PERSONOITU_SLUG, jasennaPersonointi, tarkistaPersonointi, sallittuTeksti } from "../../api/_lib/personoitu.js";

beforeAll(() => { process.env.MARKKINOINTI_SALAISUUS = process.env.MARKKINOINTI_SALAISUUS || "testisalaisuus"; });
const osoite = { address: "Katu 1", zip: "00100", city: "Helsinki" };
const pyynto = (customText: string, size = "L", color = "Musta") => ({
  items: [{ slug: PERSONOITU_SLUG, quantity: 1, size, color, customText }], customerEmail: "a@b.fi", shippingAddress: osoite,
});

describe("personoitu t-paita", () => {
  it("nimi ja ikä tarkistetaan: merkkimäärä, merkit ja estetyt sanat", () => {
    expect(tarkistaPersonointi({ malli: "kokenut", nimi: "Marja-Liisa", ika: "50" }).ok).toBe(true);
    expect(tarkistaPersonointi({ malli: "kokenut", nimi: "Aleksanteri-Juhani", ika: "50" }).ok).toBe(false);
    expect(tarkistaPersonointi({ malli: "kokenut", nimi: "Marja", ika: "7" }).ok).toBe(false);
    expect(tarkistaPersonointi({ malli: "amatimies", nimi: "Pertti" }).ok).toBe(true);
    for (const n of ["Tapani", "Panu", "Kalle"]) expect(sallittuTeksti(n)).toBe(true);
    for (const n of ["Vittu", "P3rkele", "Homo"]) expect(sallittuTeksti(n)).toBe(false);
  });
  it("kassa hyväksyy kelvollisen personoinnin hinnalla 29,90 € ja hylkää puuttuvan tai estetyn", () => {
    const r = laskeTilaus(pyynto("Kokenut, ei vanha: Marja 50v"), [], null);
    expect(r.rivit[0]).toMatchObject({ slug: PERSONOITU_SLUG, unit_price: 29.9, custom_text: "Kokenut, ei vanha: Marja 50v", printify_product_id: "PERSONOITU" });
    expect(() => laskeTilaus(pyynto("Marja"), [], null)).toThrow(KassaVirhe);
    expect(() => laskeTilaus(pyynto("Kokenut, ei vanha: Vittu 50v"), [], null)).toThrow(KassaVirhe);
  });
  it("Printify-rivi: lennosta luotu tuote (145/30), allekirjoitettu painokuva", () => {
    const r = laskeTilaus(pyynto("Vuotta nuori: Pekka 60v", "XL", "Valkoinen"), [], null);
    const runko = tilausRunko({ id: "abcdef12-0000", customer_email: "a@b.fi", shipping_address: osoite, items: r.rivit });
    const rivi = runko.line_items[0];
    expect(rivi).toMatchObject({ blueprint_id: 145, print_provider_id: 30, quantity: 1, variant_id: PERSONOITU_TUOTE.variants.variant_map["Valkoinen|XL"] });
    expect(rivi.print_areas.front).toMatch(/\/api\/painokuva\?t=/);
    expect(jasennaPersonointi("Vuotta nuori: Pekka 60v")).toMatchObject({ ok: true, nimi: "Pekka", ika: 60 });
  });
  it("kate positiivinen jokaisessa koossa ja värissä", () => {
    for (const id of Object.values(PERSONOITU_TUOTE.variants.variant_map)) {
      const k = laskeKate(PERSONOITU_TUOTE, id);
      expect(k.tunnettu).toBe(true);
      expect(k.sallittu).toBe(true);
      expect(k.nettokate).toBeGreaterThan(0);
    }
  });
});
