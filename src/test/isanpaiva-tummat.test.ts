// @vitest-environment node
import { describe, expect, it } from "vitest";
import { lahjakorttiPdf, pdfTiedostonimi } from "../../api/_lib/lahjakortti-pdf.js";
import { LAHJAKORTTI_ARVOT, lahjakorttiTuote } from "../../api/_lib/lahjakortti.js";
import { poistaTummatVarit, TUMMAT } from "../../api/_lib/tummat-varit.js";
import { nakymaton, luettavuus, poistetaanko, hexRgb } from "../../scripts/tummat-varit.mjs";
import { tarkistaMainoskulut, mainontaYhteenveto } from "../../api/_lib/mainoskulut.js";

describe("isänpäivän lahjakortti", () => {
  it("arvot 25, 35 ja 50 €", () => {
    expect(LAHJAKORTTI_ARVOT).toEqual([25, 35, 50]);
    expect(lahjakorttiTuote(35)).toMatchObject({ id: "lahjakortti-35", price: 35 });
    expect(lahjakorttiTuote(75)).toBeNull();
  });

  it("PDF: kelvollinen rakenne, koodi ja ääkköset WinAnsina", () => {
    const pdf = lahjakorttiPdf({ code: "HK-ABCD-EFGH-JK23", initial_value: 35, expires_at: "2028-11-08T10:00:00Z", recipient_name: "Isä", message: "Hyvää isänpäivää (ja kiitos)" });
    const s = pdf.toString("latin1");
    expect(s.startsWith("%PDF-1.4")).toBe(true);
    expect(s.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(s).toContain("(HK-ABCD-EFGH-JK23) Tj");
    expect(s).toContain("(35 \\200) Tj");
    expect(s).toContain("Is\\344");
    expect(s).toContain("\\(ja kiitos\\)");
    // xref-taulukon siirtymät osuvat objektien alkuun
    const alku = Number(s.match(/startxref\n(\d+)/)![1]);
    expect(s.slice(alku, alku + 4)).toBe("xref");
    const siirtymat = [...s.slice(alku).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    siirtymat.forEach((k, i) => expect(s.slice(k, k + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
    expect(pdfTiedostonimi("HK-ABCD-EFGH-JK23")).toBe("lahjakortti-HK-ABCD-EFGH-JK23.pdf");
  });

});

describe("tumma painatus tummalla pohjalla", () => {
  const navy = hexRgb("#424753");
  it("tumma teksti tummalla on näkymätön, eri sävy tai vaalea pohja ei", () => {
    expect(nakymaton([26, 26, 26], navy)).toBe(true);
    expect(nakymaton([208, 58, 76], hexRgb("#454545"))).toBe(false); // punainen sydän tummanharmaalla
    expect(nakymaton([255, 255, 255], navy)).toBe(false);
    expect(nakymaton([200, 200, 200], hexRgb("#ffffff"))).toBe(false); // vaalea pohja ei kuulu sääntöön
  });

  it("luettavuus: kokonaan tumma kuva 100 %, ohut ääriviiva alle rajan", () => {
    expect(luettavuus([{ rgb: [20, 20, 20], n: 100 }], navy).osuus).toBe(1);
    const reunus = luettavuus([{ rgb: [20, 20, 20], n: 30 }, { rgb: [250, 210, 40], n: 70 }], hexRgb("#000000"));
    expect(reunus.osuus).toBeCloseTo(0.3);
    expect(poistetaanko({ syyt: [] })).toBe(false);
    expect(poistetaanko({ syyt: ["teksti ei erotu"] })).toBe(true);
  });

  const tuote = {
    slug: "testi-t-paita",
    images: [
      "https://images-api.printify.com/mockup/abc123/111/1/x.jpg?camera_label=front",
      "https://images-api.printify.com/mockup/abc123/222/1/x.jpg?camera_label=front",
    ],
    variants: {
      colors: ["Meleerattu tummansininen", "Valkoinen"], sizes: ["M", "L"], default_color: "Meleerattu tummansininen",
      variant_map: { "Meleerattu tummansininen|M": 111, "Meleerattu tummansininen|L": 112, "Valkoinen|M": 222, "Valkoinen|L": 223 },
      variant_images: { "Meleerattu tummansininen": ["a"], Valkoinen: ["b"] },
    },
    unavailable_variants: ["Meleerattu tummansininen|L"],
  };

  it("poistaa värin kartasta, kuvista, oletusväristä ja saatavuuslistasta", () => {
    const p = poistaTummatVarit(tuote, { "testi-t-paita": ["Meleerattu tummansininen"] });
    expect(p.variants.colors).toEqual(["Valkoinen"]);
    expect(Object.keys(p.variants.variant_map)).toEqual(["Valkoinen|M", "Valkoinen|L"]);
    expect(p.variants.default_color).toBe("Valkoinen");
    expect(Object.keys(p.variants.variant_images)).toEqual(["Valkoinen"]);
    expect(p.images).toEqual([tuote.images[1]]);
    expect(p.unavailable_variants).toEqual([]);
  });

  it("ei koskaan tyhjennä tuotetta eikä koske listaamattomiin", () => {
    expect(poistaTummatVarit(tuote, { "testi-t-paita": ["Meleerattu tummansininen", "Valkoinen"] })).toBe(tuote);
    expect(poistaTummatVarit(tuote, {})).toBe(tuote);
  });

  it("generoitu lista: 50 vuotta nuori ilman tummansinistä", () => {
    expect(TUMMAT["50-vuotta-nuori-t-paita"]).toContain("Meleerattu tummansininen");
  });
});

describe("mainoskulut", () => {
  it("ennen kokeilua kaikki nollaa", () => {
    expect(mainontaYhteenveto([], { tilauksia: 0, kate: 0 })).toMatchObject({ kulut: 0, kustannusPerTilaus: 0, kateMainonnanJalkeen: 0 });
  });
  it("kustannus per tilaus ja kate mainoskulujen jälkeen", () => {
    const y = mainontaYhteenveto([{ kulut: "10.00", klikit: 50, konversiot: 1 }, { kulut: 9.5, klikit: 40, konversiot: 0 }], { tilauksia: 2, kate: 19.02 });
    expect(y).toMatchObject({ kulut: 19.5, klikit: 90, konversiot: 1, kustannusPerTilaus: 9.75, kateMainonnanJalkeen: -0.48 });
    expect(mainontaYhteenveto([{ kulut: 5 }], { tilauksia: 0 }).kustannusPerTilaus).toBeNull();
  });
  it("tarkistus", () => {
    expect(tarkistaMainoskulut({ kulut: "7,35", klikit: 20 }, "2026-11-01")).toMatchObject({ ok: true, rivi: { paiva: "2026-11-01", kanava: "google-ads", kulut: 7.35, klikit: 20, konversiot: 0 } });
    expect(tarkistaMainoskulut({ paiva: "2026-11-02" }, "2026-11-01").ok).toBe(false);
    expect(tarkistaMainoskulut({ kanava: "x" }, "2026-11-01").ok).toBe(false);
    expect(tarkistaMainoskulut({ kulut: -1 }, "2026-11-01").ok).toBe(false);
  });
});
