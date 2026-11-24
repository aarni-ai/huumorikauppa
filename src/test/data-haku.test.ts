import { describe, expect, it } from "vitest";
// @ts-ignore js-moduuli ilman tyyppejä
import { enLuku, fiLuku, csv, merchantRivit, ajoviikko, scYhteensa, tuoteKoriValilta, viikkovertailuCsv, tilannekuva } from "../../scripts/data-haku.mjs";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

describe("viikkovertailu (24.11.2026)", () => {
  it("Search Consolen yhteenvetokortit englanniksi ja suomeksi", () => {
    expect(scYhteensa("Total clicks\n1.2K\nTotal impressions\n45,300\nAverage CTR")).toEqual({ klikkaukset: 1200, nayttokerrat: 45300 });
    expect(scYhteensa("Klikkaukset yhteensä\n312\nNäyttökerrat yhteensä\n9,100")).toEqual({ klikkaukset: 312, nayttokerrat: 9100 });
    expect(scYhteensa("ei raporttia")).toEqual({ klikkaukset: null, nayttokerrat: null });
  });
  it("uusin tilannekuva annetulta päivältä tai ennen sitä", () => {
    const k = mkdtempSync(join(tmpdir(), "syote-"));
    writeFileSync(join(k, "2026-11-09-search-console-7-pv.csv"), "Jakso,Klikkaukset,Näyttökerrat\n7 pv,80,4000");
    writeFileSync(join(k, "2026-11-23-search-console-7-pv.csv"), "Jakso,Klikkaukset,Näyttökerrat\n7 pv,100,5000");
    writeFileSync(join(k, "2026-11-23-search-console-sivut-28-pv.csv"), 'Sivu,Klikkaukset\n"https://huumorikauppa.fi/a, b",3');
    expect(tilannekuva("search-console-7-pv", "2026-11-30", k)).toEqual({ pvm: "2026-11-23", rivit: [["7 pv", "100", "5000"]] });
    expect(tilannekuva("search-console-7-pv", "2026-11-17", k)?.pvm).toBe("2026-11-09");
    expect(tilannekuva("search-console-7-pv", "2026-11-01", k)).toBeNull();
    expect(tilannekuva("search-console-sivut-28-pv", "2026-11-23", k)?.rivit).toEqual([["https://huumorikauppa.fi/a, b", "3"]]);
  });
  it("tuotesivun kävijät ja koriin lisäykset: Blob-rivit jaksolta ja tietokannan kooste yhteen, A/B-rivit pois", () => {
    const blob = [
      { v: ["2026-11-20", "naytto"], n: 40 }, { v: ["2026-11-20", "kori"], n: 2 }, { v: ["2026-11-20", "koko-a|naytto"], n: 20 },
      { v: ["2026-11-10", "naytto"], n: 30 }, { v: ["2026-11-10", "kori"], n: 3 }, { v: ["2026-11-23", "naytto"], n: 5 },
    ];
    expect(tuoteKoriValilta(blob, "2026-11-16", "2026-11-22")).toEqual({ naytto: 40, kori: 2 });
    expect(tuoteKoriValilta(blob, "2026-11-16", "2026-11-22", { naytto: 10, kori: 1 })).toEqual({ naytto: 50, kori: 3 });
    expect(tuoteKoriValilta(null, "2026-11-09", "2026-11-15", { naytto: 7, kori: 0 })).toEqual({ naytto: 7, kori: 0 });
  });
  it("CSV: muutos ja osuus lasketaan, puuttuva luku jää tyhjäksi ja syy näkyy", () => {
    const c = viikkovertailuCsv({
      sc7: { pvm: "2026-11-30", klikkaukset: 120, nayttokerrat: 6000 }, sc7Ed: { pvm: "2026-11-23", klikkaukset: 100, nayttokerrat: 5000 },
      sc28: { pvm: "2026-11-30", klikkaukset: 400 }, sc28Ed: null,
      tuote: { naytto: 200, kori: 10 }, tuoteEd: { naytto: 119, kori: 3 }, jaksot: { tama: "2026-11-23..2026-11-29", edellinen: "2026-11-16..2026-11-22" },
    }).split("\n");
    expect(c[0]).toBe("Mittari,Tämä viikko,Edellinen viikko,Muutos,Muutos %,Huom");
    expect(c[1]).toBe('Search Console klikkaukset 7 pv,120,100,20,20,"tämä 2026-11-30, edellinen 2026-11-23"');
    expect(c[3]).toBe('Search Console klikkaukset 28 pv (sivut yhteensä),400,,,,"tämä 2026-11-30, edellinen puuttuu"');
    expect(c[6]).toBe("Koriin lisäysten osuus tuotesivun kävijöistä %,5,2.5,2.5,100,kori / naytto");
    expect(c).toHaveLength(7);
  });
});
