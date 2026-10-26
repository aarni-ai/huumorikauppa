/**
 * Kaupan pitäjän yritystiedot (ainoa lähde, tavallinen JS: api-funktiot, middleware ja sivusto käyttävät samaa).
 * Kauppa siirtyy Tmi Intelleriltä Uusiku Oy:lle 1.11.2026 klo 00.00 Suomen aikaa. Tiedot: YTJ (avoindata.prh.fi),
 * haettu 27.10.2026. Tyypit ja sivuston käyttö: src/config/yritys.ts. Testeissä ja build-skripteissä hetken voi
 * asettaa ympäristömuuttujalla YRITYS_NYT (ISO-aikaleima).
 */

/** 1.11.2026 00.00 Europe/Helsinki (UTC+2, talviaika alkaa 25.10.2026). */
export const YRITYS_VAIHTO = "2026-10-31T22:00:00Z";

const EMAIL = "huumorikauppa@gmail.com";

/** Historiallinen: kaupan pitäjä 31.10.2026 asti. */
export const INTELLER = {
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
export const UUSIKU = {
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
export function nykyhetki() {
  const ohitus = globalThis.process?.env?.YRITYS_NYT;
  if (ohitus) {
    const d = new Date(ohitus);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Kaupan pitäjän tiedot annettuna hetkenä. */
export function yritystiedot(nyt = nykyhetki()) {
  return nyt.getTime() >= VAIHTO_MS ? UUSIKU : INTELLER;
}

/** "Capellan puistotie 21, 00580 Helsinki" tai pelkkä paikkakunta, jos katuosoitetta ei ole. */
export function postiosoite(y) {
  if (y.streetAddress && y.postalCode) return `${y.streetAddress}, ${y.postalCode} ${y.addressLocality}`;
  return y.addressLocality;
}
