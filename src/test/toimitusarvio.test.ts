import { describe, it, expect } from "vitest";
import {
  paasiainen, suomenPyhat, onArkipaiva, lisaaArkipaivia, toimitusarvio, ehtiiJouluksi, joulunViimeinenTilauspaiva,
  joulunViimeisetTilauspaivat, muotoilePaiva, tanaanSuomessa, toimitusalue,
} from "@/lib/toimitusarvio";

describe("Suomen arkipyhät", () => {
  it("pääsiäinen ja siitä johdetut pyhät", () => {
    expect(paasiainen(2026)).toBe("2026-04-05");
    expect(paasiainen(2027)).toBe("2027-03-28");
    const p = suomenPyhat(2026);
    expect(p.has("2026-04-03")).toBe(true); // pitkäperjantai
    expect(p.has("2026-04-06")).toBe(true); // 2. pääsiäispäivä
    expect(p.has("2026-05-14")).toBe(true); // helatorstai
    expect(p.has("2026-06-19")).toBe(true); // juhannusaatto
  });
  it("joulu, uusivuosi ja loppiainen eivät ole arkipäiviä", () => {
    for (const d of ["2026-12-24", "2026-12-25", "2026-12-26", "2027-01-01", "2027-01-06", "2026-12-06"]) {
      expect(onArkipaiva(d)).toBe(false);
    }
    expect(onArkipaiva("2026-12-23")).toBe(true);
    expect(onArkipaiva("2026-12-28")).toBe(true);
    expect(onArkipaiva("2026-10-24")).toBe(false); // lauantai
  });
});

describe("Arkipäivälaskenta", () => {
  it("ohittaa viikonloput ja pyhät", () => {
    expect(lisaaArkipaivia("2026-10-23", 1)).toBe("2026-10-26"); // pe -> ma
    expect(lisaaArkipaivia("2026-12-23", 1)).toBe("2026-12-28"); // 24.-27.12. ei arkipäiviä
    expect(lisaaArkipaivia("2026-12-31", 1)).toBe("2027-01-04"); // 1.1. pe, viikonloppu
    expect(lisaaArkipaivia("2027-01-05", 1)).toBe("2027-01-07"); // loppiainen ke
    expect(lisaaArkipaivia("2026-12-21", 5)).toBe("2026-12-30"); // 22, 23, 28, 29, 30
  });
  it("toimitusarvio: tuotanto + kuljetus arkipäivinä", () => {
    // EU: 2-5 + 4-8 = 6-13 arkipäivää, US: 2-5 + 7-12 = 9-17 arkipäivää
    expect(toimitusarvio("2026-10-21", "eu")).toEqual({ aikaisin: "2026-10-29", viimeistaan: "2026-11-09" });
    expect(toimitusarvio("2026-10-21", "us")).toEqual({ aikaisin: "2026-11-03", viimeistaan: "2026-11-13" });
  });
  it("tuntematon painotalo käyttää hitainta profiilia", () => {
    expect(toimitusalue({ variants: {} })).toBe("us");
    expect(toimitusalue({ variants: { toimitusalue: "eu" } })).toBe("eu");
    expect(toimitusalue(null)).toBe("us");
  });
  it("päivän muotoilu ja Suomen aika", () => {
    expect(muotoilePaiva("2026-11-13")).toBe("pe 13.11.");
    expect(tanaanSuomessa(new Date("2026-10-21T22:30:00Z"))).toBe("2026-10-22");
  });
});

describe("Joulu", () => {
  it("viimeiset tilauspäivät 2026", () => {
    // Laskettu arvio olisi 30.11. (us) ja 6.12. (eu), mutta Printifyn takarajat (src/config/toimitusajat.ts) rajaavat.
    expect(joulunViimeinenTilauspaiva(2026, "us")).toBe("2026-11-20");
    expect(joulunViimeinenTilauspaiva(2026, "eu")).toBe("2026-11-27");
    expect(joulunViimeisetTilauspaivat(2026)).toEqual({ eu: "2026-11-27", us: "2026-11-20" });
  });
  it("Ehtii jouluksi vain, kun myöhäisin arvio on viimeistään 23.12.", () => {
    expect(ehtiiJouluksi("2026-10-21", "us")).toBe(true);
    expect(ehtiiJouluksi("2026-11-20", "us")).toBe(true);
    expect(ehtiiJouluksi("2026-11-21", "us")).toBe(false);
    expect(ehtiiJouluksi("2026-11-27", "eu")).toBe(true);
    expect(ehtiiJouluksi("2026-11-28", "eu")).toBe(false);
  });
  it("ei koskaan joulun jälkeen eikä ennen sesonkia", () => {
    expect(ehtiiJouluksi("2026-12-24", "eu")).toBe(false);
    expect(ehtiiJouluksi("2026-12-28", "eu")).toBe(false);
    expect(ehtiiJouluksi("2027-01-10", "eu")).toBe(false);
    expect(ehtiiJouluksi("2026-06-01", "eu")).toBe(false);
  });
});
