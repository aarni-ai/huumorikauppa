/**
 * Medialle-sivun (/media) sisältö ja kuratoidut tuotelistat. Yksi lähde sivulle (src/pages/MediaPage.tsx),
 * esirenderöinnille (src/seo/prerender/pages.ts) ja zip-skriptille (scripts/media-zip.mjs).
 *
 * Tuotetiedot (nimi, hinta, kuvat) haetaan ajonaikaisesti /api/products-rajapinnasta. Täällä on vain slugit.
 * Slug, jota ei löydy aktiivisista tuotteista, jätetään sivulta ja zipistä pois.
 *
 * UUDEN SARJAN LISÄÄMINEN
 *   1. Lisää alla olevaan SARJAT-taulukkoon yksi rivi: { id, heading, slugs: [ ...6 tuotteen slugit ] }.
 *      id on pieni ASCII-tunnus (esim. "kalastajat"), siitä tulee zipin nimi huumorikauppa-<id>.zip.
 *   2. Aja: node scripts/media-zip.mjs
 *   3. Commitoi tämä tiedosto ja public/media/*.zip. Sivu ja esirenderöinti näyttävät sarjan automaattisesti.
 * Muuta ei tarvitse koskea. Sarjan tuotteet tulevat mukaan myös kaikki-zipiin.
 */

import {
  ILMAINEN_RAJA_TEKSTI,
  TOIMITUSMAKSU_TEKSTI,
} from "../config/toimitus";
import { UUSIKU } from "../config/yritys";
import { jouluLause } from "./tilauspaivat";

export const MEDIA_PATH = "/media";
export const MEDIA_EMAIL = "huumorikauppa@gmail.com";

/** Kuvan koko (px) latauslinkeissä ja zipeissä. Printifyn mockup-osoitteeseen lisätään &s=2048. */
export const MEDIA_KUVAKOKO = 2048;
/** Esikatselukuvan leveys (px) sivulla, kulkee /api/img-välityspalvelun kautta. */
export const MEDIA_ESIKATSELU_LEVEYS = 320;

export interface MediaRyhma {
  /** ASCII-tunnus, zipin nimessä. */
  id: string;
  heading: string;
  intro?: string;
  slugs: string[];
}

/** Myydyimmät ja joulun kärkituotteet, 20 kpl. Myydyimmät: data/uudet-tuotteet/myydyimmat-2026-10-27.json. */
export const KARKITUOTTEET: MediaRyhma = {
  id: "karkituotteet",
  heading: "Myydyimmät ja joulun kärkituotteet",
  intro: "Neljä myydyintä t-paitaa ja joulun suosituimmat tekstit. Jokaisesta tuotteesta on tuotekuva ja tunnelmakuva painokelpoisena.",
  slugs: [
    // Myydyimmät (tilaukset 1.6.2026 alkaen)
    "tonnin-seteli-t-paita",
    "40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita",
    "60v-kokenut-ei-vanha-t-paita",
    "maailman-paras-aiti-t-paita",
    // Joulu
    "joulusaunan-loylymestari-t-paita-jouluun",
    "sammuta-valot-sahko-maksaa-t-paita-isalle",
    "kiltti-enimmakseen-t-paita-jouluun",
    "rauhallista-joulua-paitsi-meilla-t-paita-jouluun",
    "lahjat-ostettu-23-12-klo-17-58-t-paita-jouluun",
    "riisipuurosta-loysin-vain-riisia-t-paita-jouluun",
    "kinkkukooma-alkaa-klo-14-t-paita-jouluun",
    "glogi-ensin-sitten-joulu-t-paita-jouluun",
    "joulupukin-virallinen-testaaja-t-paita-jouluun",
    "piparivaras-ei-todisteita-t-paita-jouluun",
    "tonttu-koeajalla-t-paita-jouluun",
    "joulustressi-en-tunne-t-paita-jouluun",
    "paketointi-ei-ole-vahvuuteni-t-paita-jouluun",
    "laatikkovastaava-t-paita-jouluun",
    "joulukortit-lahtevat-ensi-vuonna-t-paita-jouluun",
    "pikkujoulut-muistan-osittain-t-paita-pikkujouluihin",
  ],
};

