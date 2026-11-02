/**
 * Ryhmäpaidat (2.11.2026): /abipaidat, /polttarit, /joukkueet ja /yhdistykset. Sisältö React-sivulle
 * (src/pages/RyhmaPaitaPage.tsx) ja esirenderöinnille (src/seo/prerender/pages.ts). Hinnat, säännöt ja rajat tulevat
 * api/_lib/ryhmatilaus.js:stä ja toimitusajat src/config/toimitus.ts:stä, joten tekstit pysyvät samoina kuin kassa.
 *
 * Tekstisäännöt: ei ajatusviivoja, ei epävarmuutta eikä todistamattomia väitteitä (src/test/ryhmatilaus.test.ts).
 */
import { TOIMITUSAJAT_TYYPEITTAIN, euroluku } from "../config/toimitus";
import { STATIC_PAGE_META } from "../seo/staticPageMeta";
import {
  RYHMA_MIN_KPL, RYHMA_MAX_KPL, RYHMA_HINNASTO, SELKA_NIMI_MAX, RYHMA_NIMI_MAX, hintaportaat,
} from "../../api/_lib/ryhmatilaus.js";

export type RyhmaTyyppi = "abi" | "polttarit" | "joukkue" | "yhdistys";
export type RyhmaPolku = "/abipaidat" | "/polttarit" | "/joukkueet" | "/yhdistykset";
type Faq = { q: string; a: string };

const e = (x: number) => `${euroluku(x).includes(",") ? euroluku(x) : `${euroluku(x)},00`} €`;
const [TOIMITUS_MIN, TOIMITUS_MAX] = TOIMITUSAJAT_TYYPEITTAIN["t-paidat"];
export const RYHMA_TOIMITUSAIKA = `${TOIMITUS_MIN}-${TOIMITUS_MAX}`;

/** Hintaportaat tekstinä: "5-9 paitaa 37,90 €" jne. */
export const RYHMA_PORTAAT = hintaportaat().map((p: { min: number; max: number | null; hinta: number; isoHinta: number }) => ({
  ...p,
  teksti: p.max ? `${p.min}-${p.max} paitaa` : `${p.min} paitaa tai enemmän`,
  hintaTeksti: e(p.hinta),
  isoTeksti: e(p.isoHinta),
}));
const PERUS = RYHMA_PORTAAT[0];
const HALVIN = RYHMA_PORTAAT[RYHMA_PORTAAT.length - 1];
const luettelo = (osat: string[]) => (osat.length > 1 ? `${osat.slice(0, -1).join(", ")} ja ${osat[osat.length - 1]}` : osat.join(""));
export const RYHMA_HINTALAUSE = `T-paita maksaa ${PERUS.hintaTeksti}, kun paitoja on ${PERUS.min}-${PERUS.max}. Määräalennuksella hinta on ${luettelo(RYHMA_PORTAAT.slice(1).map((p) => `${p.min} paidasta ${p.hintaTeksti}`))}. Koot 3XL-5XL maksavat ${e(RYHMA_HINNASTO.isoLisa)} enemmän, ja toimitus vetäjän osoitteeseen sisältyy hintaan.`;
export const RYHMA_HINTA_ALKAEN = HALVIN.hintaTeksti;

/** Maksu- ja lukitussääntö (sama kuin api/_lib/ryhmatilaus.js RYHMA_SAANTO). */
export const RYHMA_SAANNOT = [
  `Vetäjä valitsee maksutavan: vetäjä maksaa kaikki paidat kerralla, tai jokainen maksaa oman paitansa jaetusta linkistä.`,
  `Kun jokainen maksaa itse, tilaus lähtee painoon automaattisesti heti, kun kokotaulukon kaikki paikat on maksettu.`,
  `Vetäjä voi lukita tilauksen aiemmin. Silloin maksamattomat rivit jäävät pois, tai vetäjä maksaa niiden paidat lukituksen yhteydessä.`,
  `Jäsen maksaa ensin ${PERUS.min}-${PERUS.max} paidan hinnan. Kun tilaus lähtee painoon, hinta lasketaan lopullisesta paitamäärästä, ja erotus palautetaan maksukortille.`,
  `Tilauksessa on vähintään ${RYHMA_MIN_KPL} ja enintään ${RYHMA_MAX_KPL} paitaa.`,
];

// ── Abipaitojen aikataulu ──────────────────────────────────────────────────────────────────────────────────────────

