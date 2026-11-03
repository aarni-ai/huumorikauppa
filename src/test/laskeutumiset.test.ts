/**
 * Laskeutumisten seuranta ja laskeutumissivujen A/B-testit (3.11.2026): api/_lib/laskeutumiset.js,
 * src/lib/laskeutuminen.ts, src/lib/abTestit.ts ja koon esivalinnan vertailu (api/_lib/tuoteseuranta.js).
 */
import { describe, expect, it } from "vitest";
import { laite, selain, koostePolku, laskeutumisRivi, koostaLaskeutumiset, laskeutumisRivit } from "../../api/_lib/laskeutumiset.js";
import { kirjaaTuotetapahtumat, koostaTuoteAb, tuoteseurantaRivit, koostaTuoteseuranta } from "../../api/_lib/tuoteseuranta.js";
import { aikaKori, lcpKori } from "@/lib/laskeutuminen";
import { laskeutumisenAb } from "@/lib/abTestit";

const IG = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0";
const TT = "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 musical_ly_2023";
const SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

describe("laskeutumiset: lähde, laite ja selain User-Agentista", () => {
  it("somen sovellusselaimet tunnistetaan", () => {
    expect(selain(IG)).toBe("instagram-sovellus");
    expect(selain(TT)).toBe("tiktok-sovellus");
    expect(selain(SAFARI)).toBe("safari");
    expect(selain(MAC)).toBe("chrome");
    expect(laite(IG)).toBe("mobiili");
    expect(laite(TT)).toBe("mobiili");
    expect(laite(MAC)).toBe("kone");
    expect(laite("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tabletti");
  });

  it("polku koostetaan: tuote- ja blogisivut omina, muut osiona", () => {
    expect(koostePolku("/tuote/tonnin-seteli-t-paita?x=1")).toBe("/tuote/tonnin-seteli-t-paita");
    expect(koostePolku("/blogi/hauska-lahja-kaverille")).toBe("/blogi/hauska-lahja-kaverille");
    expect(koostePolku("/kategoria/hupparit")).toBe("/kategoria");
    expect(koostePolku("/")).toBe("/");
  });

  it("rivi: tuntematon aika hylätään, lähde Instagramin sovelluksesta ilman viittaajaa", () => {
    expect(laskeutumisRivi({ aika: "5-9" }, IG)).toBeNull();
    expect(laskeutumisRivi({ polku: "/tuote/x", viittaaja: "", aika: "0-3", jatkoi: false, lcp: "4+", ab: "koko-b" }, IG))
      .toEqual({ polku: "/tuote/x", lahde: "instagram", laite: "mobiili", selain: "instagram-sovellus", aika: "0-3", jatkoi: false, lcp: "4+", ab: "koko-b" });
    expect(laskeutumisRivi({ polku: "/", viittaaja: "www.google.com", aika: "60+", jatkoi: true, lcp: "x", ab: "muu" }, SAFARI))
      .toMatchObject({ lahde: "google", lcp: "?", ab: "" });
  });

  it("kooste: alle 10 s = ei jatkanut ja lähti alle 10 sekunnissa", () => {
    const k = koostaLaskeutumiset([
      { polku: "/tuote/x", lahde: "instagram", laite: "mobiili", selain: "instagram-sovellus", aika: "0-3", jatkoi: false, lcp: "4+", ab: "koko-a", n: 6 },
      { polku: "/tuote/x", lahde: "instagram", laite: "mobiili", selain: "instagram-sovellus", aika: "3-10", jatkoi: true, lcp: "0-2.5", ab: "koko-b", n: 2 },
      { polku: "/blogi/y", lahde: "google", laite: "kone", selain: "chrome", aika: "30-60", jatkoi: false, lcp: "0-2.5", ab: "blogi-b", n: 2 },
    ]);
    expect(k).toMatchObject({ n: 10, alle10: 60, alle3: 60, jatkoi: 20, lcpHidas: 60 });
    expect(k.ryhmat.lahde[0]).toMatchObject({ nimi: "instagram", n: 8, alle10: 75 });
    const rivit = laskeutumisRivit({ alku: "2026-11-03", loppu: "2026-11-03", ...k });
    expect(rivit[0]).toBe("Laskeutumiset 2026-11-03–2026-11-03: 10 käyntiä, poistui alle 10 s 60 % (alle 3 s 60 %), jatkoi toiselle sivulle 20 %, LCP yli 4 s 60 %.");
    expect(rivit.some((r) => r.startsWith("A/B:"))).toBe(true);
  });

  it("selaimen korit", () => {
    expect([aikaKori(2.9), aikaKori(3), aikaKori(9.9), aikaKori(10), aikaKori(61)]).toEqual(["0-3", "3-10", "3-10", "10-30", "60+"]);
    expect([lcpKori(0), lcpKori(2500), lcpKori(3000), lcpKori(4001)]).toEqual(["?", "0-2.5", "2.5-4", "4+"]);
  });

  it("laskeutumissivun testi polusta", () => {
    expect(laskeutumisenAb("/tuote/x")).toMatch(/^koko-[ab]$/);
    expect(laskeutumisenAb("/blogi/y")).toMatch(/^blogi-[ab]$/);
    expect(laskeutumisenAb("/lahjat/z")).toBe("");
  });
});

describe("koon esivalinnan A/B tuoteseurannassa", () => {
  it("kirjaus tallentaa myös versiokohtaiset avaimet", async () => {
    const lisatyt: string[] = [];
    const db = (async (osat: TemplateStringsArray, ...arvot: unknown[]) => {
      if (osat.join("").includes("insert into tuotesivu_seuranta")) lisatyt.push(String(arvot[1]));
      return [];
    }) as unknown as Parameters<typeof kirjaaTuotetapahtumat>[0];
    const n = await kirjaaTuotetapahtumat(db, { ab: "koko-b", tapahtumat: ["koko_esivalittu", "kori"], aika: "0-10" });
    expect(n).toBe(4);
    expect(lisatyt).toEqual(expect.arrayContaining(["naytto", "kori", "koko_esivalittu", "aika:0-10", "koko-b|naytto", "koko-b|kori", "koko-b|koko_esivalittu", "koko-b|aika:0-10"]));
    lisatyt.length = 0;
    await kirjaaTuotetapahtumat(db, { ab: "muu", tapahtumat: ["koko"] });
    expect(lisatyt).toEqual(["koko", "naytto"]);
  });

  it("vertailu versioittain: alle 10 s, koon valinta ja koko valmiina", () => {
    const rivit = [
      { tapahtuma: "koko-a|naytto", n: 10 }, { tapahtuma: "koko-a|aika:0-10", n: 6 }, { tapahtuma: "koko-a|koko", n: 1 },
      { tapahtuma: "koko-b|naytto", n: 10 }, { tapahtuma: "koko-b|aika:0-10", n: 5 }, { tapahtuma: "koko-b|koko", n: 1 },
      { tapahtuma: "koko-b|koko_esivalittu", n: 8 }, { tapahtuma: "koko-b|kori", n: 2 }, { tapahtuma: "naytto", n: 20 },
    ];
    const ab = koostaTuoteAb(rivit);
    expect(ab["koko-a"]).toEqual({ nayttoja: 10, alle10: 60, koko: 10, kokoValmiina: 10, kori: 0 });
    expect(ab["koko-b"]).toEqual({ nayttoja: 10, alle10: 50, koko: 10, kokoValmiina: 90, kori: 20 });
    const s = { alku: "2026-11-04", loppu: "2026-11-04", ...koostaTuoteseuranta(rivit), ab };
    expect(tuoteseurantaRivit(s).at(-1)).toMatch(/^Koon esivalinta A\/B: A \(valitse itse\) 10 katselua, alle 10 s 60 %/);
  });
});

describe("A/B-version pakotus", () => {
  it("asetaAbVersio kiinnittää ja vapauttaa version", async () => {
    const { abVersio, asetaAbVersio } = await import("@/lib/abTestit");
    asetaAbVersio("blogi", "b");
    expect(abVersio("blogi")).toBe("b");
    asetaAbVersio("blogi", "a");
    expect(abVersio("blogi")).toBe("a");
  });
});
