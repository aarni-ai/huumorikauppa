/**
 * Painotiedostojen tarkistus (3.11.2026, api/_lib/painotiedosto.js): tehollinen resoluutio, painoalueen ylitys näkyvän
 * sisällön mukaan ja korjattu sijoitus. Mitat Printifyn katalogista: t-paita OPT (bp 145) ja huppari Textildruck (bp 77).
 */
import { describe, expect, it } from "vitest";
import { arvioiPainokuva, sisallonYlitys, korjattuSijoitus, tarkistaTuote, suurimmatPainoalueet, resoluutioSijoitus, MIN_DPI, KORJAUS_MARGINAALI, PIENENNYS_MIN_OSUUS } from "../../api/_lib/painotiedosto.js";
import { onPainolaatuPiilotettu } from "../../api/_lib/painolaatu.js";
import { painoalue } from "../../scripts/lib/uudet-tuotteet.mjs";
import { PAINOLAATU_PIILOTETUT } from "../../api/_lib/painolaatu-data.js";
import { onPiilotettuTuote } from "../../api/_lib/piilotetut.js";
import { onPiilotettuTuote as onPiilotettuSelaimessa } from "@/lib/hiddenCategories";

const HUPPARI = { width: 3709, height: 2472 };

describe("tehollinen resoluutio", () => {
  it("koko painoalueen levyinen 4500 px kuva on yli 300 DPI, pieni näyttökuva alle rajan", () => {
    expect(arvioiPainokuva({ width: 4500, height: 3000, x: 0.5, y: 0.5, scale: 1, angle: 0 }, HUPPARI).dpi).toBe(364);
    // Tonnin seteli -paidan alkuperäinen tiedosto: 1140 px näyttökuva skaalalla 0,86.
    const seteli = arvioiPainokuva({ width: 1140, height: 836, x: 0.5, y: 0.5, scale: 0.859, angle: 0 }, { width: 4200, height: 4800 });
    expect(seteli.dpi).toBeLessThan(MIN_DPI);
  });

  it("tarkistus ohittaa vektorit ja tekstikerrokset ja ilmoittaa samasta kuvasta kerran", () => {
    const kuva = { id: "a", name: "x.png", type: "image/png", width: 300, height: 300, x: 0.5, y: 0.5, scale: 0.5, angle: 0 };
    const tuote = { print_areas: [
      { placeholders: [{ position: "front", images: [kuva, { ...kuva, id: "s", name: "sydan.svg", width: 57, height: 50 }, { type: "text/svg" }] }] },
      { placeholders: [{ position: "front", images: [kuva] }] },
    ] };
    const loydot = tarkistaTuote(tuote, { front: HUPPARI });
    expect(loydot).toEqual([{ paikka: "front", kuva: "x.png", syy: "resoluutio", dpi: 49 }]);
  });

  it("suurin painoalue valitaan käytössä olevista varianteista", () => {
    const k = [{ id: 1, placeholders: [{ position: "front", width: 100, height: 100 }] }, { id: 2, placeholders: [{ position: "front", width: 200, height: 200 }] }];
    expect(suurimmatPainoalueet(k, new Set([1]))).toEqual({ front: { width: 100, height: 100 } });
    expect(suurimmatPainoalueet(k)).toEqual({ front: { width: 200, height: 200 } });
  });
});

