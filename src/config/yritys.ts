/**
 * Kaupan pitäjän yritystiedot (ainoa lähde). Kauppa siirtyy Tmi Intelleriltä Uusiku Oy:lle
 * 1.11.2026 klo 00.00 Suomen aikaa. Tiedot: YTJ (avoindata.prh.fi), haettu 27.10.2026.
 *
 * Riippuvuudeton (ei "@/"-aliaksia eikä npm-paketteja), jotta tätä voi käyttää selaimessa,
 * Vercelin middlewaressa, api-funktioissa, Viten konfiguraatiossa ja esirenderöinnissä.
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

/** 1.11.2026 00.00 Europe/Helsinki (UTC+2, talviaika alkaa 25.10.2026). */
export const YRITYS_VAIHTO = "2026-10-31T22:00:00Z";

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

const EMAIL = "huumorikauppa@gmail.com";

/** Historiallinen: kaupan pitäjä 31.10.2026 asti. */
export const INTELLER: Yritystiedot = {
  name: "Inteller",
  legalName: "Inteller",
  businessId: "3583677-2",
  vatId: "FI35836772",
  streetAddress: null,
  postalCode: null,
  addressLocality: "Helsinki",
  addressCountry: "FI",
  email: EMAIL,
};

/** Kaupan pitäjä 1.11.2026 alkaen. */
export const UUSIKU: Yritystiedot = {
  name: "Uusiku Oy",
  legalName: "Uusiku Oy",
  businessId: "3653666-7",
  vatId: "FI36536667",
  streetAddress: "Capellan puistotie 21",
  postalCode: "00580",
  addressLocality: "Helsinki",
  addressCountry: "FI",
  email: EMAIL,
};

const VAIHTO_MS = Date.parse(YRITYS_VAIHTO);

/** Nykyhetki; YRITYS_NYT-ympäristömuuttuja (vain Node) ohittaa sen testeissä ja buildissa. */
export function nykyhetki(): Date {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const ohitus = env?.YRITYS_NYT;
  if (ohitus) {
    const d = new Date(ohitus);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Kaupan pitäjän tiedot annettuna hetkenä. */
export function yritystiedot(nyt: Date = nykyhetki()): Yritystiedot {
  return nyt.getTime() >= VAIHTO_MS ? UUSIKU : INTELLER;
}

/** "Capellan puistotie 21, 00580 Helsinki" tai pelkkä paikkakunta, jos katuosoitetta ei ole. */
export function postiosoite(y: Yritystiedot): string {
  if (y.streetAddress && y.postalCode) return `${y.streetAddress}, ${y.postalCode} ${y.addressLocality}`;
  return y.addressLocality;
}
