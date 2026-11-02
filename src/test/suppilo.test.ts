import { describe, expect, it } from "vitest";
import { koostaSuppilo } from "../../api/_lib/suppilo.js";
import { valitseSuosituimmat } from "@/components/EtusivunSuosituimmat";
import type { Product } from "@/types/product";

describe("oma ostosuppilo", () => {
  it("päivät, pudotusprosentit, konversio ja A/B", () => {
    const rivit = [
      { paiva: "2026-11-02", vaihe: "tuotesivu", versio: "", n: 40 }, { paiva: "2026-11-02", vaihe: "kori", versio: "a", n: 6 },
      { paiva: "2026-11-02", vaihe: "kori", versio: "b", n: 4 }, { paiva: "2026-11-02", vaihe: "kassa", versio: "", n: 5 },
      { paiva: "2026-11-02", vaihe: "maksu", versio: "", n: 3 }, { paiva: "2026-11-02", vaihe: "etusivu", versio: "a", n: 30 },
      { paiva: "2026-11-02", vaihe: "etusivu", versio: "b", n: 28 },
    ];
    const s = koostaSuppilo(rivit, [{ paiva: "2026-11-02", versio: "a", n: 2 }], { "2026-11-02": 100, "2026-11-01": 50 });
    expect(s.paivat[0]).toMatchObject({ paiva: "2026-11-02", kaynnit: 100, tuotesivu: 40, kori: 10, kassa: 5, maksu: 3, ostot: 2, konversio: 2 });
    expect(s.paivat[1]).toMatchObject({ paiva: "2026-11-01", kaynnit: 50, ostot: 0, konversio: 0 });
    expect(s.pudotus[0]).toEqual({ vaihe: "kaynnit -> tuotesivu", jatkoi: 26.7, putosi: 73.3 });
    expect(s.pudotus[1]).toEqual({ vaihe: "tuotesivu -> kori", jatkoi: 25, putosi: 75 });
    expect(s.ab.a).toMatchObject({ etusivu: 30, kori: 6, ostot: 2, konversio: 6.7 });
    expect(s.ab.b).toMatchObject({ etusivu: 28, kori: 4, ostot: 0, konversio: 0 });
  });

  it("selaintestin kirjaukset erikseen, eivät summiin", () => {
    const s = koostaSuppilo([{ paiva: "2026-11-02", vaihe: "kori", versio: "testi", n: 2 }, { paiva: "2026-11-02", vaihe: "kori", versio: "", n: 1 }], [], {});
    expect(s.yhteensa.kori).toBe(1);
    expect(s.testi.kori).toBe(2);
  });

  it("jakso alkaa aikaisintaan luotettavasta päivästä, myös ostot ja käynnit", async () => {
    const { suppiloValilla, SUPPILO_LUOTETTAVA_ALKAEN } = await import("../../api/_lib/suppilo.js");
    const kyselyt: unknown[][] = [];
    const db = (osat: TemplateStringsArray, ...arvot: unknown[]) => { kyselyt.push(arvot); return Promise.resolve(/orders/.test(osat.join("")) ? [{ paiva: "2026-10-29", versio: "", n: 1 }].filter(() => false) : []); };
    const s = await suppiloValilla(db, "2026-10-20", "2026-11-02", { "2026-10-29": 10, "2026-11-02": 5 });
    expect(s.alku).toBe(SUPPILO_LUOTETTAVA_ALKAEN);
    expect(s.yhteensa.kaynnit).toBe(5);
    expect(kyselyt.slice(-2).every((a) => a.includes(SUPPILO_LUOTETTAVA_ALKAEN))).toBe(true);
  });
});

describe("etusivun 8 suosituinta", () => {
  it("TOP50-järjestys, vain paidat ja hupparit, yksi per malli", () => {
    const p = (slug: string, category: string) => ({ id: slug, slug, category, name: slug, price: 1, images: [] }) as unknown as Product;
    const tuotteet = [p("tonnin-seteli-huppari", "hupparit"), p("tonnin-seteli-t-paita", "t-paidat"), p("se-oli-tonnin-seteli-tarra", "tarrat"),
      p("maailman-paras-aiti-huppari", "hupparit"), p("saatanan-tunarit-t-paita", "t-paidat")];
    expect(valitseSuosituimmat(tuotteet).map((x) => x.slug)).toEqual(["maailman-paras-aiti-huppari", "tonnin-seteli-huppari", "saatanan-tunarit-t-paita"]);
  });
});

describe("uudelleenostot ja kumppanit", () => {
  it("asiakaskoodin muoto ja ystävälinkki", async () => {
    const { ASIAKASKOODI, ystavaLinkki } = await import("../../api/_lib/uusintaosto.js");
    expect(ASIAKASKOODI.test("KIITOS-ABC234")).toBe(true);
    expect(ASIAKASKOODI.test("YSTAVA-ABC23")).toBe(false);
    expect(ystavaLinkki("YSTAVA-ABC234")).toBe("https://huumorikauppa.fi/ystava/YSTAVA-ABC234");
  });
  it("kumppanin nimen genetiivi ja linkki", async () => {
    const { genetiivi, kumppaniLinkki } = await import("../../api/_lib/kumppani.js");
    expect(genetiivi("Antsa")).toBe("Antsan");
    expect(genetiivi("Keisarit")).toBe("Keisarien");
    expect(genetiivi("Mikael")).toBe("Mikaelin");
    expect(kumppaniLinkki("antsa")).toBe("https://huumorikauppa.fi/k/antsa");
  });
  it("liikenteen erittely", async () => {
    const { liikenne } = await import("../../api/_lib/mittarit.js");
    const l = liikenne({ lahteet: [{ nimi: "google", kaynnit: 5 }, { nimi: "bing", kaynnit: 1 }, { nimi: "media", kaynnit: 2 }, { nimi: "kumppani", kaynnit: 3 }],
      osiot: [{ nimi: "joululahja-isalle", kaynnit: 4 }, { nimi: "lahjat", kaynnit: 2 }, { nimi: "k", kaynnit: 3 }, { nimi: "tuote", kaynnit: 9 }] });
    expect(l).toMatchObject({ orgaaninen: 6, lahjasivut: 6, media: 2, kumppanisivut: 3, kumppanilinkit: 3, blogi: 0, yritysAlat: 0 });
  });
});

describe("käyntiosiot 2.11.2026", () => {
  it("yritysten alasivut omina osioinaan, blogi ja yritysten alasivut liikenteessä", async () => {
    const { sivunOsio } = await import("../../api/_lib/kaynnit.js");
    const { liikenne } = await import("../../api/_lib/mittarit.js");
    expect(sivunOsio("/yritykset/rakennus?utm_source=x")).toBe("yritykset-rakennus");
    expect(sivunOsio("/yritykset/tilaus")).toBe("yritykset");
    expect(sivunOsio("/yritykset")).toBe("yritykset");
    expect(sivunOsio("/blogi/saunojan-lahjaopas")).toBe("blogi");
    const l = liikenne({ lahteet: [], osiot: [{ nimi: "blogi", kaynnit: 4 }, { nimi: "yritykset-vpk", kaynnit: 2 }, { nimi: "yritykset-it", kaynnit: 1 }, { nimi: "yritykset", kaynnit: 5 }] });
    expect(l).toMatchObject({ blogi: 4, yritysAlat: 3 });
  });
});
