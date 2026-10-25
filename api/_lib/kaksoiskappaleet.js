/**
 * Lovable-taustan Printify-synkronoinnin kaksoiskappaleet (25.10.2026).
 *
 * Synkronointi muodostaa slugin Printify-tuotteen otsikosta. Kun Printifyssä on kaksi samannimistä tuotetta (esim.
 * vanha ja EU-painotalolle siirretty kopio), toinen saa slugin perään Printify-tunnuksen kuusi viimeistä merkkiä
 * ("...-t-paita-0d6670") ja kauppaan syntyy uusi aktiivinen rivi. Perusrivi (ilman päätettä) on kanoninen osoite.
 * Kaksoiskappale piilotetaan kaikkialta ja ohjataan 301:llä perusriviin (middleware.ts).
 *
 * Lisäksi Coworkin Printify-testikopiot ("Copy of ...", "Ceramic Mug (EU)") eivät ole myyntituotteita.
 */
const PAATE = /^(.+)-([0-9a-f]{6})$/;
const TESTIKOPIOT = new Set(["ceramic-mug-eu"]);

/** Kaksoiskappaleen perusslug, tai null jos slug ei ole kaksoiskappale. Pääte vaatii numeron (ei osu sanoihin). */
export function kaksoiskappaleenPerusslug(slug) {
  const m = PAATE.exec(String(slug || ""));
  if (!m || !/\d/.test(m[2])) return null;
  return m[1];
}

/** Printify-testikopio (ei perusriviä, ohjataan /kaikki-tuotteet). */
export function onTestikopio(slug) {
  const s = String(slug || "");
  return s.startsWith("copy-of-") || TESTIKOPIOT.has(s);
}

export function onKaksoiskappaleTaiTestikopio(slug) {
  return kaksoiskappaleenPerusslug(slug) !== null || onTestikopio(slug);
}
