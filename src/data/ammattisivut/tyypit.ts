/**
 * Ammatti- ja harrastussivujen (/paidat/<slug>, 2.11.2026) sisällön muoto. Sisältö on tiedostoissa osaA.ts ... osaD.ts,
 * kokoaminen laskeutumissivuiksi ja uusien mallien tuotelista index.ts:ssä. Valinnan perusteet: seo/ammattisivut.md.
 *
 * Tekstisäännöt (testi src/test/ammattisivut.test.ts ja src/seo/landing.test.ts): intro + opas yhteensä 250-400 sanaa,
 * ei ajatusviivoja (– tai —), ei superlatiiveja (paras, suosituin), ei jossittelua (ehkä, saattaa, mahdollisesti),
 * ei hintoja, toimitusaikoja eikä päivämääriä käsin (ne tulevat konfiguraatiosta yhteisiin UKK-vastauksiin).
 */
export interface AmmattiSivuSisalto {
  /** ASCII-slug: sivu on /paidat/<slug>. */
  slug: string;
  /** Lyhyt nimi linkkeihin ja murupolkuun, esim. "Sähkömiehen paidat". */
  nimi: string;
  ryhma: "ammatti" | "harrastus";
  /** Uusien mallien tuotenimen kohde allatiivissa, esim. "sähkömiehelle" ("... | T-paita sähkömiehelle"). */
  kohde: string;
  /** Hakutulosotsikko ilman brändiä (alle 43 merkkiä; " | Huumorikauppa" lisätään). */
  otsikko: string;
  /** Metakuvaus, 70-150 merkkiä. */
  kuvaus: string;
  h1: string;
  /** 2-3 kappaletta. Ensimmäinen virke vastaa hakuun ("sähkömies paita"). */
  intro: string[];
  /** 2-3 otsikoitua osiota: huumori, tilanteet ja lahjaideat. */
  opas: { otsikko: string; teksti: string[] }[];
  /** 3 sivun omaa kysymystä (hinta- ja jouluvastaus lisätään yhteisinä). */
  ukk: { q: string; a: string }[];
  /** Aiheen aiemmat tuotteet: säännölliset lausekkeet tuotteen nimestä ja slugista (pienaakkosin). */
  tuotteet: RegExp[];
  /** Viisi uutta mallia (painorivit versaalein, enintään 3-4 riviä, rivi enintään 22 merkkiä). */
  mallit: string[][];
  /** Muut laskeutumissivut (vähintään 3, polut LANDING_PATHS:sta). */
  liittyvat: string[];
  /** Muut sisäiset linkit (blogi, olemassa oleva lahjasivu, personoidut). */
  lisalinkit?: { href: string; label: string }[];
  /** Personoitu vaihtoehto: teksti ja esitäytetty linkki (tuotesivun ?teksti= tai /personoitu-paita?malli=). */
  personoitu: { teksti: string; href: string; label: string };
}
