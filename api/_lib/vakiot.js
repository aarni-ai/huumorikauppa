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
 * Ilmainen toimitus kahdesta tuotteesta (2.11.2026, KATTEET.md "Ilmainen toimitus kahdesta tuotteesta"): kun tilauksessa
 * on vähintään ILMAINEN_TOIMITUS_KPL tuotetta (tarrat eivät lasketa, lahjakortit eivät lasketa), toimitus on ilmainen.
 * Ei yhdisty alennuskoodiin eikä t-paitaparin kampanjahintaan: niissä toimitus kuten ennen (ilmainen rajasta alkaen).
 * Kahden t-paidan kori jää ilmaisella toimituksella ja -5 %:lla 13,71 € katteelle (heikoin koko 11,65 €). Lahjapaketit
 * (api/_lib/paketit-data.js, 2.11.2026) saavat ilmaisen toimituksen, koska jokaisen paketin kate on ilmaisella
 * toimituksella ja pakettialennuksella vähintään PAKETTI_MIN_KATE_EUROA kaikilla koko- ja väriyhdistelmillä.
 */
export const ILMAINEN_TOIMITUS_KPL = 2;

/** Tilauksen toimitusmaksu: summa ennen alennuksia, kpl = tuotteet ilman tarroja ja lahjakortteja. */
export function toimitusmaksu({ summa, kpl, alennus = false }) {
  if (!(kpl > 0) && !(summa > 0)) return 0;
  if (summa >= ILMAINEN_TOIMITUS_RAJA) return 0;
  if (!alennus && kpl >= ILMAINEN_TOIMITUS_KPL) return 0;
  return TOIMITUS;
}

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
 * Alennuskoodi, pakettialennus ja kahden tuotteen alennus annetaan vain, jos raja täyttyy. Määräalennuksessa (10+
 * t-paitaa), ensimmäisen tilauksen alennuksessa ja TERVE-koodissa raja on 7 € jokaista tilauksen kappaletta kohden
 * (api/_lib/katesaanto.js, 4.11.2026).
 */
export const TILAUKSEN_MIN_KATE_EUROA = 7;

/**
 * Lahjapaketit (2.11.2026, api/_lib/paketit-data.js, sivu /paketit): kaksi valmiiksi valittua tuotetta, hinta yhteissumma
 * -LAHJAPAKETTI_ALENNUS_PROSENTTI (rivikohtainen pyöristys sentteinä kuten kassa) ja ilmainen toimitus kahden tuotteen
 * säännöllä. Palvelin (api/_lib/paketit.js sovellaPaketit) antaa alennuksen vain, jos paketin nettokate ilmaisella
 * toimituksella on vähintään PAKETTI_MIN_KATE_EUROA valitulla koko- ja väriyhdistelmällä; src/test/lahjapaketit.test.ts
 * käy läpi jokaisen yhdistelmän tuotannon kuluilla (2.11.2026), joten raja täyttyy kaikilla.
 */
export const LAHJAPAKETTI_ALENNUS_PROSENTTI = 5;
export const PAKETTI_MIN_KATE_EUROA = 12;

/**
 * Kampanjakalenteri 2026 (päivät Suomen aikaa, alku ja loppu mukaan lukien). Vaiheet ja etusivun nostot kootaan
 * tiedostossa src/data/kampanjat.ts näistä ja joulun tilauspäivistä (src/data/campaignSchedule.ts). Black Friday -viikko
 * on sama päivämäärä selaimessa ja kassalla (TPAITAPARI_KAMPANJA, api/_lib/korialennus.js tpaitapariVoimassa).
 */
export const KAMPANJAPAIVAT = {
  isanpaiva: { alku: "2026-10-01", loppu: "2026-11-08" },
  blackFriday: { alku: "2026-11-23", loppu: "2026-11-30" },
  /** Lahjakorttinosto päättyy jouluaattoon. */
  lahjakorttiLoppu: "2026-12-24",
  /**
   * Joulukalenteri /joulukalenteri (4.11.2026, api/_lib/joulukalenteri.js): luukku päivässä alku-loppu, ennakkonosto
   * (banneri ja etusivu) esittely-päivästä alkaen. Kulkee muiden vaiheiden rinnalla (src/data/kampanjat.ts).
   */
  joulukalenteri: { esittely: "2026-11-16", alku: "2026-12-01", loppu: "2026-12-24" },
};

