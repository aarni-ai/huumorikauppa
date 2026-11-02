/**
 * Kampanjakalenteri (src/data/kampanjat.ts) ja Black Friday -päätös 2.11.2026.
 *
 * Black Friday -laskelma tuotannon kuluilla (src/test/fixtures/kate-tilannekuva.json, 773 myynnissä olevaa tuotetta
 * 2.11.2026): pahin kahden tuotteen tilaus (kaksi tuotetta = ilmainen toimitus) jokaiselle tuoteparille kunkin tuotteen
 * pahimmalla koko- ja väriyhdistelmällä. Ehto: nettokate vähintään 7 € kaikissa tuotteissa.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { KAMPANJAVAIHEET, kampanjaVaihe, kampanjaNosto, seuraavaKampanjaVaihtoMs, BLACK_FRIDAY_PALKKI } from "@/data/kampanjat";
import { helsinkiTimeToUtcMs, JOULU_TILAUSPAIVA_ISO, JOULU_TPAIDAT_ISO } from "@/data/campaignSchedule";
import { KAMPANJAPAIVAT, TPAITAPARI_KAMPANJA, LISATUOTE_KATEGORIAT, TILAUKSEN_MIN_KATE_EUROA } from "../../api/_lib/vakiot.js";
import { pahinKahdenTuotteenNettokate } from "../../api/_lib/kate.js";
import { laskeTilaus } from "../../api/_lib/kassa.js";
import { onSuoraVertailu } from "../../api/_lib/kokohinnat.js";

/** Suomen seinäkelloaika "YYYY-MM-DDTHH:MM:SS(.mmm)" -> UTC ms. */
const fi = (s: string) => {
  const [p, t = "00:00:00"] = s.split("T");
  const [y, mo, d] = p.split("-").map(Number);
  const [hh, mm, ss] = t.split(":");
  const [sek, ms = "0"] = ss.split(".");
  return helsinkiTimeToUtcMs(y, mo, d, Number(hh), Number(mm), Number(sek), Number(ms.padEnd(3, "0")));
};

type Tuote = { id: string; slug: string; name: string; category: string; price: number; variants: { variant_map: Record<string, number>; size_prices?: Record<string, number> } };
const KULUT = (JSON.parse(readFileSync("src/test/fixtures/kate-tilannekuva.json", "utf8")) as { tuotteet: Tuote[] }).tuotteet;
const FYYSISET = KULUT.filter((t) => !LISATUOTE_KATEGORIAT.includes(t.category));

