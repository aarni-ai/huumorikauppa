/** Rajapäivien uudelleenjulkaisu (24.11.2026, scripts/katalogi.mjs): esirenderöity HTML vaihtuu samoina päivinä kuin sisältö. */
import { describe, expect, it } from "vitest";
// @ts-ignore js-moduuli ilman tyyppejä
import { RAJAPAIVAT, rajaJulkaisunAika } from "../../scripts/katalogi.mjs";
import { YRITYS_JOULU_TAKARAJA_ISO } from "../../api/_lib/yritysmyynti.js";
import { CHRISTMAS_ORDER_END_UTC_MS } from "@/data/campaignSchedule";
import { JOULUN_JALKEEN_NORMAALI_UTC_MS } from "@/data/tilauspaivat";

const hki = (ms: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date(ms));
const seuraava = (iso: string) => new Date(Date.parse(`${iso}T12:00:00Z`) + 864e5).toISOString().slice(0, 10);

describe("rajapäivät", () => {
  it("vastaavat sisällön vaihtohetkiä", () => {
    expect(RAJAPAIVAT).toEqual([seuraava(YRITYS_JOULU_TAKARAJA_ISO), hki(CHRISTMAS_ORDER_END_UTC_MS + 1), hki(JOULUN_JALKEEN_NORMAALI_UTC_MS)]);
  });
  it("kerran päivässä ja vain puhtaasta työpuusta", () => {
    expect(rajaJulkaisunAika({}, "2026-12-03")).toBe(true);
    expect(rajaJulkaisunAika({ raja: "2026-12-03" }, "2026-12-03")).toBe(false);
    expect(rajaJulkaisunAika({}, "2026-12-03", ["src/x.ts"])).toBe(false);
    expect(rajaJulkaisunAika({}, "2026-12-04")).toBe(false);
  });
});
