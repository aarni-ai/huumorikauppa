/**
 * Lahjapaketit (2.11.2026, käsin valitut, sivu /paketit). Korvaa aiemmat 20 generoitua t-paita + huppari -pakettia, joiden
 * alennus oli kokonaan pois käytöstä (kate jäi alle 30 %:n).
 *
 * Säännöt (api/_lib/vakiot.js LAHJAPAKETTI_ALENNUS_PROSENTTI ja PAKETTI_MIN_KATE_EUROA):
 * - Kaksi myynnissä olevaa tuotetta, hinta yhteissumma -5 % (rivikohtainen pyöristys kuten kassa) ja ilmainen toimitus
 *   kahden tuotteen säännöllä.
 * - Paketin nettokate ilmaisella toimituksella vähintään 12 € jokaisella koko- ja väriyhdistelmällä. Tuotannon kuluilla
 *   (2.11.2026) jokaisen paketin heikoin yhdistelmä on 13,72 €; src/test/lahjapaketit.test.ts käy läpi kaikki yhdistelmät.
 * - T-paita + huppari ei täytä rajaa (t-paita 27,90 € + huppari 52,90 € -5 %: pahin yhdistelmä 3,23-6,01 € hupparista
 *   riippuen), joten paketit ovat kahden t-paidan pareja. Kahden 24,90 €:n t-paidan pari jäisi noin 9 €:oon.
 *
 * Kassa (api/checkout.js) ja selain (src/lib/ostoskori.ts) lukevat tämän tiedoston. scripts/generoi-paketit.mjs ei enää
 * kirjoita tätä tiedostoa.
 */
import { LAHJAPAKETTI_ALENNUS_PROSENTTI } from "./vakiot.js";

const PAKETIT = [
  {
    slug: "isan-paketti",
    nimi: "Isän paketti",
    kuvaus: "Kaksi paitaa isälle: korjaaja ja grillaaja samassa paketissa.",
    teema: "isa",
    tuotteet: ["isa-joka-korjaa-kaiken-ensi-viikolla-t-paita-isalle", "isa-joka-grillaa-sateellakin-t-paita-isalle"],
    alennus_prosentti: LAHJAPAKETTI_ALENNUS_PROSENTTI,
  },
  {
    slug: "saunojan-paketti",
    nimi: "Saunojan paketti",
    kuvaus: "Kaksi saunapaitaa: toinen lauteille, toinen löylyjen jälkeen.",
    teema: "sauna",
    tuotteet: ["saunan-jalkeen-kaikki-on-paremmin-t-paita-saunojalle", "kiuas-kuumana-paa-kylmana-t-paita-saunojalle"],
    alennus_prosentti: LAHJAPAKETTI_ALENNUS_PROSENTTI,
  },
  {
    slug: "pikkujoulupari-kahdelle",
    nimi: "Pikkujoulupari kahdelle",
    kuvaus: "Parille tai kaverukselle: toinen muistaa osittain, toinen ajaa kotiin.",
    teema: "pikkujoulu",
    tuotteet: ["pikkujoulut-muistan-osittain-t-paita-pikkujouluihin", "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin"],
    alennus_prosentti: LAHJAPAKETTI_ALENNUS_PROSENTTI,
  },
  {
    slug: "mokkipaketti",
    nimi: "Mökkipaketti",
    kuvaus: "Kaksi paitaa mökkeilijälle: ei kiirettä, ei kenttää, laituri odottaa.",
    teema: "mokki",
    tuotteet: ["mokilla-ei-ole-kiire-eika-kenttaa-t-paita-mokkeilijalle", "laiturilla-istuminen-on-harrastus-t-paita-mokkeilijalle"],
    alennus_prosentti: LAHJAPAKETTI_ALENNUS_PROSENTTI,
  },
  {
    slug: "kalastajan-paketti",
    nimi: "Kalastajan paketti",
    kuvaus: "Kaksi paitaa kalastajalle: iso kala ja loppunut syötti.",
    teema: "kalastus",
    tuotteet: ["kala-oli-tatakin-isompi-t-paita-kalastajalle", "syotti-loppui-kahvi-ei-t-paita-kalastajalle"],
    alennus_prosentti: LAHJAPAKETTI_ALENNUS_PROSENTTI,
  },
  {
    slug: "elakelaisen-paketti",
    nimi: "Eläkeläisen paketti",
    kuvaus: "Kaksi paitaa eläkeläiselle: kello on koru ja jokainen päivä lauantai.",
    teema: "elake",
    tuotteet: ["elakkeella-kello-on-vain-koru-t-paita-elakelaiselle", "elakelainen-kaikki-paivat-ovat-lauantaita-t-paita-elakelaiselle"],
    alennus_prosentti: LAHJAPAKETTI_ALENNUS_PROSENTTI,
  },
];

export default PAKETIT;