describe("Kampanjakalenteri: vaiheet", () => {
  it("vaiheet peräkkäin ilman aukkoja, päivät kalenterin lähteistä", () => {
    expect(KAMPANJAVAIHEET.map((v) => [v.id, v.alku, v.loppu])).toEqual([
      ["isanpaiva", "2026-10-01", "2026-11-08"],
      ["joulu", "2026-11-09", "2026-11-22"],
      ["black-friday", "2026-11-23", "2026-11-30"],
      ["joulu-takaraja", "2026-12-01", "2026-12-02"],
      ["lahjakortti", "2026-12-03", "2026-12-24"],
    ]);
    for (let i = 1; i < KAMPANJAVAIHEET.length; i++) {
      const edellinen = new Date(`${KAMPANJAVAIHEET[i - 1].loppu}T00:00:00Z`);
      edellinen.setUTCDate(edellinen.getUTCDate() + 1);
      expect(KAMPANJAVAIHEET[i].alku).toBe(edellinen.toISOString().slice(0, 10));
    }
    // Joulun tilauspäivät tuotetyyppien toimitusajoista (src/config/toimitus.ts, 15 arkipäivää): ke 2.12. kaikille.
    expect(JOULU_TILAUSPAIVA_ISO).toBe("2026-12-02");
    expect(JOULU_TPAIDAT_ISO).toBe("2026-12-02");
    // Black Friday samoilla päivillä selaimessa ja kassalla.
    expect([TPAITAPARI_KAMPANJA.alku, TPAITAPARI_KAMPANJA.loppu]).toEqual([KAMPANJAPAIVAT.blackFriday.alku, KAMPANJAPAIVAT.blackFriday.loppu]);
  });

  it("vaihtuu rajapäivinä keskiyöllä Suomen aikaa", () => {
    const tapaukset: [string, string | null][] = [
      ["2026-09-30T23:59:59.999", null],
      ["2026-10-01T00:00:00", "isanpaiva"],
      ["2026-11-02T12:00:00", "isanpaiva"],
      ["2026-11-08T23:59:59.999", "isanpaiva"],
      ["2026-11-09T00:00:00", "joulu"],
      ["2026-11-22T23:59:59.999", "joulu"],
      ["2026-11-23T00:00:00", "black-friday"],
      ["2026-11-30T23:59:59.999", "black-friday"],
      ["2026-12-01T00:00:00", "joulu-takaraja"],
      ["2026-12-02T23:59:59.999", "joulu-takaraja"],
      ["2026-12-03T00:00:00", "lahjakortti"],
      ["2026-12-24T23:59:59.999", "lahjakortti"],
      ["2026-12-25T00:00:00", null],
    ];
    for (const [hetki, vaihe] of tapaukset) expect(kampanjaVaihe(fi(hetki)), hetki).toBe(vaihe);
    expect(seuraavaKampanjaVaihtoMs(fi("2026-11-02T12:00:00"))).toBe(fi("2026-11-09T00:00:00"));
    expect(seuraavaKampanjaVaihtoMs(fi("2026-11-23T00:00:00"))).toBe(fi("2026-12-01T00:00:00"));
    expect(seuraavaKampanjaVaihtoMs(fi("2026-12-25T00:00:00"))).toBeNull();
  });

  it("etusivun nosto vaihtuu päivän mukaan, tekstit ilman ajatusviivoja", () => {
    const n = (s: string) => kampanjaNosto(fi(s));
    expect(n("2026-11-08T20:00:00")).toMatchObject({ vaihe: "isanpaiva", linkki: { polku: "/lahjakortti" }, lisalinkki: { polku: "/isanpaivalahja" } });
    expect(n("2026-11-09T00:00:00")).toMatchObject({ vaihe: "joulu", linkki: { polku: "/joululahjat" }, lisalinkki: { polku: "/paketit" } });
    expect(n("2026-11-09T00:00:00")!.teksti).toContain("2.12.2026");
    expect(n("2026-11-23T00:00:00")).toMatchObject({ vaihe: "black-friday", linkki: { polku: "/black-friday" } });
    const tanaan = n("2026-12-01T10:00:00")!;
    expect(tanaan.otsikko).toBe("Viimeiset tilauspäivät jouluksi");
    expect(tanaan.teksti).toBe("T-paidat, hupparit ja julisteet ehtivät jouluksi, kun tilaat viimeistään ke 2.12.");
    expect(n("2026-12-02T23:00:00")).toMatchObject({ vaihe: "joulu-takaraja", linkki: { polku: "/joululahjat" } });
    expect(n("2026-12-03T00:00:00")).toMatchObject({ vaihe: "lahjakortti", linkki: { polku: "/lahjakortti" }, vaatiiLahjakortin: true });
    expect(n("2026-12-25T00:00:00")).toBeNull();
    for (const s of ["2026-11-02T12:00:00", "2026-11-15T12:00:00", "2026-11-25T12:00:00", "2026-12-01T12:00:00", "2026-12-03T12:00:00", "2026-12-10T12:00:00"]) {
      const x = n(s)!;
      expect(`${x.otsikko} ${x.teksti} ${x.linkki.teksti} ${x.lisalinkki?.teksti ?? ""}`, s).not.toMatch(/[–—]/);
    }
    expect(BLACK_FRIDAY_PALKKI).toBe("Black Friday ma 30.11. asti: kaksi t-paitaa 44,90 €. T-paidan hinta 24,90 €, alin hinta 30 päivän aikana 24,90 €.");
  });
});

