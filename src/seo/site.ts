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

/** Toimitus ja palautus (Terms.tsx: "Toimitusaika on 3–10 arkipäivää tilauksesta. Yli 79 € ... Alle 79 € ... 6,90 €"). */
export const SHIPPING = {
  country: "FI",
  feeEur: 6.9,
  freeThresholdEur: 79,
  /** Kokonaistoimitusaika tilauksesta, arkipäivinä. */
  deliveryBusinessDaysMin: 3,
  deliveryBusinessDaysMax: 10,
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
