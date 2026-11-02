import { describe, it, expect } from "vitest";
import {
  paasiainen, suomenPyhat, onArkipaiva, lisaaArkipaivia, toimitusarvio, ehtiiJouluksi, joulunViimeinenTilauspaiva,
  muotoilePaiva, tanaanSuomessa,
} from "@/lib/toimitusarvio";
import { JOULU_TILAUSPAIVA_ISO, JOULU_TPAIDAT_ISO } from "@/data/campaignSchedule";

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
  it("toimitusarvio: tuotetyypin toimitusaika arkipäivinä (src/config/toimitus.ts)", () => {
    // T-paidat 4-15, hupparit 5-15 arkipäivää; 31.10.2026 (pyhäinpäivä) on lauantai.
    expect(toimitusarvio("2026-10-21", "t-paidat")).toEqual({ aikaisin: "2026-10-27", viimeistaan: "2026-11-11" });
    expect(toimitusarvio("2026-10-21", "hupparit")).toEqual({ aikaisin: "2026-10-28", viimeistaan: "2026-11-11" });
  });
  it("tuntematon tuotetyyppi käyttää hitainta aikaa", () => {
    expect(toimitusarvio("2026-10-21", "tuntematon")).toEqual(toimitusarvio("2026-10-21", "hupparit"));
    expect(toimitusarvio("2026-10-21", null)).toEqual(toimitusarvio("2026-10-21", "hupparit"));
  });
  it("päivän muotoilu ja Suomen aika", () => {
    expect(muotoilePaiva("2026-11-13")).toBe("pe 13.11.");
    expect(tanaanSuomessa(new Date("2026-10-21T22:30:00Z"))).toBe("2026-10-22");
  });
});

describe("Joulu", () => {
  it("viimeiset tilauspäivät 2026 ovat samat kuin bannerin ja kampanjakalenterin", () => {
    expect(joulunViimeinenTilauspaiva(2026, "t-paidat")).toBe("2026-12-02");
    expect(joulunViimeinenTilauspaiva(2026, "hupparit")).toBe("2026-12-02");
    expect(joulunViimeinenTilauspaiva(2026, "t-paidat")).toBe(JOULU_TPAIDAT_ISO);
    expect(joulunViimeinenTilauspaiva(2026, "hupparit")).toBe(JOULU_TILAUSPAIVA_ISO);
  });
  it("Ehtii jouluksi vain, kun myöhäisin arvio on viimeistään 23.12.", () => {
    expect(ehtiiJouluksi("2026-10-21", "t-paidat")).toBe(true);
    expect(ehtiiJouluksi("2026-12-02", "t-paidat")).toBe(true);
    expect(ehtiiJouluksi("2026-12-02", "hupparit")).toBe(true);
    expect(ehtiiJouluksi("2026-12-03", "t-paidat")).toBe(false);
  });
  it("ei koskaan joulun jälkeen eikä ennen sesonkia", () => {
    expect(ehtiiJouluksi("2026-12-24", "t-paidat")).toBe(false);
    expect(ehtiiJouluksi("2026-12-28", "t-paidat")).toBe(false);
    expect(ehtiiJouluksi("2027-01-10", "t-paidat")).toBe(false);
    expect(ehtiiJouluksi("2026-06-01", "t-paidat")).toBe(false);
  });
});