/** Lahjavinkit teemoittain: linkit tuotteisiin, ei kuvalatauksia. Muokkaa vapaasti. */
export const LAHJAVINKIT: MediaRyhma[] = [
  {
    id: "remontoijat",
    heading: "Remontoijat",
    slugs: [
      "hauska-t-paita-rakennusmiehelle-kadet-tekee-tulos-nakyy",
      "hauska-t-paita-sahkoasentajalle-ei-kosketa-markana",
      "hauska-t-paita-putkimiehelle-loytaa-aina-lekkauksen",
      "ala-kosketa-sahkomiesta-kun-olet-marka-t-paita",
    ],
  },
  {
    id: "sauna",
    heading: "Sauna ja mökki",
    slugs: [
      "joulusaunan-loylymestari-t-paita-jouluun",
      "hauska-huppari-mokkeilijalle-mokki-on-terapiaa",
      "tyot-loppui-mokki-ei-t-paita-elakelaiselle",
    ],
  },
  {
    id: "kalastus",
    heading: "Kalastus",
    slugs: [
      "hauska-t-paita-kalastajalle-kala-paasi-talla-kertaa",
      "huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-t-paita",
      "huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-huppari",
      "kalamies-t-paita",
    ],
  },
  {
    id: "autot",
    heading: "Autot",
    slugs: [
      "hauska-t-paita-autoharrastajalle-ei-myyda-ei-koskaan",
      "hauska-t-paita-linja-autonkuljettajalle-kuljetan-suomen",
      "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin",
    ],
  },
  {
    id: "elakelaiset",
    heading: "Eläkeläiset",
    slugs: [
      "elakkeella-kello-on-vain-koru-t-paita-elakelaiselle",
      "elakelainen-kaikki-paivat-ovat-lauantaita-t-paita-elakelaiselle",
      "maanantai-on-nyt-vain-sana-t-paita-elakelaiselle",
      "kokenut-elakelainen-neuvoja-ilmaiseksi-t-paita-elakelaiselle",
    ],
  },
  {
    id: "isat-ja-aidit",
    heading: "Isät ja äidit",
    slugs: [
      "sammuta-valot-sahko-maksaa-t-paita-isalle",
      "kuka-koski-termostaattiin-t-paita-isalle",
      "isa-tietaa-oikotien-aina-t-paita-isalle",
      "isavitsien-ammattilainen-t-paita-isalle",
      "maailman-paras-aiti-t-paita",
      "maailman-paras-aiti-palkinnon-voittaja-t-shirt-t-paita",
    ],
  },
];

/**
 * Teemasarjat, joilla on tuotekuvat ja oma zip. Tyhjä, kunnes ensimmäinen sarja valmistuu.
 * Suunnitellut sarjat (kuusi tuotetta kussakin): remontoijat ja rakentajat, kalastajat, metsästäjät,
 * autoilijat ja motoristit, golfaajat, mökkeilijät ja saunojat, maanviljelijät ja metsänomistajat,
 * tekniikka- ja IT-ihmiset. Ohje sarjan lisäämiseen on tiedoston alussa.
 */