describe("painoalueen ylitys näkyvän sisällön mukaan", () => {
  // 4500 x 5400 kangas hupparin 3709 x 2472 alueella: kuva on 1,82 alueen korkeutta.
  const kangas = { width: 4500, height: 5400, x: 0.5, y: 0.5, scale: 1, angle: 0 };

  it("läpinäkyvä reuna saa ylittää, näkyvä sisältö ei", () => {
    expect(arvioiPainokuva(kangas, HUPPARI).ylittaa).toBe(true);
    expect(sisallonYlitys(kangas, HUPPARI, { x0: 0.1, x1: 0.9, y0: 0.4, y1: 0.6 }).ylittaa).toBe(false);
    expect(sisallonYlitys(kangas, HUPPARI, { x0: 0.1, x1: 0.9, y0: 0.2, y1: 0.95 }).ylittaa).toBe(true);
  });

  it("korjattu sijoitus pitää sisällön marginaalin sisällä: siirto, tai pienennys kun sisältö ei mahdu", () => {
    for (const rajat of [{ x0: 0.1, x1: 0.9, y0: 0.45, y1: 0.75 }, { x0: 0.1, x1: 0.9, y0: 0.2, y1: 0.95 }, { x0: 0, x1: 1, y0: 0, y1: 1 }]) {
      const uusi = korjattuSijoitus(kangas, HUPPARI, rajat);
      const s = sisallonYlitys({ ...kangas, ...uusi }, HUPPARI, rajat);
      expect(s.ylittaa).toBe(false);
      for (const v of [s.vasen, s.yla]) expect(v).toBeGreaterThanOrEqual(KORJAUS_MARGINAALI - 1e-6);
      for (const v of [s.oikea, s.ala]) expect(v).toBeLessThanOrEqual(1 - KORJAUS_MARGINAALI + 1e-6);
    }
    // Mahtuva sisältö vain siirtyy: koko pysyy.
    expect(korjattuSijoitus(kangas, HUPPARI, { x0: 0.1, x1: 0.9, y0: 0.45, y1: 0.75 }).scale).toBe(1);
    // Liian korkea sisältö pienenee.
    expect(korjattuSijoitus(kangas, HUPPARI, { x0: 0.1, x1: 0.9, y0: 0.2, y1: 0.95 }).scale).toBeLessThan(1);
  });
});

describe("resoluution korjaus pienentämällä", () => {
  const T_PAITA = { width: 3852, height: 4398 };
  it("95 DPI:n kuva pienennetään vähintään 150 DPI:hin, yläreuna ja keskikohta pysyvät", () => {
    const kuva = { width: 1220, height: 900, x: 0.5, y: 0.4, scale: 1, angle: 0 };
    const ennen = arvioiPainokuva(kuva, T_PAITA);
    expect(ennen.dpi).toBe(95);
    const uusi = resoluutioSijoitus(kuva, T_PAITA)!;
    const jalkeen = arvioiPainokuva({ ...kuva, ...uusi }, T_PAITA);
    expect(jalkeen.dpi).toBeGreaterThanOrEqual(MIN_DPI);
    expect(uusi.x).toBe(0.5);
    expect(jalkeen.yla).toBeCloseTo(ennen.yla, 5);
    expect(uusi.scale).toBeGreaterThanOrEqual(PIENENNYS_MIN_OSUUS);
  });

  it("riittävä resoluutio ei muutu, ja liian pieni kuva (alle 60 % koosta) palauttaa null", () => {
    const hyva = { width: 4000, height: 4000, x: 0.5, y: 0.5, scale: 1, angle: 0 };
    expect(resoluutioSijoitus(hyva, T_PAITA)).toEqual({ x: 0.5, y: 0.5, scale: 1 });
    expect(resoluutioSijoitus({ width: 250, height: 202, x: 0.5, y: 0.5, scale: 0.91, angle: 0 }, T_PAITA)).toBeNull();
  });
});

describe("painolaadun takia piilotetut tuotteet", () => {
  it("piilotetaan palvelimella ja selaimessa samalla listalla", () => {
    const slugit = Object.keys(PAINOLAATU_PIILOTETUT);
    for (const slug of slugit) {
      expect(onPainolaatuPiilotettu(slug)).toBe(true);
      expect(onPiilotettuTuote({ slug, category: "t-paidat" })).toBe(true);
      expect(onPiilotettuSelaimessa({ slug, category: "t-paidat" })).toBe(true);
    }
    for (const dpi of Object.values(PAINOLAATU_PIILOTETUT)) expect(dpi).toBeLessThan(MIN_DPI);
    expect(onPainolaatuPiilotettu("ei-tallainen-tuote")).toBe(false);
  });
});

describe("uusien tuotteiden painopohja (scripts/lib/uudet-tuotteet.mjs painoalue)", () => {
  it("pohja mahtuu jokaisen koon painoalueelle skaalalla 1", () => {
    const valitut = [
      { placeholders: [{ position: "front", width: 3852, height: 4398 }] },
      { placeholders: [{ position: "front", width: 4200, height: 4800 }] },
      { placeholders: [{ position: "front", width: 4500, height: 4400 }] },
    ];
    const a = painoalue(valitut);
    expect(a.width).toBe(4500);
    for (const v of valitut) {
      const alue = v.placeholders[0];
      expect(arvioiPainokuva({ width: a.width, height: a.height, x: 0.5, y: 0.5, scale: 1, angle: 0 }, alue).ylittaa).toBe(false);
    }
  });
});