/** Kategoriat, joita myydään vain toisen tuotteen lisänä (tarra yksin jättäisi katetta alle 5 €). */
export const LISATUOTE_KATEGORIAT = ["tarrat"];

/**
 * Printifyn ALV (KATTEET.md "Printifyn ALV" ja "ALV-varasuunnitelma 30.10.2026"). true = Uusiku Oy vähentää Printifyn
 * perimän 25,5 %:n ALV:n (katteet ilman ALV:tä, hinnasto HINNASTOT.perus). Jos kirjanpitäjä toteaa, ettei ALV ole
 * vähennettävissä, aseta false ja julkaise: kate lasketaan Printify-kulu x 1,255 (api/_lib/kate.js) ja hinnasto vaihtuu
 * HINNASTOT.alvKulu:un. Black Friday -pari ja määräalennus seuraavat hinnastoa; 30 päivän alin hinta pysyy 24,90 €:ssa,
 * koska kampanjaa edeltäneiden 30 päivän aikana (24.10.-22.11.) paita on maksanut 24,90 € (KSL 2:6 a §).
 */
export const PRINTIFY_ALV_VAHENNETTAVA = true;

/**
 * Hinnastot (api/_lib/kokohinnat.js, api/_lib/personoitu.js). perus: hinnoittelu 29.10.2026. alvKulu: jokaisen variantin
 * nettokate vähintään 7 €, kun Printifyn ALV on kulu (tarkistettu tuotannon kuluilla ?tehtava=katetaulu&alv=1).
 *
 * Personoidut lahjat (2.11.2026, api/_lib/personoitu.js): personoitu = t-paita (Gildan 64000, OPT OnDemand),
 * personoituHuppari = huppari (Gildan 18500, Atelier Katanga), iso = 3XL-5XL. Jokaisen variantin nettokate on
 * vähintään 10 € yhden tuotteen tilauksessa toimitusmaksulla (src/test/personoidut.test.ts). Hupparin 3XL+ kulu on
 * 31,17 € + toimitus 10,89 €: 59,90 €:lla kate jäisi 9,91 €:oon, joten 3XL+ on 60,90 €. logopaita = Oma logo -paita
 * (ennen sama kuin personoitu, 29,90 €).
 *
 * Ryhmäpaidat (2.11.2026, api/_lib/ryhmatilaus.js, sivut /abipaidat, /polttarit, /joukkueet ja /yhdistykset): t-paita
 * (Gildan 64000, OPT OnDemand), etupuolelle ryhmän nimi, vuosi ja teksti tai logo, selkään jäsenen nimi. Kappalehinta
 * tilauksen paitamäärän mukaan (portaat [vähintään kpl, hinta]), 3XL-5XL + isoLisa. Jokaisen paidan nettokate on
 * vähintään 9 € kaikilla määrillä 5-100 ja jokaisella koko- ja väriyhdistelmällä (src/test/ryhmatilaus.test.ts).
 */