export const SARJAT: MediaRyhma[] = [
  { id: "remontoijat", intro: "Kuusi uutta suomenkielistä paitaa, 27,90 €. Sarjan sivu: huumorikauppa.fi/lahjat/remontoijalle", heading: "Remontoijat ja rakentajat", slugs: ["remontti-valmis-ensi-vuonna-t-paita-remontoijalle", "mittaa-kerran-sahaa-kolme-kertaa-t-paita-remontoijalle", "pikkuremontti-kolmas-vuosi-t-paita-remontoijalle", "rautakaupan-kanta-asiakas-t-paita-remontoijalle", "ei-ole-kantava-seina-oli-t-paita-remontoijalle", "vasara-kadessa-kaikki-nayttaa-naulalta-t-paita-remontoijalle"] },
  { id: "kalastajat", intro: "Kuusi uutta suomenkielistä paitaa, 27,90 €. Sarjan sivu: huumorikauppa.fi/lahjat/kalastajalle", heading: "Kalastajat", slugs: ["kala-oli-tatakin-isompi-t-paita-kalastajalle", "pilkilla-ala-soita-t-paita-kalastajalle", "kalastan-siis-valehtelen-t-paita-kalastajalle", "syotti-loppui-kahvi-ei-t-paita-kalastajalle", "tanaan-ei-tullut-huomenna-tulee-t-paita-kalastajalle", "viehelaatikko-on-sijoitus-t-paita-kalastajalle"] },
  { id: "metsastajat", intro: "Kuusi uutta suomenkielistä paitaa, 27,90 €. Sarjan sivu: huumorikauppa.fi/lahjat/metsastajalle", heading: "Metsästäjät", slugs: ["passissa-14-tuntia-hirvi-naki-minut-t-paita-metsastajalle", "metsastysseuran-virallinen-kahvinkeittaja-t-paita-metsastajalle", "koira-loysi-mina-en-t-paita-metsastajalle", "peijaiset-on-kauden-tarkein-osa-t-paita-metsastajalle", "syksy-alkaa-kun-jahti-alkaa-t-paita-metsastajalle", "maastopuku-on-myos-juhlapuku-t-paita-metsastajalle"] },
  { id: "autoilijat", intro: "Kuusi uutta suomenkielistä paitaa, 27,90 €. Sarjan sivu: huumorikauppa.fi/lahjat/autoilijalle", heading: "Autoilijat ja motoristit", slugs: ["viela-yksi-osa-sitten-se-kay-t-paita-autoilijalle", "tallissa-takaisin-kun-se-kay-t-paita-autoilijalle", "oljynvaihto-on-terapiaa-t-paita-autoilijalle", "kesarenkaat-alla-lokakuuhun-asti-t-paita-autoilijalle", "moottoripyora-ei-ole-kriisi-se-on-ratkaisu-t-paita-autoilijalle", "katsastus-meni-lapi-juhlitaan-t-paita-autoilijalle"] },
  { id: "golfaajat", intro: "Kuusi uutta suomenkielistä paitaa, 27,90 €. Sarjan sivu: huumorikauppa.fi/lahjat/golfaajalle", heading: "Golfaajat", slugs: ["pallo-loytyi-ei-ollut-minun-t-paita-golfaajalle", "tasoitus-on-mielentila-t-paita-golfaajalle", "se-yksi-hyva-lyonti-pitaa-minut-taalla-t-paita-golfaajalle", "vesieste-rakastaa-minua-t-paita-golfaajalle", "19-reika-on-minun-vahvuuteni-t-paita-golfaajalle", "mulligan-on-ihmisoikeus-t-paita-golfaajalle"] },
  { id: "mokkeilijat", intro: "Kuusi uutta suomenkielistä paitaa, 27,90 €. Sarjan sivu: huumorikauppa.fi/lahjat/mokkeilijalle", heading: "Mökkeilijät ja saunojat", slugs: ["loylya-lisaa-ei-ole-kuuma-t-paita-mokkeilijalle", "mokilla-ei-ole-kiire-eika-kenttaa-t-paita-mokkeilijalle", "sauna-lampiaa-muut-asiat-odottaa-t-paita-mokkeilijalle", "laiturilla-istuminen-on-harrastus-t-paita-mokkeilijalle", "kantovesi-pitaa-kunnossa-t-paita-mokkeilijalle", "huussi-on-paras-lukunurkkaus-t-paita-mokkeilijalle"] },
  { id: "maanviljelijat", intro: "Kuusi uutta suomenkielistä paitaa, 27,90 €. Sarjan sivu: huumorikauppa.fi/lahjat/maanviljelijalle", heading: "Maanviljelijät ja metsänomistajat", slugs: ["traktori-ei-kysy-vapaapaivia-t-paita-maanviljelijalle", "metsanomistaja-puhun-kuutioista-t-paita-maanviljelijalle", "pelto-kutsuu-soita-illalla-t-paita-maanviljelijalle", "harvennus-tehty-kahvi-ansaittu-t-paita-maanviljelijalle", "sateen-ennustan-polvista-t-paita-maanviljelijalle", "puukaupat-tehdaan-keittion-poydan-aaressa-t-paita-maanviljelijalle"] },
  { id: "it-ihmiset", intro: "Kuusi uutta suomenkielistä paitaa, 27,90 €. Sarjan sivu: huumorikauppa.fi/lahjat/it-ihmiselle", heading: "Tekniikka- ja IT-ihmiset", slugs: ["oletko-kokeillut-sammuttaa-ja-kaynnistaa-t-paita-it-ihmiselle", "toimii-minun-koneellani-t-paita-it-ihmiselle", "perjantaina-ei-julkaista-t-paita-it-ihmiselle", "salasana-vaihdettu-en-muista-t-paita-it-ihmiselle", "kahvi-sisaan-koodia-ulos-t-paita-it-ihmiselle", "sukulaisten-it-tuki-ei-palkkaa-t-paita-it-ihmiselle"] },
];

