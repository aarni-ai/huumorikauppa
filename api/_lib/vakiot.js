/**
 * Kassan vakiot ilman riippuvuuksia (selain ja palvelin käyttävät samoja). api/_lib/kassa.js vie nämä edelleen.
 */
export const ILMAINEN_TOIMITUS_RAJA = 60;
export const TOIMITUS = 5.9;

/**
 * Ensitilauksen alennus uutiskirjeen tilaajalle (prosenttia, 0 = pois käytöstä). Asetetaan niin, että tyypillisen
 * tilauksen (yksi t-paita, asiakas maksaa toimitusmaksun) kate pysyy alennuksen jälkeen vähintään 30 %
 * (api/_lib/kate.js ALENNUS_KATE_RAJA). 26.10.2026 kuluilla (t-paita 24,90 €, tuotekulu 8,90 €, toimitus 8,49 €) kate on
 * jo ilman alennusta 26,2 %, joten koodi on pois käytöstä. 5 %:n koodi vaatii t-paidan hinnaksi vähintään 28,90 € ja
 * 10 %:n koodi 29,90 € (tuotekululla 9,93 €: 30,90 € ja 31,90 €). Kassa tarkistaa lisäksi jokaisen tilauksen katteen
 * alennuksen jälkeen (api/_lib/kassa.js).
 */
export const ENSITILAUS_ALENNUS_PROSENTTI = 0;

/** Suostumustekstit: sama teksti näytetään lomakkeella ja tallennetaan suostumuksen kanssa. */
export const SUOSTUMUS_UUTISKIRJE =
  "Haluan Huumorikaupan uutiskirjeen sähköpostiini. Voin perua tilauksen milloin tahansa jokaisen viestin lopussa olevalla linkillä.";
export const SUOSTUMUS_MUISTUTUS = "Lähetä minulle muistutus, jos tilaus jää kesken.";
