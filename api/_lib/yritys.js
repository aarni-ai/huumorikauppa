/**
 * Kaupan pitäjän yritystiedot (ainoa lähde, tavallinen JS: api-funktiot, middleware ja sivusto käyttävät samaa).
 * Kauppa siirtyy Tmi Intelleriltä Uusiku Oy:lle vasta, kun Uusiku Oy:n Stripe-tili ja uusi tausta otetaan käyttöön
 * (Stripe-tiliä ei voi siirtää). Vaihto tehdään ympäristömuuttujalla MYYJA=uusiku samassa käyttöönotossa
 * (KAYTTOONOTTO.md); ilman sitä sivuilla näkyy Inteller. Ei päivämäärään sidottua vaihtoa.
 * Tiedot: YTJ (avoindata.prh.fi), haettu 27.10.2026. Tyypit ja sivuston käyttö: src/config/yritys.ts.
 *
 * Selaimessa arvo tulee buildista (vite.config.ts määrittelee import.meta.env.VITE_MYYJA muuttujasta MYYJA),
 * palvelimella ja buildissa suoraan process.env.MYYJA:sta.
 */

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

/** "uusiku" tai "inteller" (oletus). MYYJA tai VITE_MYYJA Nodessa, import.meta.env.VITE_MYYJA selaimessa. */
export function valittuMyyja() {
  const env = globalThis.process?.env;
  let arvo = env?.MYYJA ?? env?.VITE_MYYJA;
  if (arvo == null) {
    try {
      arvo = import.meta.env.VITE_MYYJA;
    } catch {
      arvo = undefined;
    }
  }
  return String(arvo ?? "").trim().toLowerCase() === "uusiku" ? "uusiku" : "inteller";
}

/** Kaupan pitäjän tiedot (oletus: ympäristömuuttujan MYYJA mukaan). */
export function yritystiedot(myyja = valittuMyyja()) {
  return myyja === "uusiku" ? UUSIKU : INTELLER;
}

/** "Capellan puistotie 21, 00580 Helsinki" tai pelkkä paikkakunta, jos katuosoitetta ei ole. */
export function postiosoite(y) {
  if (y.streetAddress && y.postalCode) return `${y.streetAddress}, ${y.postalCode} ${y.addressLocality}`;
  return y.addressLocality;
}
