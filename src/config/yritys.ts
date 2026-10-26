/**
 * Kaupan pitäjän yritystiedot: tyypit api/_lib/yritys.js:n päälle. Vaihto Inteller -> Uusiku Oy ympäristömuuttujalla
 * MYYJA=uusiku vasta Uusiku Oy:n Stripe-tilin ja uuden taustan käyttöönotossa (KAYTTOONOTTO.md).
 */

export interface Yritystiedot {
  /** Nimi, jolla yritys esitellään sivuilla. */
  name: string;
  /** Virallinen toiminimi (kaupparekisteri / YTJ). */
  legalName: string;
  /** Y-tunnus. */
  businessId: string;
  /** ALV-numero. */
  vatId: string;
  /** Katuosoite, jos julkaistu. */
  streetAddress: string | null;
  postalCode: string | null;
  addressLocality: string;
  addressCountry: "FI";
  email: string;
}

import * as Y from "../../api/_lib/yritys.js";

/** Historiallinen: kaupan pitäjä 31.10.2026 asti. */
export const INTELLER: Yritystiedot = Y.INTELLER as Yritystiedot;
/** Kaupan pitäjä 1.11.2026 alkaen. */
export const UUSIKU: Yritystiedot = Y.UUSIKU as Yritystiedot;
/** "uusiku" tai "inteller" ympäristömuuttujan MYYJA mukaan. */
export const valittuMyyja: () => "uusiku" | "inteller" = Y.valittuMyyja as () => "uusiku" | "inteller";
/** Kaupan pitäjän tiedot annettuna hetkenä. */
export const yritystiedot: (myyja?: "uusiku" | "inteller") => Yritystiedot = Y.yritystiedot as (myyja?: "uusiku" | "inteller") => Yritystiedot;
/** "Capellan puistotie 21, 00580 Helsinki" tai pelkkä paikkakunta, jos katuosoitetta ei ole. */
export const postiosoite: (y: Yritystiedot) => string = Y.postiosoite;