describe("Black Friday: kassa noudattaa samaa kalenteria", () => {
  const paita = KULUT.find((t) => t.category === "t-paidat" && t.price === 24.9 && onSuoraVertailu(t))!;
  const avain = Object.keys(paita.variants.variant_map).find((a) => /\|(S|M|L|XL|2XL)$/.test(a))!;
  const [color, size] = avain.split("|");
  const tilaus = (nyt: string) => laskeTilaus(
    { items: [{ id: paita.id, quantity: 2, size, color }], customerEmail: "a@b.fi", shippingAddress: { address: "K 1", zip: "00100", city: "Hki" } },
    KULUT, null, { korialennus: { nyt: new Date(fi(nyt)) } },
  );
  it("ennen 23.11. ei parihintaa, 23.-30.11. kaksi t-paitaa 44,90 €, 1.12. ei enää", () => {
    const ennen = tilaus("2026-11-22T23:59:59");
    expect(ennen.rivit.some((r: { tpaitapari?: boolean }) => r.tpaitapari)).toBe(false);
    for (const hetki of ["2026-11-23T00:00:01", "2026-11-30T23:59:00"]) {
      const bf = tilaus(hetki);
      expect(bf.rivit.every((r: { tpaitapari?: boolean }) => r.tpaitapari), hetki).toBe(true);
      expect(bf.basket_discount).toBe(4.9);
      // Parihinta ei yhdisty kahden tuotteen ilmaiseen toimitukseen.
      expect(bf.shipping).toBe(6.9);
      expect(bf.total).toBe(51.8);
    }
    expect(tilaus("2026-12-01T00:00:01").rivit.some((r: { tpaitapari?: boolean }) => r.tpaitapari)).toBe(false);
  });
});

describe("Black Friday -päätös: kate vähintään 7 € kaikissa tuotteissa", () => {
  const pahin = (tuotteet: Tuote[], prosentti: number, toimitus = 0) => pahinKahdenTuotteenNettokate(tuotteet, prosentti, toimitus)!.nettokate;

  it("-10 % kahdesta tuotteesta ei täytä ehtoa (pahin tilaus tappiollinen)", () => {
    expect(FYYSISET.length).toBeGreaterThan(700);
    const k = pahinKahdenTuotteenNettokate(FYYSISET, 10, 0)!;
    // Pahin pari: huppari (ice-aatanahuppari, L) + 24,90 €:n t-paita (saatanan-tunarit, L): -2,22 €.
    expect(k.nettokate).toBeLessThan(0);
    expect(k.nettokate).toBeCloseTo(-2.22, 1);
  });

  it("mikään yhtäläinen alennus ei täytä ehtoa kaikissa tuotteissa (jo 0 % jää alle 7 €)", () => {
    // Kate pienenee alennuksen kasvaessa, joten jos 0 % ei riitä, mikään alennus ei riitä. Ilman alennusta ja
    // ilmaisella toimituksella pahin kahden tuotteen tilaus (24,90 €:n t-paita + keraaminen koriste) jää 3,73 €:oon.
    expect(pahin(FYYSISET, 0)).toBeLessThan(TILAUKSEN_MIN_KATE_EUROA);
    expect(pahin(FYYSISET, 0)).toBeCloseTo(3.73, 1);
    expect(pahin(FYYSISET, 5)).toBeLessThan(pahin(FYYSISET, 0));
  });

  it("t-paitoihin rajattuna suurin ehdon täyttävä alennus on 9 % (10 %: 6,97 €)", () => {
    const tpaidat = FYYSISET.filter((t) => t.category === "t-paidat");
    expect(pahin(tpaidat, 10)).toBeLessThan(7);
    const suurin = [10, 9, 8, 7, 6, 5].find((p) => pahin(tpaidat, p) >= 7);
    expect(suurin).toBe(9);
  });

  it("valittu: kaksi 24,90 €:n t-paitaa 44,90 € (toimitus 6,90 €), pahin pari vähintään 7 €", () => {
    // Kampanjan t-paidat koot S-2XL kappalehinnalla 24,90 €; parin alennus jaetaan tasan (22,45 €/kpl).
    const kampanjaan = FYYSISET.filter((t) => t.category === TPAITAPARI_KAMPANJA.kategoria && t.price === TPAITAPARI_KAMPANJA.kappalehinta)
      .map((t) => {
        const vm = Object.fromEntries(Object.entries(t.variants.variant_map).filter(([a]) => !/\|(3|4|5|6)XL$/.test(a)));
        return { ...t, price: TPAITAPARI_KAMPANJA.parihinta / 2, variants: { ...t.variants, variant_map: vm, size_prices: undefined } };
      });
    expect(kampanjaan.length).toBeGreaterThanOrEqual(10);
    const k = pahinKahdenTuotteenNettokate(kampanjaan, 0, 6.9)!;
    expect(k.nettokate).toBeGreaterThanOrEqual(TILAUKSEN_MIN_KATE_EUROA);
    expect(k.nettokate).toBeCloseTo(12.43, 1);
  });
});
