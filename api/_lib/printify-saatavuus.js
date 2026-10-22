// GENEROITU: scripts/printify-saatavuus.mjs kirjoittaa tämän tiedoston. Älä muokkaa käsin.
// Sama data kuin src/data/printify-saatavuus.json (kokonaan valmistamattomat tuotteet) syötteen ja sivukartan käyttöön.
export const SAATAVUUS_GENERATED_AT = "2026-10-22T12:57:46.936Z";
export const KOKONAAN_EI_SAATAVILLA = new Set([]);
/** Koko data kaupan apufunktiolle (src/lib/variantAvailability.ts); JS-moduuli toimii Vitessä, middlewaressa ja Nodessa. */
export const SAATAVUUS_DATA = {
  "generated_at": "2026-10-22T12:57:46.936Z",
  "products": {},
  "kokonaan_ei_saatavilla": [],
  "summary": {
    "checked_products": 783,
    "checked_variants": 18714,
    "unavailable_variants": 8342,
    "ei_kartassa": 8342,
    "tila": "vain-kartta"
  }
};
