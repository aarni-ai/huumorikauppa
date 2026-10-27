/**
 * EU-maat yhteisenä moduulina: palvelin (api/_lib/tilausvahti.js), skriptit (scripts/lib/eu-painotalot.mjs vie nämä
 * edelleen, scripts/tilauskatteet.mjs). Ei riippuvuuksia.
 */

/** EU:n jäsenvaltiot (ISO 3166-1 alpha-2), 27 maata. Kreikka myös EL-muodossa (EU:n oma lyhenne). */
export const EU_MAAT = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "EL", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export function onEU(maa) {
  return EU_MAAT.has(String(maa || "").trim().toUpperCase());
}

/**
 * Maiden englanninkieliset nimet (Printifyn tilausrivin metadata.country, esim. "Czech Republic") -> ISO-koodi.
 * EU-maat kattavasti; muista ne, joissa Printifyllä on painotaloja.
 */
const NIMET = {
  austria: "AT", belgium: "BE", bulgaria: "BG", croatia: "HR", cyprus: "CY", "czech republic": "CZ", czechia: "CZ",
  denmark: "DK", estonia: "EE", finland: "FI", france: "FR", germany: "DE", greece: "GR", hungary: "HU", ireland: "IE",
  italy: "IT", latvia: "LV", lithuania: "LT", luxembourg: "LU", malta: "MT", netherlands: "NL", "the netherlands": "NL",
  poland: "PL", portugal: "PT", romania: "RO", slovakia: "SK", slovenia: "SI", spain: "ES", sweden: "SE",
  "united states": "US", "united states of america": "US", usa: "US", "united kingdom": "GB", uk: "GB", "great britain": "GB",
  canada: "CA", australia: "AU", "new zealand": "NZ", china: "CN", mexico: "MX", japan: "JP", switzerland: "CH",
  norway: "NO", turkey: "TR", "türkiye": "TR", ukraine: "UA", india: "IN", brazil: "BR", "south africa": "ZA",
  "hong kong": "HK", taiwan: "TW", "south korea": "KR", israel: "IL",
};

/** Maan ISO-koodi koodista tai nimestä; tuntematon -> null. */
export function maaKoodi(maa) {
  const s = String(maa ?? "").trim();
  if (!s) return null;
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  return NIMET[s.toLowerCase()] ?? null;
}