export const HINNASTOT = {
  perus: {
    tpaita: { suora: 24.9, suoraIso: 28.9, uniikki: 27.9, uniikkiIso: 29.9 },
    hupparit: { perus: 52.9, iso: 59.9 },
    kategoriat: { seinataulut: 24.9, koristeet: 22.9 },
    personoitu: 32.9,
    personoituHuppari: { perus: 57.9, iso: 60.9 },
    logopaita: 29.9,
    tpaitapari: 44.9,
    ryhmapaita: { portaat: [[50, 33.9], [25, 34.9], [10, 35.9], [5, 37.9]], isoLisa: 2 },
  },
  // Laskettu 30.10.2026: heikoin variantti 7 € + pyöristys ylöspäin x,90:een (KATTEET.md "ALV-varasuunnitelma").
  alvKulu: {
    tpaita: { suora: 30.9, suoraIso: 34.9, uniikki: 31.9, uniikkiIso: 35.9 },
    hupparit: { perus: 65.9, iso: 72.9 },
    kategoriat: { seinataulut: 28.9, koristeet: 27.9 },
    // Personoidut 2.11.2026: heikoin variantti 10 € Printify-kulu x 1,255:llä.
    personoitu: 35.9,
    personoituHuppari: { perus: 62.9, iso: 73.9 },
    logopaita: 32.9,
    tpaitapari: 49.9,
    ryhmapaita: { portaat: [[50, 39.9], [25, 40.9], [10, 41.9], [5, 43.9]], isoLisa: 2 },
  },
};
export const HINNASTO = PRINTIFY_ALV_VAHENNETTAVA ? HINNASTOT.perus : HINNASTOT.alvKulu;

/**
 * Black Friday 2026 (KATTEET.md "Black Friday ja joulu 2026" ja "Black Friday -viikko 23.-30.11.2026"): "Kaksi t-paitaa
 * 44,90 €". Aarni hyväksyi 29.10.2026; laskeutumissivu /black-friday. Päivät kampanjakalenterista (KAMPANJAPAIVAT, 2.11.2026:
 * Black Friday -viikko ma 23.11. - ma 30.11., aiemmin 27.11.-1.12.). Voimassa vain alku-loppu Suomen aikaa. Koskee t-paitoja,
 * joiden kappalehinta on 24,90 €; korvaa kahden tuotteen -5 %:n, kun pari on asiakkaalle edullisempi (ei molempia).
 * Katevahti kuten korialennuksessa. Laajempi "-10 % kahdesta tuotteesta" hylättiin: pahin kahden tuotteen tilaus jäisi
 * tappiolle (src/test/kampanjat.test.ts). Kuluttajansuojalaki 2:6 a §: markkinoinnissa kerrotaan t-paidan 30 päivän alin
 * hinta (alinHinta30pv). Kampanjaa edeltäneet 30 päivää (24.10.-22.11.) paita on maksanut 24,90 €. Ei ennen-hintoja.
 */
export const TPAITAPARI_KAMPANJA = {
  // Hyväksytty 29.10.2026. Hinta 24,90 € todennettu (hintatarkistus, KASVU-RAPORTTI.md 29.10.2026 iltapäivä).
  kaytossa: true,
  alku: KAMPANJAPAIVAT.blackFriday.alku,
  loppu: KAMPANJAPAIVAT.blackFriday.loppu,
  kategoria: "t-paidat",
  kappalehinta: HINNASTO.tpaita.suora,
  parihinta: HINNASTO.tpaitapari,
  alinHinta30pv: 24.9,
};

/**
 * Ensitilauksen alennus uutiskirjeen tilaajalle (prosenttia, 0 = pois käytöstä). 2.11.2026: 5 % (TERVE-koodi, yksi per
 * osoite, vain ensimmäiseen maksettuun tilaukseen samalla osoitteella). Katesääntö on sama kuin muilla koodeilla:
 * kassa hylkää koodin, jos tilauksen nettokate jäisi alle TILAUKSEN_MIN_KATE_EUROA (7 €, api/_lib/kassa.js). Esimerkit
 * (t-paidan kulu 8,90 €, Printifyn toimitus 8,49 €, asiakas maksaa toimitusmaksun): yksi 24,90 €:n t-paita 6,25 € (hylätään),
 * yksi 27,90 €:n t-paita 8,48 €, kaksi 24,90 €:n t-paitaa 14,65 €, huppari 2,85 € (hylätään).
 * Aiempi 30 %:n katteen raja (ALENNUS_KATE_RAJA) ei enää koske ensitilauksen koodia (omistajan ohje 2.11.2026: 7 €).
 * 4.11.2026: lisäksi vähintään 7 € jokaista tilauksen kappaletta kohden (api/_lib/katesaanto.js; kaksi 24,90 €:n t-paitaa
 * 14,65 € = 7,33 €/kpl käy). Sama prosentti on ensimmäisen tilauksen A/B-testin alennus (api/_lib/ensitilaus.js); niitä
 * ei yhdistetä, joten tilauksessa on enintään yksi 5 %:n ensitilausalennus.
 */