/** Penkkarit 2027 (helmikuun puoliväli, torstai) ja varmuusväli: paidat perillä kaksi viikkoa ennen. */
export const PENKKARIT_2027 = "2027-02-18";
export const ABI_VARMUUS_ARKIPAIVAA = 10;

/** Päivä n arkipäivää ennen annettua päivää (lauantai ja sunnuntai ohitetaan). */
export function arkipaiviaTaaksepain(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  let jaljella = n;
  while (jaljella > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    const vp = d.getUTCDay();
    if (vp !== 0 && vp !== 6) jaljella -= 1;
  }
  return d.toISOString().slice(0, 10);
}

const VIIKONPAIVAT = ["su", "ma", "ti", "ke", "to", "pe", "la"];
/** "2027-01-14" -> "to 14.1.2027" */
export function paivaTeksti(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${VIIKONPAIVAT[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.${d.getUTCFullYear()}`;
}

/** Paidat perillä viimeistään (kaksi viikkoa ennen penkkareita). */
export const ABI_PERILLA_VIIMEISTAAN = arkipaiviaTaaksepain(PENKKARIT_2027, ABI_VARMUUS_ARKIPAIVAA);
/** Viimeinen lukituspäivä: toimitusajan yläraja (t-paidat) ennen perilläpäivää. */
export const ABI_VIIMEINEN_TILAUSPAIVA = arkipaiviaTaaksepain(ABI_PERILLA_VIIMEISTAAN, TOIMITUS_MAX);
export const ABI_AIKATAULU = `Lukitkaa abipaitojen tilaus viimeistään ${paivaTeksti(ABI_VIIMEINEN_TILAUSPAIVA)}. Paidat ovat perillä enintään ${TOIMITUS_MAX} arkipäivässä, eli viimeistään ${paivaTeksti(ABI_PERILLA_VIIMEISTAAN)}, kaksi viikkoa ennen penkkareita ${paivaTeksti(PENKKARIT_2027)}.`;

// ── Sivut ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface RyhmaSivu {
  tyyppi: RyhmaTyyppi;
  path: RyhmaPolku;
  title: string;
  description: string;
  h1: string;
  name: string;
  intro: string[];
  /** Suunnittelutyökalun oletukset. */
  esimerkki: { nimi: string; vuosi: string; teksti: string; jasenet: string[] };
  sections: { heading: string; paragraphs: string[]; items?: string[] }[];
  faqs: Faq[];
  /** Abipaidoilla: viimeinen lukituspäivä ja ryhmän takaraja. */
  takaraja?: string;
}

const yhteisetFaqs = (paita: string): Faq[] => [
  { q: `Paljonko ${paita} maksaa?`, a: RYHMA_HINTALAUSE },
  {
    q: "Miten kokotaulukko toimii?",
    a: "Vetäjä luo ryhmän ja jakaa jäsenlinkin, ja jokainen kirjoittaa siihen oman selkänimensä ja kokonsa. Vetäjä näkee koot, nimet ja maksut omalla hallintasivullaan, jonka linkki on eri kuin jäsenten linkki.",
  },
  { q: "Kuka paidat maksaa?", a: `${RYHMA_SAANNOT[0]} Maksu tehdään Stripen suojatulla kassalla.` },
  { q: "Mitä tapahtuu, jos kaikki eivät maksa?", a: `${RYHMA_SAANNOT[2]} ${RYHMA_SAANNOT[1]}` },
  { q: "Mitä selkään voi kirjoittaa?", a: `Selkään painetaan jäsenen nimi tai lempinimi, enintään ${SELKA_NIMI_MAX} merkkiä, ja halutessa numero 0-99. Kirosanoja, tuotemerkkejä ja tunnettujen joukkueiden nimiä ei paineta.` },
  { q: "Kauanko toimitus kestää?", a: `Paidat ovat perillä ${RYHMA_TOIMITUSAIKA} arkipäivässä siitä, kun tilaus lähtee painoon. Kaikki paidat toimitetaan vetäjän osoitteeseen.` },
  { q: "Voiko omalla nimellä painetun paidan palauttaa?", a: "Omalla nimellä painetulla paidalla ei ole 14 päivän palautusoikeutta, koska se tehdään yhdelle ihmiselle. Tarkistakaa nimet ja koot kokotaulukosta ennen lukitusta." },
];

export const RYHMA_SIVUT: Record<RyhmaPolku, RyhmaSivu> = {
  "/abipaidat": {
    tyyppi: "abi",
    path: "/abipaidat",
    ...STATIC_PAGE_META["/abipaidat"],
    intro: [
      STATIC_PAGE_META["/abipaidat"].intro,
      `Etupuolelle tulee abiporukan nimi, vuosiluku ja oma teksti tai logo, ja jokaisen selkään oma nimi tai lempinimi. ${ABI_AIKATAULU}`,
    ],
    esimerkki: { nimi: "Abit", vuosi: "2027", teksti: "Viimeinen päivä koulussa", jasenet: ["Aino", "Eetu", "Iida"] },
    takaraja: ABI_VIIMEINEN_TILAUSPAIVA,
    sections: [
      {
        heading: "Abipaidat penkkareihin 2027",
        paragraphs: [
          "Penkkareita vietetään helmikuun puolivälissä, ja abipaita on päivän asu: koko vuosikurssi samassa värissä, etupuolella porukan nimi ja vuosiluku, selässä jokaisen oma nimi tai lempinimi.",
          ABI_AIKATAULU,
          "Kokotaulukko kannattaa avata heti, kun porukka on sopinut paidasta. Jäsenlinkin voi jakaa luokan ryhmächattiin, ja jokainen täyttää oman rivinsä puhelimella.",
        ],
      },
      {
        heading: "Näin abipaidat tilataan",
        paragraphs: [],
        items: [
          "Suunnitelkaa etupuoli: abiporukan nimi, vuosiluku ja oma teksti tai lukion logo.",
          "Valitkaa paidan väri ja katsokaa esikatselu etu- ja selkäpuolesta.",
          "Vetäjä luo ryhmän, valitsee maksutavan ja jakaa jäsenlinkin.",
          "Jokainen kirjoittaa selkänimensä ja kokonsa ja maksaa oman paitansa, jos vetäjä ei maksa kaikkia.",
          "Tilaus lähtee painoon, kun kaikki ovat maksaneet tai kun vetäjä lukitsee sen.",
        ],
      },
      { heading: "Hinnat ja määräalennus", paragraphs: [RYHMA_HINTALAUSE, RYHMA_SAANNOT[3]] },
      { heading: "Maksu ja lukitus", paragraphs: RYHMA_SAANNOT },
    ],
    faqs: [
      { q: "Milloin abipaidat pitää tilata, jotta ne ehtivät penkkareihin?", a: ABI_AIKATAULU },
      ...yhteisetFaqs("abipaita"),
      { q: "Voiko abipaitaan laittaa lukion logon?", a: "Voi. Ladatkaa logo PNG- tai SVG-tiedostona, niin se painetaan etupuolelle ryhmän nimen ja vuosiluvun kanssa. Käyttäkää logoa, jonka käyttöön teillä on lupa." },
    ],
  },
  "/polttarit": {
    tyyppi: "polttarit",
    path: "/polttarit",
    ...STATIC_PAGE_META["/polttarit"],
    intro: [
      STATIC_PAGE_META["/polttarit"].intro,
      "Etupuolelle tulee polttariporukan teksti, esimerkiksi päivämäärä tai kunniavieraan nimi, ja jokaisen selkään oma lempinimi.",
    ],
    esimerkki: { nimi: "Annan polttarit", vuosi: "2027", teksti: "Viimeinen vapaa ilta", jasenet: ["Morsian", "Kaaso", "Sari"] },
    sections: [
      {
        heading: "Polttaripaidat koko porukalle",
        paragraphs: [
          "Samat paidat kokoavat polttariporukan: kunniavieras erottuu omalla selkätekstillään, ja muut saavat lempinimensä selkään. Kuvissa porukka näyttää porukalta.",
          `Kokotaulukko kerää koot ilman viestiketjua, ja jokainen voi maksaa oman paitansa. Paidat ovat perillä ${RYHMA_TOIMITUSAIKA} arkipäivässä, joten lukitkaa tilaus vähintään kolme viikkoa ennen juhlaa.`,
        ],
      },
      {
        heading: "Tekstiideoita polttaripaitoihin",
        paragraphs: [],
        items: ["Etupuolelle: Annan polttarit 2027, Viimeinen vapaa ilta tai Game over.", "Selkään: Morsian, Sulhanen, Kaaso, Bestman tai jokaisen oma lempinimi.", "Numero selkään: hääpäivän päivä tai porukan sisäpiirin vitsi."],
      },
      { heading: "Hinnat ja määräalennus", paragraphs: [RYHMA_HINTALAUSE, RYHMA_SAANNOT[3]] },
      { heading: "Maksu ja lukitus", paragraphs: RYHMA_SAANNOT },
    ],
    faqs: [
      { q: "Kuinka ajoissa polttaripaidat pitää tilata?", a: `Lukitkaa tilaus vähintään kolme viikkoa ennen polttareita. Paidat ovat perillä ${RYHMA_TOIMITUSAIKA} arkipäivässä siitä, kun tilaus lähtee painoon.` },
      ...yhteisetFaqs("polttaripaita"),
    ],
  },
  "/joukkueet": {
    tyyppi: "joukkue",
    path: "/joukkueet",
    ...STATIC_PAGE_META["/joukkueet"],
    intro: [
      STATIC_PAGE_META["/joukkueet"].intro,
      "Etupuolelle tulee joukkueen nimi ja logo, ja selkään jokaisen pelaajan nimi ja numero.",
    ],
    esimerkki: { nimi: "FC Kulmapotku", vuosi: "2026", teksti: "Harrastesarja", jasenet: ["Virtanen", "Mäki", "Laine"] },
    sections: [
      {
        heading: "Joukkuepaidat nimellä ja numerolla",
        paragraphs: [
          "Harrastejoukkue, firman futisporukka, sählyvuoro tai pubivisatiimi: samat paidat, joukkueen nimi rinnassa ja jokaisen nimi ja numero selässä. T-paita sopii lämmittelyyn, turnausmatkalle ja kannustukseen.",
          "Jokainen pelaaja täyttää oman nimensä, numeronsa ja kokonsa jaetusta linkistä, ja joukkueenjohtaja näkee kokotaulukon yhdestä paikasta.",
        ],
      },
      { heading: "Hinnat ja määräalennus", paragraphs: [RYHMA_HINTALAUSE, RYHMA_SAANNOT[3]] },
      { heading: "Maksu ja lukitus", paragraphs: RYHMA_SAANNOT },
    ],
    faqs: [
      { q: "Saako joukkuepaitaan pelinumeron?", a: "Saa. Jokainen pelaaja kirjoittaa kokotaulukkoon nimensä ja halutessaan numeron 0-99, ja numero painetaan isona nimen alle." },
      ...yhteisetFaqs("joukkuepaita"),
    ],
  },
  "/yhdistykset": {
    tyyppi: "yhdistys",
    path: "/yhdistykset",
    ...STATIC_PAGE_META["/yhdistykset"],
    intro: [
      STATIC_PAGE_META["/yhdistykset"].intro,
      "Etupuolelle tulee yhdistyksen nimi ja logo tai tunnuslause, ja selkään jokaisen jäsenen nimi tai tehtävä.",
    ],
    esimerkki: { nimi: "Kylän kuoro", vuosi: "1987", teksti: "Laulaen läpi elämän", jasenet: ["Puheenjohtaja", "Leena", "Matti"] },
    sections: [
      {
        heading: "Paidat yhdistykselle, kerholle ja seuralle",
        paragraphs: [
          "Kuoro, partiolippukunta, kyläyhdistys, opiskelijajärjestö tai harrastuskerho: yhteinen paita tapahtumiin, talkoisiin ja esiintymisiin. Etupuolelle yhdistyksen nimi ja perustamisvuosi tai logo, selkään jäsenen nimi tai tehtävä.",
          "Kun jokainen maksaa oman paitansa jaetusta linkistä, rahastonhoitajan ei tarvitse kerätä maksuja erikseen.",
        ],
      },
      { heading: "Hinnat ja määräalennus", paragraphs: [RYHMA_HINTALAUSE, RYHMA_SAANNOT[3]] },
      { heading: "Maksu ja lukitus", paragraphs: RYHMA_SAANNOT },
    ],
    faqs: [
      { q: "Voiko yhdistys maksaa paidat yhdellä maksulla?", a: "Voi. Valitkaa maksutavaksi vetäjä maksaa, jolloin jäsenet täyttävät vain nimensä ja kokonsa ja vetäjä maksaa kaikki paidat kerralla lukituksen yhteydessä." },
      ...yhteisetFaqs("yhdistyksen paita"),
    ],
  },
};

export const RYHMA_POLUT = Object.keys(RYHMA_SIVUT) as RyhmaPolku[];
export const ryhmaSivuTyypille = (t: RyhmaTyyppi) => Object.values(RYHMA_SIVUT).find((s) => s.tyyppi === t)!;
export { RYHMA_NIMI_MAX, SELKA_NIMI_MAX, RYHMA_MIN_KPL, RYHMA_MAX_KPL };
