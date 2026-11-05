import { describe, expect, it } from "vitest";
// @ts-ignore js-moduuli ilman tyyppejä
import { enLuku, fiLuku, csv, merchantRivit, ajoviikko } from "../../scripts/data-haku.mjs";
import { jasennaCsv, hakuKohteet, merchantKohteet } from "../../api/_lib/hallintasyote.js";

describe("datahaku koneelta", () => {
  it("luvut: Search Console ja TikTok englanniksi, Merchant suomeksi", () => {
    expect(enLuku("1,234")).toBe(1234);
    expect(enLuku("27.1%")).toBe(27.1);
    expect(enLuku("1.2K")).toBe(1200);
    expect(enLuku("")).toBeNull();
    expect(fiLuku("1,35 t.")).toBe(1350);
    expect(fiLuku("1 234")).toBe(1234);
    expect(fiLuku("1,0 %")).toBe(1);
    expect(fiLuku("<20")).toBeNull();
  });
  it("Merchantin raporttiteksti riveiksi, otsikkorivit ja sivutus erikseen", () => {
    const t = ["Otsikko", "help_outline", "Impressiot", "Ostajien prosenttiosuus", "help_outline",
      "Kalju | T-Paita", "230", "2", "0,9 %", "0", "0,0 %", "Muki 50%", "<20", "0", "0,0 %", "0", "0,0 %",
      "Näytettävät rivit:", "50", "1–50/1 095"].join("\n");
    const r = merchantRivit(t);
    expect(r.rivit).toEqual([["Kalju | T-Paita", "230", "2", "0,9 %", "0", "0,0 %"], ["Muki 50%", "<20", "0", "0,0 %", "0", "0,0 %"]]);
    expect(r.sivutus).toContain("1–50/1 095");
  });
  it("CSV kelpaa syötteen analyysiin (sama muoto kuin Cowork)", () => {
    const sc = csv(["Kysely", "Klikkaukset", "Näyttökerrat", "CTR", "Sijainti"], [["hauska, paita", 1, 300, 0.3, 8.2], ["x", 0, 10, 0, 50]]);
    expect(sc.split("\n")[1]).toBe('"hauska, paita",1,300,0.3,8.2');
    expect(hakuKohteet(jasennaCsv(sc)).kohteet.map((k: { kysely: string }) => k.kysely)).toEqual(["hauska, paita"]);
    const mc = csv(["Otsikko", "Klikkaukset", "Impressiot", "Klikkausprosentti", "Ostokset", "Tuotetunnuksia"],
      [["A", 30, 1000, 3, 0, 1], ["B", 0, 2000, 0, 0, 1], ["C", 10, 500, 2, 0, 1]]);
    expect(merchantKohteet(jasennaCsv(mc)).kohteet.map((t: { tuote: string }) => t.tuote)).toEqual(["B"]);
  });
  it("ajastus: maanantaina klo 8 jälkeen Suomen aikaa", () => {
    expect(ajoviikko(new Date("2026-11-09T06:30:00Z"))).toBe("2026-11-09");
    expect(ajoviikko(new Date("2026-11-09T05:30:00Z"))).toBeNull();
    expect(ajoviikko(new Date("2026-11-10T06:30:00Z"))).toBeNull();
  });
});
