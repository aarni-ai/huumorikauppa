import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { sopiiLahjaksi } from "./sopiiLahjaksi";
import { LANDING_PATHS, LANDING_REDIRECTS, NOT_CREATED_LANDINGS } from "@/data/landingRoutes";

type T = { slug: string; category?: string; name?: string };
const lue = (polku: string): T[] => {
  const d = JSON.parse(readFileSync(polku, "utf8"));
  return Array.isArray(d) ? d : d.tuotteet ?? d.products;
};
// Tilannekuvat: testifixture, data-hakemiston tilannekuva ja tuotannon tuotteet 2.11.2026 (kate-tilannekuva).
const TUOTTEET = new Map<string, T>();
for (const p of ["src/test/fixtures/products-snapshot.json", "data/products-snapshot.json", "src/test/fixtures/kate-tilannekuva.json"]) {
  for (const t of lue(p)) TUOTTEET.set(t.slug, t);
}

/** vercel.json:n 301-ohjausten lähteet. */
const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as { redirects?: { source: string }[] };
const OHJATUT = new Set([...(vercel.redirects ?? []).map((r) => r.source), ...Object.keys(LANDING_REDIRECTS), ...Object.keys(NOT_CREATED_LANDINGS)]);

describe("sopiiLahjaksi", () => {
  it("jokainen tilannekuvan tuote saa rivin ja linkin olemassa olevalle lahjasivulle (ei 301)", () => {
    expect(TUOTTEET.size).toBeGreaterThan(1000);
    for (const t of TUOTTEET.values()) {
      const r = sopiiLahjaksi(t);
      expect(r.teksti, t.slug).toMatch(/^Sopii (joulu)?lahjaksi .+\.$/);
      expect(r.teksti.length, t.slug).toBeLessThanOrEqual(80);
      expect(`${r.teksti} ${r.linkkiTeksti}`, t.slug).not.toMatch(/[–—]/);
      expect(r.teksti, t.slug).not.toMatch(/undefined|null/);
      expect(LANDING_PATHS, `${t.slug} -> ${r.polku}`).toContain(r.polku);
      expect(OHJATUT.has(r.polku), r.polku).toBe(false);
      expect(r.kenelle.length).toBeLessThanOrEqual(2);
    }
  });

  it("aiheen mukaan oikea vastaanottaja ja sivu", () => {
    const tapaukset: [string, string, string][] = [
      ["isa-joka-grillaa-sateellakin-t-paita-isalle", "Sopii lahjaksi isälle.", "/joululahja-isalle"],
      ["isa-joka-on-aina-auton-alla-t-paita-isalle", "Sopii lahjaksi isälle ja autoilijalle.", "/joululahja-isalle"],
      ["kiuas-kuumana-paa-kylmana-t-paita-saunojalle", "Sopii lahjaksi saunojalle.", "/sauna"],
      ["mokkisauna-hoitaa-loput-t-paita-saunojalle", "Sopii lahjaksi saunojalle ja mökkeilijälle.", "/sauna"],
      ["kala-oli-tatakin-isompi-t-paita-kalastajalle", "Sopii lahjaksi kalastajalle.", "/lahjat/kalastajalle"],
      ["passissa-14-tuntia-hirvi-naki-minut-t-paita-metsastajalle", "Sopii lahjaksi metsästäjälle.", "/lahjat/metsastajalle"],
      ["elakkeella-kello-on-vain-koru-t-paita-elakelaiselle", "Sopii lahjaksi eläkeläiselle.", "/joululahja-elakelaiselle"],
      ["laiturilla-istuminen-on-harrastus-t-paita-mokkeilijalle", "Sopii lahjaksi mökkeilijälle.", "/lahjat/mokkeilijalle"],
      ["pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin", "Sopii lahjaksi pikkujouluihin.", "/lahjat/pikkujouluihin"],
      ["hauska-t-paita-poliisille-lain-kasi-myos-kahvitunnilla", "Sopii lahjaksi poliisille ja työkaverille.", "/ammattipaidat"],
      ["kahvi-sisaan-koodia-ulos-t-paita-it-ihmiselle", "Sopii lahjaksi IT-ihmiselle.", "/lahjat/it-ihmiselle"],
      ["laituri-kalja-ei-muuta-t-paita-oluen-ystavalle", "Sopii lahjaksi mökkeilijälle ja oluen ystävälle.", "/lahjat/mokkeilijalle"],
      ["maailman-paras-pappa-t-paita", "Sopii lahjaksi papalle.", "/joululahja-papalle"],
      ["anoppi-arvioi-mina-hymyilen-t-paita-jouluun", "Sopii joululahjaksi anopille.", "/joululahja-anopille"],
      ["kinkkuvahti-ala-koske-t-paita-jouluun", "Sopii joululahjaksi kaverille, työkaverille tai perheenjäsenelle.", "/joululahjat"],
      ["50v-puoli-vuosisataa-ei-naarmuakaan-t-paita", "Sopii lahjaksi 50-vuotiaalle.", "/50-vuotislahja"],
      ["100-turkulaista-verta-hauska-t-paita", "Sopii lahjaksi kotikaupungistaan ylpeälle.", "/lahja-kaverille"],
      ["100-elakelainen-t-paita", "Sopii lahjaksi eläkeläiselle.", "/joululahja-elakelaiselle"],
    ];
    for (const [slug, teksti, polku] of tapaukset) {
      const r = sopiiLahjaksi({ slug, category: "t-paidat" });
      expect(r.teksti, slug).toBe(teksti);
      expect(r.polku, slug).toBe(polku);
    }
  });

  it("tunnistamaton tuote: kaverille", () => {
    expect(sopiiLahjaksi({ slug: "tonnin-seteli-t-paita", category: "t-paidat" })).toMatchObject({
      teksti: "Sopii lahjaksi kaverille.", polku: "/lahja-kaverille", linkkiTeksti: "Lisää lahjoja kaverille",
    });
  });
});
