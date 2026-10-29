/**
 * Kiinteiden sivujen otsikot, kuvaukset ja H1:t. Yksi lähde React-sivuille (SEOHead) ja
 * build-vaiheen esirenderöinnille, jotta raakaa HTML:ää lukeva botti ja selain näkevät saman.
 *
 * Säännöt: title alle 60 merkkiä, ei ajatusviivoja, ei todistamattomia superlatiiveja.
 */
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "../config/toimitus";
export interface StaticPageMeta {
  title: string;
  description: string;
  h1: string;
  /** Murupolun nimi. */
  name: string;
  intro?: string;
}

export const STATIC_PAGE_META = {
  "/": {
    title: "Hauskat lahjat ja huumorituotteet | Huumorikauppa.fi",
    description:
      `Hauskat t-paidat, hupparit ja muut huumorituotteet suomalaisella huumorilla. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä, ilmainen ${ILMAINEN_RAJA_TEKSTI} eurosta alkaen.`,
    h1: "Hauskat lahjat ja huumorituotteet",
    name: "Etusivu",
    intro:
      `Huumorikauppa on helsinkiläinen verkkokauppa, joka myy hauskoja t-paitoja, huppareita ja muita huumorituotteita. Jokainen tuote painetaan tilauksesta painokumppaneiden painotaloissa. Toimitamme koko Suomeen ${TOIMITUSAIKA_TEKSTI} arkipäivässä, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen toimitus on ilmainen.`,
  },
  "/kaikki-tuotteet": {
    title: "Kaikki hauskat tuotteet | Huumorikauppa.fi",
    description:
      `Selaa kaikki Huumorikaupan tuotteet: hauskat t-paidat, hupparit ja muut huumorilahjat. Ilmainen toimitus ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen.`,
    h1: "Kaikki hauskat tuotteet",
    name: "Kaikki tuotteet",
    intro:
      `Kaikki Huumorikaupan tuotteet yhdellä sivulla. Tuotteet painetaan tilauksesta ja toimitetaan koko Suomeen ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
  },
  "/blogi": {
    title: "Blogi: lahjavinkit ja hauskat ideat | Huumorikauppa.fi",
    description:
      "Huumorikaupan blogi: lahjaideoita, tuotevinkkejä ja huumoria. Hauskat lahjat miehelle, naiselle, kaverille ja työkaverille.",
    h1: "Lahjavinkit ja hauskat ideat",
    name: "Blogi",
    intro: "Lahjaideoita, tuotevinkkejä ja inspiraatiota hauskojen tuotteiden maailmasta.",
  },
  "/usein-kysytyt-kysymykset": {
    title: "Usein kysytyt kysymykset | Huumorikauppa.fi",
    description:
      "Vastaukset kysymyksiin toimituksesta, joulun tilausajasta, palautuksista, maksutavoista ja oman tekstin tilaamisesta Huumorikaupassa.",
    h1: "Usein kysytyt kysymykset",
    name: "Usein kysytyt kysymykset",
    intro: "Lyhyet vastaukset toimituksesta, joulun aikatauluista, palautuksista, maksamisesta ja omasta tekstistä.",
  },
  "/toimitusehdot": {
    title: "Toimitusehdot | Huumorikauppa.fi",
    description:
      `Huumorikaupan toimitusehdot: tilaaminen, hinnat, toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä, toimituskulut ${TOIMITUSMAKSU_TEKSTI} € ja ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin.`,
    h1: "Toimitusehdot ja palautukset",
    name: "Toimitusehdot",
  },
  "/palautusehdot": {
    title: "Palautus- ja peruutusehdot | Huumorikauppa.fi",
    description:
      "Huumorikaupan palautusehdot: 14 päivän peruutusoikeus, palautuksen tekeminen, hyvitykset ja reklamaatiot kuluttajansuojalain mukaan.",
    h1: "Palautus- ja peruutusehdot",
    name: "Palautusehdot",
  },
  "/tietosuojakaytanto": {
    title: "Tietosuojakäytäntö | Huumorikauppa.fi",
    description:
      "Huumorikaupan tietosuojakäytäntö: miten keräämme, käytämme ja suojaamme henkilötietojasi GDPR:n mukaisesti.",
    h1: "Tietosuojakäytäntö",
    name: "Tietosuojakäytäntö",
  },
  "/saavutettavuusseloste": {
    title: "Saavutettavuusseloste | Huumorikauppa.fi",
    description:
      "Huumorikauppa.fi-verkkokaupan saavutettavuusseloste. Sitoudumme WCAG 2.1 AA -tason saavutettavuuteen.",
    h1: "Saavutettavuusseloste",
    name: "Saavutettavuusseloste",
  },
  "/yhteystiedot": {
    title: "Ota yhteyttä | Huumorikauppa.fi",
    description:
      "Ota yhteyttä Huumorikaupan asiakaspalveluun sähköpostilla huumorikauppa@gmail.com. Vastaamme 1-2 arkipäivässä.",
    h1: "Ota yhteyttä",
    name: "Yhteystiedot",
  },
  "/tietoa-meista": {
    title: "Tietoa meistä | Huumorikauppa.fi",
    description:
      "Huumorikauppa on helsinkiläinen verkkokauppa, joka myy hauskoja t-paitoja, huppareita ja muita tuotteita suomalaisella huumorilla.",
    h1: "Tietoa meistä",
    name: "Tietoa meistä",
  },
  "/suomalaiset-tyopaikkameemit-top-50": {
    title: "Suomalaiset työpaikkameemit TOP 50 (2026) | Huumorikauppa",
    description:
      "50 suomalaista työpaikkameemiä: palaverit, kahvihuone, etätyö ja pomon klassikot. Jaa kollegoille ja naura yhdessä.",
    h1: "Suomalaiset työpaikkameemit TOP 50",
    name: "Työpaikkameemit TOP 50",
  },
  "/hauskimmat-tyopaikkalaput-2026": {
    title: "Hauskimmat työpaikkalaput 2026 | Huumorikauppa",
    description:
      "Tulostettavat ja jaettavat työpaikkalaput 2026: pomovitsit, kollegavitsit, palaverit ja kahvikulttuuri. Suomalaista toimistohuumoria.",
    h1: "Hauskimmat työpaikkalaput 2026",
    name: "Työpaikkalaput 2026",
  },
  "/aitienpaiva": {
    title: "Hauskat äitienpäivälahjat äidille 2026 | Huumorikauppa",
    description:
      `Hauskat äitienpäivälahjat 2026: paidat, hupparit ja muut lahjat, jotka äiti muistaa. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä koko Suomeen.`,
    h1: "Hauskat äitienpäivälahjat 2026",
    name: "Äitienpäivälahjat",
  },
  "/yritykset": {
    title: "Yritysten joululahjat ja tiimipaidat | Huumorikauppa",
    description:
      "Yritysten joululahjat ja tiimipaidat: määräalennus 10+ t-paidasta -10 %, 25+ -12 % ja 50+ -14 % automaattisesti kassalla. Toimitus yhteen osoitteeseen.",
    h1: "Yritysten joululahjat ja tiimipaidat",
    name: "Yritykset",
    intro:
      "Huumorikaupan t-paidat ovat yrityksen joululahja tai tiimipaita, joka tulee käyttöön. Kun samassa tilauksessa on vähintään 10 t-paitaa, kassa vähentää määräalennuksen automaattisesti ilman koodia.",
  },
  "/lahjakortti": {
    title: "Lahjakortti: 25, 50 tai 75 € | Huumorikauppa.fi",
    description:
      "Digitaalinen lahjakortti Huumorikauppaan: 25, 50 tai 75 €. Koodi tulee sähköpostiin heti maksun jälkeen, ja saaja valitsee itse paidan tai hupparin.",
    h1: "Lahjakortti",
    name: "Lahjakortti",
    intro:
      "Lahjakortti on digitaalinen: koodi tulee sähköpostiin heti maksun jälkeen, ja voit lähettää sen suoraan saajalle. Saaja kirjoittaa koodin kassalla kenttään Lahjakortin koodi. Lahjakortista ei peritä toimitusmaksua.",
  },
  "/paketit": {
    title: "Paketit: t-paita ja huppari | Huumorikauppa.fi",
    description:
      "Saman tekstin t-paita ja huppari yhdessä paketissa. Valitse koot ja värit, ja lisää molemmat koriin kerralla.",
    h1: "Paketit: t-paita ja huppari samalla tekstillä",
    name: "Paketit",
    intro:
      "Paketissa on saman tekstin t-paita ja huppari. Valitset kummallekin koon ja värin, ja molemmat menevät koriin yhdellä painalluksella.",
  },
  "/ryhmatilaukset": {
    title: "Ryhmätilaukset: paidat porukalle | Huumorikauppa",
    description:
      "Ryhmätilaus pikkujouluihin, kerhoille, seuroille ja työpaikoille, kun tuotteita tilataan viisi tai enemmän. Näin tilaus etenee ja toimitetaan.",
    h1: "Ryhmätilaukset pikkujouluihin, kerhoille ja työpaikoille",
    name: "Ryhmätilaukset",
    intro:
      "Tilaatteko paitoja koko porukalle? Ryhmätilaus sopii pikkujouluihin, kerhoille, urheiluseuroille ja työpaikoille, kun tuotteita tilataan viisi tai enemmän.",
  },
  "/media": {
    title: "Medialle: kuvat ja tiedot toimittajille | Huumorikauppa",
    description:
      "Huumorikaupan mediasivu toimittajille: kaupan tiedot, painokelpoiset tuotekuvat zip-paketteina ja lahjavinkit teemoittain.",
    h1: "Medialle: kuvat, tiedot ja lahjavinkit",
    name: "Medialle",
    intro:
      "Huumorikauppa on kotimainen huumoripaitojen verkkokauppa. Tältä sivulta toimittaja saa kaupan perustiedot, painokelpoiset tuotekuvat ja lahjavinkit teemoittain.",
  },
} satisfies Record<string, StaticPageMeta>;

export type StaticPagePath = keyof typeof STATIC_PAGE_META;

export function getStaticPageMeta(path: StaticPagePath): StaticPageMeta {
  return STATIC_PAGE_META[path];
}
