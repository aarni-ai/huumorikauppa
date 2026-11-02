/**
 * Joulukausi toimii itsestään 24.12.2026 asti (3.11.2026): jokainen tunti 3.11.-25.12. käydään läpi. Kampanjavaihe,
 * yläbanneri ja etusivun nosto ovat aina olemassa jouluaattoon asti, eikä yhdessäkään näy mennyttä päivämäärää. Joulun
 * viimeisen tilauspäivän (ke 2.12.) jälkeen banneri vaihtuu lahjakorttiin.
 */
import { describe, expect, it } from "vitest";
import { kampanjaVaihe, kampanjaNosto } from "@/data/kampanjat";
import { activeBannerTheme, helsinkiTimeToUtcMs, JOULU_TILAUSPAIVA_ISO } from "@/data/campaignSchedule";
import { lahjakorttiAika } from "@/components/SeasonalBanner";
import { jouluPalkkiLause } from "@/data/tilauspaivat";

const hki = (ms: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date(ms));
/** Tekstin päivämäärät (d.m.) vuodelle 2026 ISO-muotoon. */
const paivat = (t: string) => [...t.matchAll(/\b(\d{1,2})\.(1[0-2]|[1-9])\.(?:2026)?(?!\d)/g)]
  .map((m) => `2026-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);

describe("Joulukausi 3.11.-24.12.2026", () => {
  it("joka tunti: vaihe, banneri tai lahjakortti, eikä menneitä päiviä", () => {
    const alku = helsinkiTimeToUtcMs(2026, 11, 3);
    const loppu = helsinkiTimeToUtcMs(2026, 12, 25);
    const lahjakorttiAlkaa = helsinkiTimeToUtcMs(2026, 12, 3);
    expect(JOULU_TILAUSPAIVA_ISO).toBe("2026-12-02");
    for (let t = alku; t < loppu; t += 3600_000) {
      const paiva = hki(t);
      expect(kampanjaVaihe(t), paiva).not.toBeNull();
      const teema = activeBannerTheme(t);
      if (t < lahjakorttiAlkaa) {
        expect(teema, paiva).not.toBeNull();
        expect(lahjakorttiAika(t), paiva).toBe(false);
        if (teema === "joulu") expect(jouluPalkkiLause(t), paiva).toContain("2.12.");
      } else {
        expect(teema, paiva).toBeNull();
        expect(lahjakorttiAika(t), paiva).toBe(true);
        expect(kampanjaVaihe(t), paiva).toBe("lahjakortti");
      }
      const nosto = kampanjaNosto(t);
      expect(nosto, paiva).not.toBeNull();
      // Isänpäivä (8.11.), itsenäisyyspäivä ja jouluaatto ovat juhlapäiviä, eivät takarajoja.
      for (const d of paivat(`${nosto!.otsikko} ${nosto!.teksti}`).filter((d) => !["2026-11-08", "2026-12-06", "2026-12-24"].includes(d))) {
        expect(d >= paiva, `${paiva}: vanhentunut päivä ${d} tekstissä "${nosto!.teksti}"`).toBe(true);
      }
    }
    expect(kampanjaVaihe(loppu)).toBeNull();
    expect(lahjakorttiAika(loppu)).toBe(false);
  });
});
