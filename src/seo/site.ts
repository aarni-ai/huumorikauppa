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
  KASITTELYAIKA_MAX_ARKIPAIVAA,
  KASITTELYAIKA_MIN_ARKIPAIVAA,
  KULJETUSAIKA_MAX_ARKIPAIVAA,
  KULJETUSAIKA_MIN_ARKIPAIVAA,
  TOIMITUSAIKA_MAX_ARKIPAIVAA,
  TOIMITUSAIKA_MIN_ARKIPAIVAA,
  TOIMITUSMAKSU,
} from "../config/toimitus.js";
import { postiosoite, yritystiedot } from "../config/yritys.js";

export const SITE_URL = "https://huumorikauppa.fi";
export const SITE_NAME = "Huumorikauppa";

/**
 * Kaupan pitäjä lasketaan moduulin latautuessa (src/config/yritys.ts): build ennen 1.11.2026
 * tuottaa Intellerin tiedot, build tai selain sen jälkeen Uusiku Oy:n tiedot.
 */
const YRITYS = yritystiedot();

export const ORGANIZATION = {
  name: SITE_NAME,
  /** Yritys, jonka nimissä kauppaa pidetään. */
  legalName: YRITYS.legalName,
  legalId: YRITYS.businessId, // Y-tunnus
  vatID: YRITYS.vatId, // ALV-numero
  email: YRITYS.email,
  streetAddress: YRITYS.streetAddress,
  postalCode: YRITYS.postalCode,
  addressLocality: YRITYS.addressLocality,
  addressCountry: YRITYS.addressCountry,
  /** "Katu 1, 00100 Helsinki" tai pelkkä paikkakunta. */
  postalAddress: postiosoite(YRITYS),
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
  /** Käsittely (painatus) ja kuljetus arkipäivinä; summat = kokonaistoimitusaika. */
  handlingBusinessDaysMin: KASITTELYAIKA_MIN_ARKIPAIVAA,
  handlingBusinessDaysMax: KASITTELYAIKA_MAX_ARKIPAIVAA,
  transitBusinessDaysMin: KULJETUSAIKA_MIN_ARKIPAIVAA,
  transitBusinessDaysMax: KULJETUSAIKA_MAX_ARKIPAIVAA,
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
