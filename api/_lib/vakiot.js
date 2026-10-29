/**
 * Kassan vakiot ilman riippuvuuksia (selain ja palvelin käyttävät samoja). api/_lib/kassa.js vie nämä edelleen.
 */
/**
 * Toimitusmaksu ja ilmaisen toimituksen raja (27.10.2026: samat kuin live-kaupassa). Aiempi oman taustan
 * suunnitelma (pienempi maksu, raja 60 euroa) hylättiin: t-paita + huppari (Textildruck) jäisi ilmaisella toimituksella
 * tappiolliseksi ja odotettu kate kuukaudessa laskisi (KATTEET.md, "Keskiostoksen nosto: laskelma").
 */
export const ILMAINEN_TOIMITUS_RAJA = 79;
export const TOIMITUS = 6.9;

/**
 * Kahden tuotteen alennus (korialennus): kun korissa on vähintään KORIALENNUS_MIN_KPL fyysistä tuotetta eikä
 * alennuskoodia käytetä, palvelin (api/_lib/korialennus.js) alentaa pakettiin kuulumattomia rivejä
 * KORIALENNUS_PROSENTTI prosenttia. Alennus jätetään antamatta, jos tilauksen nettokate alennuksen jälkeen olisi alle
 * KORIALENNUS_MIN_KATE_EUROA (katevahti; 0 = ei koskaan tappiollista tilausta). -10 % hylättiin: kaksi hupparia ja
 * t-paita + Textildruck-huppari jäisivät tappiolle (KATTEET.md). 0 = pois käytöstä.
 */
export const KORIALENNUS_PROSENTTI = 5;
export const KORIALENNUS_MIN_KPL = 2;
export const KORIALENNUS_MIN_KATE_EUROA = 0;

/**
 * Black Friday ja joulu 2026 (KATTEET.md "Black Friday ja joulu 2026"): "Kaksi t-paitaa 44,90 €". Aarni hyväksyi
 * 29.10.2026; laskeutumissivu /black-friday. Voimassa vain alku-loppu Suomen aikaa. Koskee t-paitoja, joiden kappalehinta
 * on 24,90 €; korvaa kahden tuotteen -5 %:n, kun pari on asiakkaalle edullisempi (ei molempia). Katevahti kuten
 * korialennuksessa. Kuluttajansuojalaki 2:6 a §: markkinoinnissa kerrotaan t-paidan 30 päivän alin hinta
 * (alinHinta30pv); tarkista se ennen käyttöönottoa. Ei ennen-hintoja.
 */
export const TPAITAPARI_KAMPANJA = {
  // Hyväksytty 29.10.2026. Hinta 24,90 € todennettu (hintatarkistus, KASVU-RAPORTTI.md 29.10.2026 iltapäivä).
  kaytossa: true,
  alku: "2026-11-27",
  loppu: "2026-12-01",
  kategoria: "t-paidat",
  kappalehinta: 24.9,
  parihinta: 44.9,
  alinHinta30pv: 24.9,
};

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
