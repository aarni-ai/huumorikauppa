import { describe, expect, it } from "vitest";
import { ytunnus, aikataulu, laskeTarjous, laskuData, YRITYS_JOULU_TAKARAJA_ISO, arkipaivat, esimerkkiHinnat } from "../../api/_lib/yritysmyynti.js";

describe("yritysmyynti", () => {
  it("Y-tunnuksen tarkiste", () => {
    expect(ytunnus("3653666-7")).toBe("3653666-7");
    expect(ytunnus("FI36536667")).toBe("3653666-7");
    expect(ytunnus("3653666-8")).toBeNull();
    expect(ytunnus("abc")).toBeNull();
  });
  it("joulutakaraja 19 arkipäivää ennen 23.12. ja aikataulu", () => {
    expect(YRITYS_JOULU_TAKARAJA_ISO).toBe("2026-11-26");
    expect(arkipaivat("2026-10-30", 1)).toBe("2026-11-02");
    const a = aikataulu("2026-11-20", { tanaan: "2026-10-30" });
    expect(a).toMatchObject({ perilla: "2026-11-23", ehtii: false, jouluun: true });
    expect(aikataulu("2026-12-20", { tanaan: "2026-11-30" }).jouluun).toBe(false);
  });
  it("tarjouslaskuri: määräalennus t-paidoille, 3XL+ hinta, kate yli 5 €/paita", () => {
    const t = laskeTarjous({ malli: "tpaita", koot: { M: 5, L: 4, "3XL": 1 } });
    expect(t).toMatchObject({ kpl: 10, alennusProsentti: 10, toimitus: 0 });
    expect(t.ennen).toBeCloseTo(9 * 27.9 + 29.9, 2);
    expect(t.katePerKpl).toBeGreaterThan(5);
    expect(laskeTarjous({ malli: "huppari", koot: { M: 10 } }).alennusProsentti).toBe(0);
    expect(esimerkkiHinnat("meemipaita").map((e) => e.yhteensa)).toEqual([224.1, 547.8, 1070.7]);
  });
  it("Stripe-laskun data: rivit, toimitus, 14 pv, Y-tunnus ja ALV-tunniste", () => {
    const d = laskuData({ rivit: [{ name: "Paita", size: "M", color: "Musta", quantity: 10, unit_cents: 2241 }], toimitus: 0, tilausId: "o1",
      asiakas: { yritys: "Testi Oy", ytunnus: "3653666-7", email: "a@b.fi", osoite: "Katu 1", postinumero: "00100", kaupunki: "Helsinki", viite: "123" } });
    expect(d.lasku).toMatchObject({ collection_method: "send_invoice", days_until_due: 14, metadata: { order_id: "o1" } });
    expect(d.asiakas.tax_id_data[0]).toEqual({ type: "eu_vat", value: "FI36536667" });
    expect(d.summa).toBe(224.1);
    expect(d.lasku.custom_fields).toContainEqual({ name: "Viite", value: "123" });
  });
});
