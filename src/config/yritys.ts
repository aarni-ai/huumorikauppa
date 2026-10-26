/**
 * Kaupan pitäjän yritystiedot (ainoa lähde). Kauppa siirtyy Tmi Intelleriltä Uusiku Oy:lle
 * 1.11.2026 klo 00.00 Suomen aikaa. Tiedot: YTJ (avoindata.prh.fi), haettu 27.10.2026.
 *
 * Data ja funktiot ovat tiedostossa api/_lib/yritys.js (tavallinen JS, jotta myös api-funktiot ja sähköpostit
 * käyttävät samaa lähdettä); tämä tiedosto lisää tyypit.
 *
 * Vaihto tapahtuu kahdessa paikassa:
 * - Selaimessa: src/seo/site.ts laskee ORGANIZATIONin moduulin latautuessa, joten
 *   1.11.2026 jälkeen avattu sivu näyttää Uusiku Oy:n tiedot.
 * - Esirenderöidyssä HTML:ssä ja llms.txt:ssä: buildin hetki ratkaisee. Ajastettu
 *   GitHub Actions -työnkulku (.github/workflows/yritysvaihto.yml) käynnistää uuden buildin
 *   vaihdon jälkeen.
 *
 * Testeissä ja build-skripteissä hetken voi asettaa ympäristömuuttujalla YRITYS_NYT
 * (ISO-aikaleima), esim. YRITYS_NYT=2026-11-01T00:00:00+02:00 npm run build.
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

export const YRITYS_VAIHTO: string = Y.YRITYS_VAIHTO;
/** Historiallinen: kaupan pitäjä 31.10.2026 asti. */
export const INTELLER: Yritystiedot = Y.INTELLER as Yritystiedot;
/** Kaupan pitäjä 1.11.2026 alkaen. */
export const UUSIKU: Yritystiedot = Y.UUSIKU as Yritystiedot;
/** Nykyhetki; YRITYS_NYT-ympäristömuuttuja (vain Node) ohittaa sen testeissä ja buildissa. */
export const nykyhetki: () => Date = Y.nykyhetki;
/** Kaupan pitäjän tiedot annettuna hetkenä. */
export const yritystiedot: (nyt?: Date) => Yritystiedot = Y.yritystiedot as (nyt?: Date) => Yritystiedot;
/** "Capellan puistotie 21, 00580 Helsinki" tai pelkkä paikkakunta, jos katuosoitetta ei ole. */
export const postiosoite: (y: Yritystiedot) => string = Y.postiosoite;