export const ENSITILAUS_ALENNUS_PROSENTTI = 5;

/** Suostumustekstit: sama teksti näytetään lomakkeella ja tallennetaan suostumuksen kanssa. */
export const SUOSTUMUS_UUTISKIRJE =
  "Haluan Huumorikaupan uutiskirjeen sähköpostiini. Voin perua tilauksen milloin tahansa jokaisen viestin lopussa olevalla linkillä.";
export const SUOSTUMUS_MUISTUTUS = "Lähetä minulle muistutus, jos tilaus jää kesken.";

/**
 * Määräalennus yrityksille ja ryhmille (KATTEET.md "Määräalennus yrityksille", sivu /yritykset): kaikki t-paidat
 * (24,90 € ja 27,90 €, kappalehinta = edullisin hinta esimerkeissä) samassa tilauksessa, toimitus yhteen osoitteeseen.
 * Korvaa kahden tuotteen alennuksen ja t-paitaparin, kun se on suurempi.
 *
 * Katesääntö (omistajan päätös 4.11.2026, sama kuin tarjouksissa 3.11.2026): porras annetaan vain, jos tilauksen
 * nettokate alennuksen jälkeen on vähintään minKatePerKpl (7 €) jokaista tilauksen kappaletta kohden; muuten suurin
 * porras, jolla raja täyttyy, tai ei määräalennusta (api/_lib/katesaanto.js suurinSallittuAlennus). Esimerkki
 * (24,90 €:n meemipaita, OPT 8,90 € + toimitus 8,49 € + 1,19 €/kpl): 10 kpl -10 % jättäisi 6,68 €/kpl, joten
 * määräalennusta ei anneta; 25 kpl ja 50 kpl saavat -10 % (-12 % ja -14 % jäisivät alle 7 €/kpl). 27,90 €:n
 * t-paidat saavat kaikki portaat. Aiemmin raja oli 5 € paitaa kohden.
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
  minKatePerKpl: TILAUKSEN_MIN_KATE_EUROA,
};

/**
 * Kumppanuusohjelma (KATTEET.md "Kumppanuusohjelma"): kumppanisivu /k/<koodi> (vanha ?ref=<koodi> toimii yhä) tai kumppanikoodi kassalla.
 * Hyväksytty 29.10.2026 ehdolla: kauppaan jää jokaisesta kumppanitilauksesta vähintään 7,00 € katetta provision
 * jälkeen (raja nostettu 5,00 €:sta 29.10.2026). Provisio enintään 10 % tuotteiden arvosta ilman ALV:tä ja toimitusta (api/_lib/kumppani.js).
 * Kumppanit taulussa kumppanit (?tehtava=kumppani-lisaa); KUMPPANIT on varalista.
 */
export const KUMPPANUUS = {
  kaytossa: true,
  provisioProsentti: 10,
  minKateEuroa: 7,
  /**
   * Malli 2 (31.10.2026): kumppanin koodilla ostaja saa alennusProsentti alennuksen tuotteista ja kumppani
   * provisioProsentti provision tuotteiden arvosta ilman ALV:tä ja toimitusta. Jos kauppaan ei jäisi minKateEuroa,
   * molemmat pienenevät prosenttiyksikkö kerrallaan tai poistuvat (api/_lib/kumppani.js valitseKumppaniAlennus).
   */
  alennusmalli: { alennusProsentti: 5, provisioProsentti: 5 },
};

/** Hyväksytyt kumppanit: koodi (pienet kirjaimet, numerot ja väliviiva) -> nimi. Lisää vasta sopimuksen jälkeen. */
export const KUMPPANIT = {};
