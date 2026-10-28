/**
 * Vaatteiden mitat pohjatuotteen (Printify blueprint) mukaan, Gildanin mittalomakkeista (blankstyle.com,
 * SpecSheetMeasurements_64000.pdf, _5000.pdf, _18500.pdf, haettu 29.10.2026). Lomakkeen tuumat muunnetaan
 * senttimetreiksi (1 in = 2,54 cm) ja pyöristetään kokonaisiksi. Pohja tulee tuotekohtaisesti
 * api/_lib/tuotepohjat.generated.js:stä, joten taulukko näytetään vain tuotteille, joiden pohja tunnetaan.
 */
import { tuotepohja } from "../../api/_lib/materiaali.js";

interface Pohjamitat {
  malli: string;
  koot: string[];
  /** Mittarivit tuumina lomakkeen järjestyksessä. */
  rivit: { nimi: string; selite: string; tuumat: number[] }[];
}

const POHJAMITAT: Record<number, Pohjamitat> = {
  145: {
    malli: "Gildan Softstyle 64000",
    koot: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    rivit: [
      { nimi: "Leveys", selite: "rinnan kohdalta tasaisella alustalla", tuumat: [16, 18, 20, 22, 24, 26, 28, 30, 32] },
      { nimi: "Pituus", selite: "olkasaumasta helmaan takaa", tuumat: [27, 28, 29, 30, 31, 32, 33, 34, 35] },
      { nimi: "Hiha", selite: "niskan keskeltä hihan suuhun", tuumat: [15.5, 16.75, 17.875, 19.125, 20.375, 21.625, 22.75, 23.875, 25.125] },
    ],
  },
  6: {
    malli: "Gildan Heavy Cotton 5000",
    koot: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    rivit: [
      { nimi: "Leveys", selite: "rinnan kohdalta tasaisella alustalla", tuumat: [18, 20, 22, 24, 26, 28, 30, 32] },
      { nimi: "Pituus", selite: "olkasaumasta helmaan takaa", tuumat: [28, 29, 30, 31, 32, 33, 34, 35] },
      { nimi: "Hiha", selite: "niskan keskeltä hihan suuhun", tuumat: [15.625, 17, 18.5, 20, 21.5, 22.375, 23.625, 25] },
    ],
  },
  77: {
    malli: "Gildan Heavy Blend 18500",
    koot: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    rivit: [
      { nimi: "Leveys", selite: "rinnan kohdalta tasaisella alustalla", tuumat: [18, 20, 22, 24, 26, 28, 30, 32, 34] },
      { nimi: "Pituus", selite: "olkasaumasta helmaan takaa", tuumat: [26, 27, 28, 29, 30, 31, 32, 33, 34] },
      { nimi: "Hiha", selite: "niskan keskeltä hihan suuhun", tuumat: [32.5, 33, 34, 35, 36, 37, 38, 39, 40] },
    ],
  },
};

/** Kauppa käyttää kokoja "XXL" ja "XXXL" sekä "2XL"; lomake käyttää muotoa 2XL. */
const normalisoi = (koko: string) => koko.trim().toUpperCase().replace(/^XXXXXL$/, "5XL").replace(/^XXXXL$/, "4XL").replace(/^XXXL$/, "3XL").replace(/^XXL$/, "2XL");

export interface Mittataulukko {
  malli: string;
  koot: string[];
  rivit: { nimi: string; selite: string; cm: number[] }[];
}

/** Tuotteen mittataulukko senttimetreinä myytävien kokojen mukaan, tai null jos pohjaa tai kokoja ei tunneta. */
export function mittataulukko(slug: string | undefined, myytavat: string[]): Mittataulukko | null {
  const t = tuotepohja(slug);
  const pohja = t ? POHJAMITAT[t.b] : undefined;
  if (!pohja) return null;
  const sarakkeet = myytavat
    .map((koko) => ({ koko, i: pohja.koot.indexOf(normalisoi(koko)) }))
    .filter((x) => x.i >= 0);
  if (!sarakkeet.length) return null;
  return {
    malli: pohja.malli,
    koot: sarakkeet.map((x) => x.koko),
    rivit: pohja.rivit.map((r) => ({ nimi: r.nimi, selite: r.selite, cm: sarakkeet.map((x) => Math.round(r.tuumat[x.i] * 2.54)) })),
  };
}
