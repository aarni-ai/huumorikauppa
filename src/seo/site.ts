/**
 * Kaupan perustiedot hakukoneille ja rakenteiselle datalle.
 *
 * Kaikki luvut on poimittu repon omista teksteistä (Terms.tsx, ReturnsPolicy.tsx, FAQ,
 * CartPage/CheckoutPage/create-checkout). Älä lisää tänne tietoa, jota kaupan omat
 * ehdot eivät sano.
 *
 * Tiedosto on tarkoituksella riippuvuudeton (ei "@/"-aliaksia), jotta sitä voi käyttää
 * myös Vercelin middlewaressa ja build-skripteissä.
 */

import {
  ILMAINEN_TOIMITUS_RAJA,
  TOIMITUSAIKA_MAX_ARKIPAIVAA,
  TOIMITUSAIKA_MIN_ARKIPAIVAA,
  TOIMITUSMAKSU,
} from "../config/toimitus";

export const SITE_URL = "https://huumorikauppa.fi";
export const SITE_NAME = "Huumorikauppa";

export const ORGANIZATION = {
  name: SITE_NAME,
  legalId: "3583677-2", // Y-tunnus (index.html, llms.txt)
  email: "huumorikauppa@gmail.com",
  addressLocality: "Helsinki",
  addressCountry: "FI",
  /** 256x256 PNG, poimittu favicon.ico:sta. */
  logo: `${SITE_URL}/logo.png`,
  /** Somekanavat, jotka löytyvät reposta (Footer.tsx ja index.html). */
  sameAs: [
    "https://www.wikidata.org/wiki/Q139915256",
    "https://www.instagram.com/huumorikauppa_fi",
    "https://www.tiktok.com/@huumorikauppa",
    "https://www.youtube.com/@huumorikauppa",
    "https://www.facebook.com/profile.php?id=61584153329326",
  ],
} as const;

/** Toimitus (arvot: src/config/toimitus.ts, sama sääntö kuin kassalla ja Terms.tsx:ssä). */
export const SHIPPING = {
  country: "FI",
  feeEur: TOIMITUSMAKSU,
  freeThresholdEur: ILMAINEN_TOIMITUS_RAJA,
  /** Kokonaistoimitusaika tilauksesta, arkipäivinä. */
  deliveryBusinessDaysMin: TOIMITUSAIKA_MIN_ARKIPAIVAA,
  deliveryBusinessDaysMax: TOIMITUSAIKA_MAX_ARKIPAIVAA,
} as const;

export const RETURNS = {
  /** Kuluttajansuojalain mukainen peruutusoikeus (ReturnsPolicy.tsx). */
  days: 14,
  /** Palautuksen postikulut maksaa asiakas, ellei tuote ole virheellinen (Terms.tsx kohta 5). */
  customerPaysReturnShipping: true,
} as const;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (path === "/" || path === "") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Tuotteen hinta muodossa "24,90 €". */
export function formatPriceFi(price: number): string {
  return `${price.toFixed(2).replace(".", ",")} €`;
}
