import { describe, expect, it } from "vitest";
import { validoi, tunnistaMuoto, jasennaCsv, luku, hakuKohteet, sijaintiSeuranta, merchantKohteet, tallennaSyote } from "../../api/_lib/hallintasyote.js";

const SC = [
  "Suosituimmat kyselyt,Klikkaukset,Näyttökerrat,CTR,Sijainti",
  "hauska t-paita,3,120,2.5%,7.4",
  "isänpäivälahja,0,800,0%,18.2",
  "huumorikauppa,40,90,44%,1.2",
  "tonnin seteli paita,0,15,0%,41",
].join("\n");

describe("hallinnan syöte", () => {
  it("validointi: otsikko ja sisältö pakollisia, CSV tunnistetaan", () => {
    expect(validoi({ otsikko: " ", sisalto: "x" }).ok).toBe(false);
    expect(validoi({ otsikko: "a".repeat(101), sisalto: "x" }).ok).toBe(false);
    expect(validoi({ otsikko: "Instagram tilastot", sisalto: "" }).ok).toBe(false);
    expect(validoi({ otsikko: " Search  Console 28 pv ", sisalto: SC })).toMatchObject({ ok: true, otsikko: "Search Console 28 pv", muoto: "csv:,", rivit: 5 });
    expect(tunnistaMuoto("Vapaa teksti ilman taulukkoa.")).toBe("teksti");
    expect(tunnistaMuoto("Raportti 1.11.-28.11.\nTuote\tKlikit\tNäytöt\nA\t1\t100\nB\t2\t300")).toBe("csv:\t");
  });
  it("CSV: lainausmerkit, selitysrivi alussa, suomalaiset luvut", () => {
    const r = jasennaCsv('Merchant 28 pv\nTuote;Klikit;Näyttökerrat\n"Paita; iso";1;"1 200"\nMuki;0;50');
    expect(r).toEqual([{ Tuote: "Paita; iso", Klikit: "1", Näyttökerrat: "1 200" }, { Tuote: "Muki", Klikit: "0", Näyttökerrat: "50" }]);
    expect(luku("1 234")).toBe(1234);
    expect(luku("3,5 %")).toBe(3.5);
    expect(luku("")).toBeNull();
  });
  it("Search Console: sijainnit 5-30 näyttöjen mukaan, seuranta viikoittain", () => {
    const a = hakuKohteet(jasennaCsv(SC));
    expect(a.kohteet.map((k) => k.kysely)).toEqual(["isänpäivälahja", "hauska t-paita"]);
    const s = sijaintiSeuranta([
      { luotu: "2026-11-12T08:00:00Z", sisalto: SC.replace("18.2", "12.0") },
      { luotu: "2026-11-05T08:00:00Z", sisalto: SC },
    ]);
    expect(s["isänpäivälahja"].map((x) => x.sijainti)).toEqual([18.2, 12]);
  });
  it("Merchant: paljon näyttöjä, klikkausprosentti alle puolet keskiarvosta", () => {
    const rivit = jasennaCsv(["Tuotteen nimi,Klikkaukset,Näyttökerrat", "Hyvä paita,30,1000", "Heikko huppari,1,2000", "Pieni muki,0,50", "Ok tarra,10,500"].join("\n"));
    const m = merchantKohteet(rivit);
    expect(m.kohteet.map((t) => t.tuote)).toEqual(["Heikko huppari"]);
    expect(m.keskiarvo).toBeCloseTo(41 / 3550, 5);
  });
  it("tallennus kantaan", async () => {
    const kutsut: string[] = [];
    const db = Object.assign(async (s: TemplateStringsArray) => { kutsut.push(s.join("?")); return [{ id: "7", luotu: "2026-11-05T10:00:00Z" }]; }, {});
    const r = await tallennaSyote(db as never, { otsikko: "Merchant klikit", sisalto: "Tuote;Klikit\nA;1" });
    expect(r).toMatchObject({ ok: true, id: 7, muoto: "csv:;", rivit: 2 });
    expect(kutsut.some((k) => k.includes("insert into hallinta_syote"))).toBe(true);
    expect((await tallennaSyote(db as never, { otsikko: "", sisalto: "x" })).ok).toBe(false);
  });
});
