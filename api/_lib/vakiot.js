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
 * KORIALENNUS_MIN_KATE_EUROA (katevahti, 7 € 29.10.2026 alkaen). -10 % hylättiin: kaksi hupparia ja
 * t-paita + Textildruck-huppari jäisivät tappiolle (KATTEET.md). 0 = pois käytöstä.
 */
export const KORIALENNUS_PROSENTTI = 5;
export const KORIALENNUS_MIN_KPL = 2;
export const KORIALENNUS_MIN_KATE_EUROA = 7;

/**
 * Tilauksen vähimmäiskate (Aarnin päätös 29.10.2026, KATTEET.md "Hinnoittelu 29.10.2026"): jokaisesta tavallisesta
 * tilauksesta jää kaikkien kulujen jälkeen (Printify ilman ALV:tä, Stripe, provisio, alennukset) vähintään 7,00 €.
 * Alennuskoodi, pakettialennus ja kahden tuotteen alennus annetaan vain, jos raja täyttyy. Yritystilauksissa (10+
 * t-paitaa) raja on MAARAALENNUS.minKatePerPaita paitaa kohden.
 */
export const TILAUKSEN_MIN_KATE_EUROA = 7;

/** Kategoriat, joita myydään vain toisen tuotteen lisänä (tarra yksin jättäisi katetta alle 5 €). */
export const LISATUOTE_KATEGORIAT = ["tarrat"];

/**
 * Printifyn ALV (KATTEET.md "Printifyn ALV" ja "ALV-varasuunnitelma 30.10.2026"). true = Uusiku Oy vähentää Printifyn
 * perimän 25,5 %:n ALV:n (katteet ilman ALV:tä, hinnasto HINNASTOT.perus). Jos kirjanpitäjä toteaa, ettei ALV ole
 * vähennettävissä, aseta false ja julkaise: kate lasketaan Printify-kulu x 1,255 (api/_lib/kate.js) ja hinnasto vaihtuu
 * HINNASTOT.alvKulu:un. Black Friday -pari ja määräalennus seuraavat hinnastoa; 30 päivän alin hinta pysyy 24,90 €:ssa,
 * koska kampanjaa edeltäneiden 30 päivän aikana (28.10.-26.11.) paita on maksanut 24,90 € (KSL 2:6 a §).
 */
export const PRINTIFY_ALV_VAHENNETTAVA = true;

/**
 * Hinnastot (api/_lib/kokohinnat.js, api/_lib/personoitu.js). perus: hinnoittelu 29.10.2026. alvKulu: jokaisen variantin
 * nettokate vähintään 7 €, kun Printifyn ALV on kulu (tarkistettu tuotannon kuluilla ?tehtava=katetaulu&alv=1).
 */
export const HINNASTOT = {
  perus: {
    tpaita: { suora: 24.9, suoraIso: 28.9, uniikki: 27.9, uniikkiIso: 29.9 },
    hupparit: { perus: 52.9, iso: 59.9 },
    kategoriat: { seinataulut: 24.9, koristeet: 22.9 },
    personoitu: 29.9,
    tpaitapari: 44.9,
  },
  // Laskettu 30.10.2026: heikoin variantti 7 € + pyöristys ylöspäin x,90:een (KATTEET.md "ALV-varasuunnitelma").
  alvKulu: {
    tpaita: { suora: 30.9, suoraIso: 34.9, uniikki: 31.9, uniikkiIso: 35.9 },
    hupparit: { perus: 65.9, iso: 72.9 },
    kategoriat: { seinataulut: 28.9, koristeet: 27.9 },
    personoitu: 32.9,
    tpaitapari: 49.9,
  },
};
export const HINNASTO = PRINTIFY_ALV_VAHENNETTAVA ? HINNASTOT.perus : HINNASTOT.alvKulu;

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
  kappalehinta: HINNASTO.tpaita.suora,
  parihinta: HINNASTO.tpaitapari,
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

/**
 * Määräalennus yrityksille ja ryhmille (KATTEET.md "Määräalennus yrityksille", sivu /yritykset): kaikki t-paidat
 * (24,90 € ja 27,90 €, kappalehinta = edullisin hinta esimerkeissä) samassa tilauksessa, toimitus yhteen osoitteeseen.
 * Katevahti pitää katteen vähintään 5 € paitaa kohden. Korvaa kahden tuotteen alennuksen ja t-paitaparin, kun se on
 * suurempi.
 */
export const MAARAALENNUS = {
  kaytossa: true,
  kategoria: "t-paidat",
  kappalehinta: HINNASTO.tpaita.suora,
  portaat: [
    { min: 50, prosentti: 14 },
    { min: 25, prosentti: 12 },
    { min: 10, prosentti: 10 },
  ],
  minKatePerPaita: 5,
};

/**
 * Kumppanuusohjelma (KATTEET.md "Kumppanuusohjelma"): kumppanilinkki ?ref=<koodi> tai kumppanikoodi kassalla.
 * Hyväksytty 29.10.2026 ehdolla: kauppaan jää jokaisesta kumppanitilauksesta vähintään 7,00 € katetta provision
 * jälkeen (raja nostettu 5,00 €:sta 29.10.2026). Provisio enintään 10 % tuotteiden arvosta ilman ALV:tä ja toimitusta (api/_lib/kumppani.js).
 * Kumppanit taulussa kumppanit (?tehtava=kumppani-lisaa); KUMPPANIT on varalista.
 */
export const KUMPPANUUS = {
  kaytossa: true,
  provisioProsentti: 10,
  minKateEuroa: 7,
};

/** Hyväksytyt kumppanit: koodi (pienet kirjaimet, numerot ja väliviiva) -> nimi. Lisää vasta sopimuksen jälkeen. */
export const KUMPPANIT = {};