/** Kaikki ryhmät, joista tehdään zip ja joille sivu näyttää kuvalataukset. */
export const KUVARYHMAT: MediaRyhma[] = [KARKITUOTTEET, ...SARJAT];

export const KAIKKI_ZIP_ID = "kuvat-kaikki";
export const zipPolku = (id: string): string => `/media/huumorikauppa-${id}.zip`;
/**
 * Ryhmän oma zip. Kärkituotteille ei tehdä erillistä pakettia (sama sisältö kuin kaikki-zipissä, ja
 * zipit pidetään yhteensä noin 25 megatavussa), joten ne osoittavat kaikki-zipiin. Sarjoilla on oma zip.
 */
export const ryhmanZip = (r: MediaRyhma): string => (r.id === KARKITUOTTEET.id ? zipPolku(KAIKKI_ZIP_ID) : zipPolku(r.id));

/** Myyjän nimi lasketaan yritystiedoista (src/config/yritys.ts), ei kirjoiteta käsin. */
export const MYYJA_NIMI = UUSIKU.name;

export const MAKSUTAVAT = "Visa, Mastercard, Apple Pay, Google Pay, Klarna ja MobilePay";

/** Kaupan esittely lyhyesti. Toimitusarvot tulevat src/config/toimitus.ts:stä ja joulun päivä tilauspaivat.ts:stä. */
export function mediaKaupanTiedot(nowMs: number = Date.now()): string[] {
  return [
    "Huumorikauppa on kotimainen huumoripaitojen verkkokauppa.",
    `Kauppaa pitää ${MYYJA_NIMI}.`,
    "Jokainen tuote painetaan tilauksesta EU:ssa sijaitsevissa painotaloissa.",
    `Toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} €, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen toimitus on ilmainen.`,
    `Maksutavat: ${MAKSUTAVAT}.`,
    jouluLause(nowMs),
    `Yhteys toimittajille: ${MEDIA_EMAIL}`,
  ];
}

export const MEDIA_INTRO = [
  "Tälle sivulle on koottu toimittajille kaupan perustiedot, painokelpoiset tuotekuvat ja lahjavinkit teemoittain. Kysymykset ja lisäkuvat sähköpostilla.",
];
