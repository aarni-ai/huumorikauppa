/**
 * Toimitusajat arkipäivinä (tuotanto painotalossa + kuljetus Suomeen). Tuotesivun toimitusarvio ja joulun
 * viimeiset tilauspäivät (src/lib/toimitusarvio.ts) laskevat näistä. Arvot ovat tarkoituksella varovaisia:
 * arvio kertoo, mihin mennessä paketti on perillä viimeistään.
 *
 * TODO: tarkenna painotalokohtaiset ajat tiedostosta seo/toimitusajat.md (toinen agentti kokoaa sen) ja lisää
 * tuotteille painotalon alue (variants.toimitusalue "eu" tai "us"), kun EU-painotalosiirto on ajettu
 * (scripts/printify-eu-painotalot.mjs). Tuotteiden origin_country-kenttään ei voi luottaa (kaikilla "EU").
 */
export type ToimitusAlue = "eu" | "us";

export interface ToimitusProfiili {
  nimi: string;
  /** Tuotanto arkipäivinä [vähintään, enintään]. */
  tuotanto: [number, number];
  /** Kuljetus Suomeen arkipäivinä [vähintään, enintään]. */
  kuljetus: [number, number];
}

export const TOIMITUSPROFIILIT: Record<ToimitusAlue, ToimitusProfiili> = {
  eu: { nimi: "EU-painotalo", tuotanto: [2, 5], kuljetus: [4, 8] },
  us: { nimi: "Yhdysvaltalainen painotalo", tuotanto: [2, 5], kuljetus: [7, 12] },
};

/** Kun painotaloa ei tiedetä, käytetään hitainta profiilia. */
export const OLETUSALUE: ToimitusAlue = "us";

/** Joulun raja: paketti perillä viimeistään tänä päivänä (kuukausi-päivä). */
export const JOULU_RAJA = "12-23";
/** "Ehtii jouluksi" -merkki näytetään aikaisintaan tästä päivästä alkaen (kuukausi-päivä). */
export const JOULUSESONKI_ALKAA = "10-15";
