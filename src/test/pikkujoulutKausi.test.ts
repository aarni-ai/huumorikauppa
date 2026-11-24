/**
 * /pikkujoulut-yritykset vaihtuu automaattisesti (24.11.2026): to 26.11. loppuun pikkujoulupaketit, pe 27.11. alkaen
 * tiimipaidat kevään tapahtumiin ja virkistyspäiviin samassa osoitteessa. Kiinnitetty kello.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { helsinkiTimeToUtcMs } from "@/data/campaignSchedule";
import { pikkujoulutKausi, yritysJouluAuki } from "@/data/pikkujoulutKausi";
import { pikkujoulutSivu } from "@/data/pikkujoulutYrityksetPage";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { buildPikkujoulutYrityksetPage } from "@/seo/prerender/pages";
import { YRITYS_JOULU_TAKARAJA_ISO } from "../../api/_lib/yritysmyynti.js";

const fi = (y: number, m: number, d: number, h = 0, mi = 0, s = 0, ms = 0) => new Date(helsinkiTimeToUtcMs(y, m, d, h, mi, s, ms));
const VIIMEINEN = fi(2026, 11, 26, 23, 59, 59, 999);
const SEURAAVA = fi(2026, 11, 27);

afterEach(() => vi.useRealTimers());

describe("yrityssivun kausi", () => {
  it("takaraja on to 26.11.2026, vaihto pe 27.11. klo 0.00 Suomen aikaa", () => {
    expect(YRITYS_JOULU_TAKARAJA_ISO).toBe("2026-11-26");
    expect(pikkujoulutKausi(fi(2026, 11, 24, 12))).toBe("joulu");
    expect(pikkujoulutKausi(VIIMEINEN)).toBe("joulu");
    expect(pikkujoulutKausi(SEURAAVA)).toBe("kevat");
    expect(yritysJouluAuki(fi(2027, 3, 1))).toBe(false);
  });

  it("metatiedot ja esirenderöinti seuraavat kelloa, osoite pysyy samana", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(VIIMEINEN);
    expect(STATIC_PAGE_META["/pikkujoulut-yritykset"].title).toBe("Pikkujoulupaidat yrityksille | Huumorikauppa");
    const joulu = buildPikkujoulutYrityksetPage(VIIMEINEN);
    expect(joulu.path).toBe("/pikkujoulut-yritykset");
    expect(joulu.h1).toContain("Pikkujoulupaidat");

    vi.setSystemTime(SEURAAVA);
    const meta = STATIC_PAGE_META["/pikkujoulut-yritykset"];
    expect(meta.title).toBe("Tiimipaidat kevään tapahtumiin | Huumorikauppa");
    expect(meta.title.length).toBeLessThan(60);
    expect(meta.description.length).toBeLessThan(155);
    expect(meta.h1).toBe("Tiimipaidat kevään tapahtumiin ja virkistyspäiviin");
    const kevat = buildPikkujoulutYrityksetPage(SEURAAVA);
    expect(kevat.path).toBe("/pikkujoulut-yritykset");
    expect(kevat.h1).toBe(meta.h1);
    expect(kevat.title).toBe(meta.title);
    const linkit = (kevat.sections || []).flatMap((s) => s.links || []).map((l) => l.href);
    expect(linkit).toEqual(expect.arrayContaining(["/yritykset/tilaus", "/yritykset"]));
  });

  it("kevään sisällössä ei joulun takarajaa, ajatusviivoja eikä epävarmuussanoja", () => {
    const s = pikkujoulutSivu(SEURAAVA);
    expect(s.kausi).toBe("kevat");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(SEURAAVA);
    const m = STATIC_PAGE_META["/pikkujoulut-yritykset"];
    const teksti = [m.title, m.description, m.h1, m.intro, ...s.intro, ...s.faqs.flatMap((f) => [f.q, f.a]), ...s.links.map((l) => l.label)].join(" ");
    expect(teksti).not.toMatch(/26\.11\.|viimeistään|ennen joulua|pikkujoulu/i);
    expect(teksti).not.toMatch(/[–—]/);
    expect(teksti).not.toMatch(/\b(ehkä|luultavasti|todennäköisesti|saattaa|mahdollisesti|arviolta)\b/i);
    expect(teksti).toMatch(/kevä/);
    expect(teksti).toMatch(/virkistyspäiv/);
  });

  it("joulun sisältö säilyy takarajaan asti", () => {
    const s = pikkujoulutSivu(VIIMEINEN);
    expect(s.kausi).toBe("joulu");
    expect(s.intro.join(" ")).toContain("to 26.11.");
  });
});
