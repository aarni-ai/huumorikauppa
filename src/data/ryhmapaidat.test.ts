import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  RYHMA_SIVUT, RYHMA_POLUT, RYHMA_PORTAAT, RYHMA_HINTALAUSE, ABI_VIIMEINEN_TILAUSPAIVA, ABI_PERILLA_VIIMEISTAAN, PENKKARIT_2027,
  ABI_AIKATAULU, arkipaiviaTaaksepain, paivaTeksti,
} from "./ryhmapaidat";
import { TOIMITUSAJAT_TYYPEITTAIN } from "@/config/toimitus";
import { buildPrerenderPages } from "@/seo/prerender/pages";
import { kappalehinta } from "../../api/_lib/ryhmatilaus.js";

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, "../..", p), "utf8");
const ensimmainenLause = (t: string) => t.trim().split(/(?<=[.!?])\s+/)[0];

describe("ryhmäpaitojen sivut", () => {
  it("neljä sivua: abipaidat, polttarit, joukkueet ja yhdistykset", () => {
    expect(RYHMA_POLUT).toEqual(["/abipaidat", "/polttarit", "/joukkueet", "/yhdistykset"]);
  });

  for (const polku of RYHMA_POLUT) {
    const s = RYHMA_SIVUT[polku];
    const kaikki = [s.title, s.description, s.h1, ...s.intro, ...s.sections.flatMap((x) => [x.heading, ...x.paragraphs, ...(x.items ?? [])]), ...s.faqs.flatMap((f) => [f.q, f.a])].join("\n");

    it(`${polku}: tekstisäännöt (ei ajatusviivoja, epävarmuutta eikä todistamattomia väitteitä)`, () => {
      expect(kaikki).not.toMatch(/[–—]/);
      expect(kaikki).not.toMatch(/(?<!\p{L})(saattaa|ehkä|todennäköisesti|pyrimme|voi olla että|mahdollisesti)(?!\p{L})/iu);
      expect(kaikki).not.toMatch(/painettu suomessa|painetaan suomessa|suomen paras|halvin|paras hinta|nopein/i);
      expect(s.title.length).toBeLessThan(60);
      expect(s.description.length).toBeLessThan(155);
    });

    it(`${polku}: UKK alkaa suoralla vastauksella ja hinnat tulevat hinnastosta`, () => {
      expect(s.faqs.length).toBeGreaterThanOrEqual(6);
      for (const f of s.faqs) expect(ensimmainenLause(f.a).split(/\s+/).length, f.q).toBeLessThanOrEqual(25);
      const eurot = [...kaikki.matchAll(/(\d+,\d{2}) €/g)].map((m) => Number(m[1].replace(",", ".")));
      const sallitut = new Set([...RYHMA_PORTAAT.flatMap((p) => [p.hinta, p.isoHinta]), 2]);
      for (const x of eurot) expect(sallitut.has(x), String(x)).toBe(true);
      expect(kaikki).toContain(`${TOIMITUSAJAT_TYYPEITTAIN["t-paidat"][0]}-${TOIMITUSAJAT_TYYPEITTAIN["t-paidat"][1]} arkipäivässä`);
    });

    it(`${polku}: esirenderöinti, FAQPage-schema, reitti ja sivukartta`, () => {
      const page = buildPrerenderPages({ products: [] }).find((p) => p.path === polku)!;
      expect(page).toBeDefined();
      expect(page.title).toBe(s.title);
      expect(page.faqs).toEqual(s.faqs);
      const ld = JSON.stringify(page.jsonLd);
      expect(ld).toContain('"FAQPage"');
      for (const f of s.faqs) expect(ld).toContain(JSON.stringify(f.q).slice(1, -1));
      expect(read("src/App.tsx")).toContain(`path="${polku}"`);
      expect(read("api/sitemap.js")).toContain(`"${polku}"`);
    });
  }

  it("hintalause vastaa kassan hintoja", () => {
    expect(RYHMA_HINTALAUSE).toBe("T-paita maksaa 37,90 €, kun paitoja on 5-9. Määräalennuksella hinta on 10 paidasta 35,90 €, 25 paidasta 34,90 € ja 50 paidasta 33,90 €. Koot 3XL-5XL maksavat 2,00 € enemmän, ja toimitus vetäjän osoitteeseen sisältyy hintaan.");
    for (const p of RYHMA_PORTAAT) expect(kappalehinta(p.min, "M")).toBe(p.hinta);
  });

  it("abipaidat: viimeinen tilauspäivä lasketaan toimitusajasta ja penkkareista 2027", () => {
    expect(PENKKARIT_2027).toBe("2027-02-18");
    expect(ABI_PERILLA_VIIMEISTAAN).toBe("2027-02-04");
    expect(ABI_VIIMEINEN_TILAUSPAIVA).toBe(arkipaiviaTaaksepain(ABI_PERILLA_VIIMEISTAAN, TOIMITUSAJAT_TYYPEITTAIN["t-paidat"][1]));
    expect(ABI_VIIMEINEN_TILAUSPAIVA).toBe("2027-01-14");
    expect(paivaTeksti(ABI_VIIMEINEN_TILAUSPAIVA)).toBe("to 14.1.2027");
    expect(ABI_AIKATAULU).toContain("to 14.1.2027");
    expect(RYHMA_SIVUT["/abipaidat"].takaraja).toBe("2027-01-14");
    expect(RYHMA_SIVUT["/abipaidat"].faqs[0].a).toBe(ABI_AIKATAULU);
    expect(arkipaiviaTaaksepain("2026-11-09", 1)).toBe("2026-11-06");
  });

  it("tietosuojaseloste kertoo ryhmätilausten tiedot ja säilytysajan", () => {
    const t = read("src/pages/Privacy.tsx");
    expect(t).toContain("Ryhmätilaukset");
    expect(t).toContain("180 päivän");
    expect(t).toMatch(/Jäsenten sähköpostiosoitetta emme tallenna/);
  });
});
